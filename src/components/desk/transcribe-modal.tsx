"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Link2, Upload, X } from "lucide-react";
import { ACCEPT_ATTR } from "@/lib/accepted-media";
import {
  formatBytes,
  FREE_TRANSCRIBE_SECONDS,
  maxFileSeconds,
  maxUploadBytes,
  UNLIMITED_MAX_CONCURRENT,
} from "@/lib/plan-limits";
import {
  selectUploadBatch,
  uploadPoolSize,
  validateUploadCandidate,
} from "@/lib/upload-batch";
import { LanguageSelect } from "./language-select";
import { ModePicker } from "./mode-picker";
import {
  isQuotaLimitError,
  QuotaLimitNotice,
} from "./quota-limit-notice";
import { TranscribeMoreSettings } from "./transcribe-more-settings";
import {
  DEFAULT_TRANSCRIBE_OPTIONS,
  MODE_TO_MODEL,
  normalizeSpeakerCount,
  type QuotaSnapshot,
  type TranscribeOptions,
} from "./types";

const OPTIONS_STORAGE_KEY = "talkotype.transcribeOptions.v5";

type Props = {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
  isUnlimited: boolean;
  limitReached?: boolean;
  onUploaded: (quota?: QuotaSnapshot | null) => void;
  onOpenImportLink: () => void;
};

type UploadItem = {
  id: string;
  name: string;
  progress: number;
  status: "queued" | "uploading" | "done" | "error" | "cancelled";
  error?: string;
  abort?: () => void;
};

function putWithProgress(
  url: string,
  file: File,
  headers: HeadersInit,
  onProgress: (pct: number) => void,
): { promise: Promise<void>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<void>((resolve, reject) => {
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else
        reject(
          new Error(
            `Upload to storage failed (${xhr.status}). Check R2 CORS for talkotype.app.`,
          ),
        );
    };
    xhr.onerror = () =>
      reject(new Error("Network request failed during upload."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.open("PUT", url);
    const headerRecord =
      headers instanceof Headers
        ? Object.fromEntries(headers.entries())
        : Array.isArray(headers)
          ? Object.fromEntries(headers)
          : headers;
    for (const [key, value] of Object.entries(headerRecord)) {
      if (value != null) xhr.setRequestHeader(key, String(value));
    }
    xhr.send(file);
  });
  return { promise, abort: () => xhr.abort() };
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (index < items.length) {
        const current = items[index++];
        await worker(current);
      }
    },
  );
  await Promise.all(runners);
}

function loadSavedOptions(): TranscribeOptions {
  if (typeof window === "undefined") return DEFAULT_TRANSCRIBE_OPTIONS;
  try {
    const raw = window.localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_TRANSCRIBE_OPTIONS;
    const parsed = JSON.parse(raw) as Partial<TranscribeOptions>;
    return {
      ...DEFAULT_TRANSCRIBE_OPTIONS,
      ...parsed,
      speakerCount: normalizeSpeakerCount(
        parsed.speakerCount ?? DEFAULT_TRANSCRIBE_OPTIONS.speakerCount,
      ),
    };
  } catch {
    return DEFAULT_TRANSCRIBE_OPTIONS;
  }
}

function saveOptions(options: TranscribeOptions) {
  try {
    window.localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options));
  } catch {
    // ignore quota / private mode
  }
}

