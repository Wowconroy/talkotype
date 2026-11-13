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
import {
  AUDIO_LANGUAGES,
  DEFAULT_TRANSCRIBE_OPTIONS,
  MODE_PRODUCT_LABEL,
  MODE_TO_MODEL,
  TRANSCRIPTION_MODES,
  type QuotaSnapshot,
  type TranscribeOptions,
  type TranscriptionMode,
} from "./types";

const OPTIONS_STORAGE_KEY = "talkotype.transcribeOptions";

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
    return { ...DEFAULT_TRANSCRIBE_OPTIONS, ...parsed };
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

function languageLabel(value: string) {
  return (
    AUDIO_LANGUAGES.find((lang) => lang.value === value)?.label ?? "Auto-detect"
  );
}

function modeLabel(mode: TranscriptionMode) {
  return (
    TRANSCRIPTION_MODES.find((item) => item.id === mode)?.name ??
    MODE_PRODUCT_LABEL[mode]
  );
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
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [touchedLanguage, setTouchedLanguage] = useState(false);
  const [touchedMode, setTouchedMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hitLimit, setHitLimit] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [pendingPick, setPendingPick] = useState<File[] | null>(null);

  useEffect(() => {
    if (!open) {
      setHitLimit(false);
      setError(null);
      setMessage(null);
      setUploads([]);
      setPendingPick(null);
      setBusy(false);
      setOptionsOpen(false);
      setTouchedLanguage(false);
      setTouchedMode(false);
      setDragging(false);
      return;
    }
    setOptions(loadSavedOptions());
  }, [open]);

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
  const extrasOn =
    Number(options.speakers) +
    Number(options.transcribeToEnglish) +
    Number(options.filterFillers) +
    Number(options.preferTimestamps);

  function patchUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function maybeCloseOptions(next: {
    language?: boolean;
    mode?: boolean;
  }) {
    const languageDone = next.language ?? touchedLanguage;
    const modeDone = next.mode ?? touchedMode;
    if (languageDone && modeDone) {
      setOptionsOpen(false);
      setTouchedLanguage(false);
      setTouchedMode(false);
    }
  }

  function openOptionsPanel() {
    setTouchedLanguage(false);
    setTouchedMode(false);
    setOptionsOpen(true);
  }

  function openFilePicker() {
    if (busy || blocked) return;
    if (optionsOpen) {
      setError("Finish choosing language and mode first, then add files.");
      return;
    }
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
          speakers: options.speakers,
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

  async function uploadFiles(fileList: FileList | File[]) {
    // Copy immediately — clearing <input value> empties a live FileList.
    const all = Array.from(fileList);
    if (all.length === 0) return;

    if (optionsOpen) {
      setError("Finish choosing language and mode first, then add files.");
      return;
    }

    const decision = selectUploadBatch(
      plan,
      all.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    );

    if (!decision.ok && decision.needsChoice) {
      const byKey = new Map(all.map((f) => [`${f.name}::${f.size}`, f]));
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
    const files = all.filter((f) => allowedKeys.has(`${f.name}::${f.size}`));
    if (files.length === 0) {
      setError("No valid files to upload.");
      return;
    }

    // Pre-validate so rejected formats show before the pool starts.
    const rejected = files
      .map((file) => ({
        file,
        result: validateUploadCandidate(plan, {
          name: file.name,
          size: file.size,
          type: file.type,
        }),
      }))
      .filter((item) => !item.result.ok);

    if (rejected.length === files.length) {
      setError(rejected[0]?.result.ok === false ? rejected[0].result.error : "File rejected.");
      return;
    }

    setPendingPick(null);
    setBusy(true);
    setMessage(null);

    const items: UploadItem[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      progress: 0,
      status: "queued",
    }));
    setUploads(items);

    const work = files.map((file, i) => ({ file, id: items[i].id }));
    const concurrency = uploadPoolSize(plan);
    const results: Array<"done" | "error" | "cancelled"> = [];
    await runPool(work, concurrency, async ({ file, id }) => {
      results.push(await uploadOne(file, id));
    });

    setBusy(false);
    const doneCount = results.filter((r) => r === "done").length;
    const failCount = results.filter((r) => r === "error").length;

    // All queued successfully — close so the desk shows live progress.
    if (doneCount > 0 && failCount === 0) {
      onClose();
      return;
    }

    setMessage(
      doneCount > 0
        ? `Uploaded ${doneCount} file${doneCount === 1 ? "" : "s"}; ${failCount} failed.`
        : "Upload failed. Fix the error and try again.",
    );
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
    void uploadFiles(files);
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
                if (files.length) void uploadFiles(files);
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
                {busy
                  ? "Uploading…"
                  : dragging
                    ? "Drop to upload"
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

            <div className="mt-4 rounded-2xl border border-border/80 bg-mist/40 px-3.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Selected options
                  </p>
                  <p className="mt-1 truncate text-sm text-ink">
                    {languageLabel(options.language)} · {modeLabel(options.mode)}
                    {extrasOn > 0 ? ` · ${extrasOn} extra` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    optionsOpen ? setOptionsOpen(false) : openOptionsPanel()
                  }
                  className="shrink-0 text-sm font-semibold text-coral hover:underline disabled:opacity-60"
                >
                  {optionsOpen ? "Hide options" : "Change options"}
                </button>
              </div>

              {optionsOpen ? (
                <div className="mt-3 space-y-4 border-t border-border/70 pt-3">
                  <LanguageSelect
                    value={options.language}
                    disabled={busy}
                    onChange={(language) => {
                      setOptions((o) => ({ ...o, language }));
                      setTouchedLanguage(true);
                      maybeCloseOptions({ language: true });
                    }}
                  />
                  <ModePicker
                    value={options.mode}
                    disabled={busy}
                    onChange={(mode) => {
                      setOptions((o) => ({ ...o, mode }));
                      setTouchedMode(true);
                      maybeCloseOptions({ mode: true });
                    }}
                  />
                  <div className="space-y-2.5 rounded-2xl border border-border/70 bg-white p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      More settings
                    </p>
                    <Toggle
                      label="Recognize speakers"
                      hint={
                        isUnlimited
                          ? "Labels who spoke when"
                          : "Requires Unlimited plan"
                      }
                      checked={options.speakers}
                      disabled={!isUnlimited}
                      onChange={(speakers) =>
                        setOptions((o) => ({ ...o, speakers }))
                      }
                    />
                    <Toggle
                      label="Transcribe to English"
                      hint="Forces English output language"
                      checked={options.transcribeToEnglish}
                      onChange={(transcribeToEnglish) =>
                        setOptions((o) => ({ ...o, transcribeToEnglish }))
                      }
                    />
                    <Toggle
                      label="Filter filler words"
                      hint="Stored as a preference; applied when supported"
                      checked={options.filterFillers}
                      onChange={(filterFillers) =>
                        setOptions((o) => ({ ...o, filterFillers }))
                      }
                    />
                    <Toggle
                      label="Prefer timestamps"
                      hint="Keep timed segments for editor and exports"
                      checked={options.preferTimestamps}
                      onChange={(preferTimestamps) =>
                        setOptions((o) => ({ ...o, preferTimestamps }))
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose language and mode to return to the upload form.
                    Transcription still starts when you add files.
                  </p>
                </div>
              ) : null}
            </div>

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
                        onClick={() => void uploadFiles([file])}
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

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-mist"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-3 ${
        disabled ? "cursor-not-allowed opacity-55" : ""
      }`}
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint ? (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        className="mt-1 size-4 accent-coral"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