export function TranscribeModal({
  open,
  onClose,
  folderId,
  isUnlimited,
  limitReached = false,
  onUploaded,
  onOpenImportLink,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [options, setOptions] = useState<TranscribeOptions>(
    DEFAULT_TRANSCRIBE_OPTIONS,
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hitLimit, setHitLimit] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [pendingPick, setPendingPick] = useState<File[] | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) return;
    // Fresh UI each time the modal opens. In-flight uploads keep running after close.
    setHitLimit(false);
    setError(null);
    setMessage(null);
    setUploads([]);
    setPendingPick(null);
    setSelectedFiles([]);
    setBusy(false);
    setMoreOpen(false);
    setDragging(false);
    const saved = loadSavedOptions();
    // Free plan never keeps speakers on (menu is locked).
    setOptions(
      isUnlimited ? saved : { ...saved, speakers: false },
    );
  }, [open, isUnlimited]);

  useEffect(() => {
    if (!open) return;
    saveOptions(options);
  }, [open, options]);

  if (!open) return null;

  const blocked = limitReached || hitLimit;
  const plan = isUnlimited ? "unlimited" : "free";
  const uploadCap = maxUploadBytes(plan);
  const freeMinutes = Math.round(FREE_TRANSCRIBE_SECONDS / 60);
  const maxHours = Math.round(maxFileSeconds("unlimited") / 3600);

  function patchUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function openFilePicker() {
    if (busy || blocked) return;
    inputRef.current?.click();
  }

  async function uploadOne(
    file: File,
    itemId: string,
  ): Promise<"done" | "error" | "cancelled"> {
    const validated = validateUploadCandidate(plan, {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (!validated.ok) {
      patchUpload(itemId, { status: "error", error: validated.error });
      setError(validated.error);
      return "error";
    }

    let step = "create";
    try {
      const language = options.transcribeToEnglish
        ? "en"
        : options.language || undefined;

      patchUpload(itemId, { status: "uploading", progress: 0 });

      step = "create";
      const createRes = await fetch("/api/transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          requestedLanguage: language,
          transcriptionMode: options.mode,
          transcriptionModel: MODE_TO_MODEL[options.mode],
          speakers: isUnlimited && options.speakers,
          speakerCount:
            isUnlimited && options.speakers
              ? normalizeSpeakerCount(options.speakerCount)
              : undefined,
          folderId,
          filterFillers: options.filterFillers,
          preferTimestamps: options.preferTimestamps,
          transcribeToEnglish: options.transcribeToEnglish,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        if (isQuotaLimitError(created.error)) {
          setHitLimit(true);
          onUploaded(
            (created as { quota?: QuotaSnapshot | null }).quota ?? null,
          );
          patchUpload(itemId, {
            status: "error",
            error: created.error || "Plan limit reached",
          });
          setError(created.error || "Plan limit reached");
          return "error";
        }
        throw new Error(created.error || "Could not start upload");
      }

      step = "storage";
      const put = putWithProgress(
        created.upload.url as string,
        file,
        created.upload.headers as HeadersInit,
        (pct) => patchUpload(itemId, { progress: pct }),
      );
      patchUpload(itemId, { abort: put.abort });
      await put.promise;

      step = "queue";
      const complete = await fetch(
        `/api/transcripts/${created.transcript.id}/complete-upload`,
        { method: "POST" },
      );
      if (!complete.ok) {
        const body = await complete.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error || "Could not queue transcription",
        );
      }

      patchUpload(itemId, { status: "done", progress: 100, abort: undefined });
      onUploaded(
        (created as { quota?: QuotaSnapshot | null }).quota ?? null,
      );
      return "done";
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Upload failed";
      if (raw === "Upload cancelled.") {
        patchUpload(itemId, { status: "cancelled", error: raw });
        return "cancelled";
      }
      const hint =
        raw === "Failed to fetch" || /network|cors/i.test(raw)
          ? step === "storage"
            ? "Browser blocked the upload to Cloudflare R2 (usually CORS)."
            : "Network request failed. Check connection and try again."
          : raw;
      patchUpload(itemId, { status: "error", error: hint });
      setError(hint);
      return "error";
    }
  }

  function fileKey(file: File) {
    return `${file.name}::${file.size}`;
  }

  /** Stage files for the Transcribe button — do not upload yet. */
  function stageFiles(fileList: FileList | File[]) {
    const all = Array.from(fileList);
    if (all.length === 0) return;

    const decision = selectUploadBatch(
      plan,
      all.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    );

    if (!decision.ok && decision.needsChoice) {
      const byKey = new Map(all.map((f) => [fileKey(f), f]));
      setPendingPick(
        decision.files
          .map((c) => byKey.get(`${c.name}::${c.size}`))
          .filter((f): f is File => Boolean(f)),
      );
      setError(decision.error);
      return;
    }

    if (!decision.ok) {
      setError(decision.error);
      return;
    }

    if (decision.truncated) {
      setError(
        `Unlimited uploads up to ${decision.maxBatch} files per batch. Extra files were ignored.`,
      );
    } else {
      setError(null);
    }

    const allowedKeys = new Set(
      decision.files.map((f) => `${f.name}::${f.size}`),
    );
    const incoming = all.filter((f) => allowedKeys.has(fileKey(f)));
    if (incoming.length === 0) {
      setError("No valid files to upload.");
      return;
    }

    const rejected = incoming
      .map((file) => ({
        file,
        result: validateUploadCandidate(plan, {
          name: file.name,
          size: file.size,
          type: file.type,
        }),
      }))
      .filter((item) => !item.result.ok);

    if (rejected.length === incoming.length) {
      setError(
        rejected[0]?.result.ok === false
          ? rejected[0].result.error
          : "File rejected.",
      );
      return;
    }

    const accepted = incoming.filter((file) =>
      validateUploadCandidate(plan, {
        name: file.name,
        size: file.size,
        type: file.type,
      }).ok,
    );

    setPendingPick(null);
    setMessage(null);
    setSelectedFiles((prev) => {
      const merged = new Map(prev.map((f) => [fileKey(f), f]));
      for (const file of accepted) merged.set(fileKey(file), file);
      const next = Array.from(merged.values());
      if (!isUnlimited && next.length > 1) {
        // Free plan: keep the latest single file.
        return [next[next.length - 1]!];
      }
      return next.slice(0, decision.maxBatch ?? next.length);
    });
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    setBusy(true);
    setMessage(null);
    setError(null);

    const items: UploadItem[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      progress: 0,
      status: "queued",
    }));
    setUploads(items);

    const work = files.map((file, i) => ({ file, id: items[i]!.id }));
    const concurrency = uploadPoolSize(plan);
    const results: Array<"done" | "error" | "cancelled"> = [];
    await runPool(work, concurrency, async ({ file, id }) => {
      results.push(await uploadOne(file, id));
    });

    setBusy(false);
    const doneCount = results.filter((r) => r === "done").length;
    const failCount = results.filter((r) => r === "error").length;

    if (doneCount > 0 && failCount === 0) {
      return;
    }

    // Modal may already be closed — surface failures on next open via desk poll.
    setMessage(
      doneCount > 0
        ? `Uploaded ${doneCount} file${doneCount === 1 ? "" : "s"}; ${failCount} failed.`
        : "Upload failed. Fix the error and try again.",
    );
  }

  function startTranscribe() {
    if (busy || blocked || selectedFiles.length === 0) return;
    const files = [...selectedFiles];
    setSelectedFiles([]);
    // Close immediately; upload + desk progress continue in the background.
    onClose();
    void uploadFiles(files);
  }

  function removeSelected(file: File) {
    setSelectedFiles((prev) => prev.filter((f) => fileKey(f) !== fileKey(file)));
  }

  function cancelUpload(id: string) {
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id);
      item?.abort?.();
      return prev.map((u) =>
        u.id === id
          ? { ...u, status: "cancelled", error: "Upload cancelled." }
          : u,
      );
    });
  }

  function onFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    // Snapshot before reset — required for retrying the same file later.
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return; // cancelled picker; keep existing selection
    stageFiles(files);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-[0_30px_60px_rgba(18,61,58,0.18)] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
              Transcribe
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Transcribe files
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Drop audio or video, or import from a public link.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-mist hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        {blocked ? (
          <QuotaLimitNotice className="mt-5" />
        ) : (
          <>
            <div className="mt-5 flex justify-start">
              <button
                type="button"
                disabled={busy}
                onClick={onOpenImportLink}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-60"
              >
                <Link2 className="size-4 text-sea" />
                Import from link
              </button>
            </div>

            <div
              role="button"
              tabIndex={busy ? -1 : 0}
              aria-label="Drag and drop files here, or click to browse"
              aria-disabled={busy}
              onClick={() => openFilePicker()}
              onKeyDown={(e) => {
                if (busy) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (busy) return;
                const files = Array.from(e.dataTransfer.files ?? []);
                if (files.length) stageFiles(files);
              }}
              className={`mt-3 cursor-pointer rounded-2xl border border-dashed px-5 py-10 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-sea ${
                dragging
                  ? "border-coral bg-coral-soft/50 ring-2 ring-coral/40"
                  : "border-sea/50 bg-secondary/40 hover:border-sea"
              } ${busy ? "cursor-wait opacity-80" : ""}`}
            >
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-white text-coral shadow-sm">
                <Upload className="size-5" />
              </div>
              <p className="font-display text-lg font-semibold text-ink">
                {dragging
                  ? "Drop to add files"
                  : selectedFiles.length > 0
                    ? "Add more files, or click Transcribe below."
                    : "Drag and drop files here, or click to browse."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                MP3, MP4, M4A, MOV, AAC, WAV, OGG, OPUS, MPEG, WMA, WMV · max{" "}
                {formatBytes(uploadCap)}
                {isUnlimited
                  ? ` · up to ${UNLIMITED_MAX_CONCURRENT} per batch`
                  : ` · first ${freeMinutes} min transcribed`}
              </p>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ACCEPT_ATTR}
                multiple={isUnlimited}
                disabled={busy}
                onChange={onFileInputChange}
                onClick={(e) => e.stopPropagation()}
              />
              <p
                className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {isUnlimited
                  ? `Unlimited keeps originals forever while your plan is active. Up to ${maxHours} hours per file.`
                  : `Free keeps originals for 7 days. Longer files are clipped to the first ${freeMinutes} minutes.`}{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-ink underline"
                >
                  Privacy
                </Link>{" "}
                ·{" "}
                <Link href="/terms" className="font-semibold text-ink underline">
                  Terms
                </Link>
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <LanguageSelect
                value={options.language}
                disabled={busy}
                onChange={(language) =>
                  setOptions((o) => ({ ...o, language }))
                }
              />
              <ModePicker
                value={options.mode}
                disabled={busy}
                onChange={(mode) => setOptions((o) => ({ ...o, mode }))}
              />
              <p className="text-xs text-muted-foreground">
                Swift is quickest. Steady (default) uses the stronger model for
                clearer words. Deep adds a second pass and fills more skipped
                gaps.
              </p>
            </div>

            <TranscribeMoreSettings
              options={options}
              onChange={setOptions}
              isUnlimited={isUnlimited}
              moreOpen={moreOpen}
              onToggleMore={() => setMoreOpen((v) => !v)}
              disabled={busy}
            />

            {pendingPick ? (
              <div className="mt-4 rounded-2xl border border-border bg-mist/60 p-3.5">
                <p className="text-sm font-semibold text-ink">
                  Choose one file (free plan)
                </p>
                <ul className="mt-2 space-y-1.5">
                  {pendingPick.map((file) => (
                    <li key={`${file.name}::${file.size}`}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => stageFiles([file])}
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-left text-sm text-ink hover:border-sea"
                      >
                        {file.name}{" "}
                        <span className="text-muted-foreground">
                          ({formatBytes(file.size)})
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selectedFiles.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {selectedFiles.map((file) => (
                  <li
                    key={fileKey(file)}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelected(file)}
                      className="shrink-0 text-xs font-semibold text-coral hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {uploads.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {uploads.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border/80 bg-white px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-ink">
                        {item.name}
                      </p>
                      {item.status === "uploading" ||
                      item.status === "queued" ? (
                        <button
                          type="button"
                          onClick={() => cancelUpload(item.id)}
                          className="shrink-0 text-xs font-semibold text-coral hover:underline"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.status === "error" || item.status === "cancelled"
                            ? "bg-coral"
                            : item.status === "done"
                              ? "bg-sea"
                              : "bg-coral/80"
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.status === "uploading"
                        ? `Uploading ${item.progress}%`
                        : item.status === "queued"
                          ? "Waiting in upload pool…"
                          : item.status === "done"
                            ? "Queued for transcription"
                            : item.error || item.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            {message ? (
              <p className="mt-4 rounded-xl bg-sea/15 px-3 py-2 text-sm text-ink">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="mt-4 rounded-xl bg-coral-soft px-3 py-2 text-sm text-coral">
                {error}
              </p>
            ) : null}
          </>
        )}

        {blocked ? null : (
          <div className="mt-6">
            <button
              type="button"
              disabled={busy || selectedFiles.length === 0}
              onClick={() => startTranscribe()}
              className="w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedFiles.length === 0
                ? "Transcribe"
                : selectedFiles.length === 1
                  ? "Transcribe"
                  : `Transcribe ${selectedFiles.length} files`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

