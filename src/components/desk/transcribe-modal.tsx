"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Link2, Upload, X } from "lucide-react";
import { ACCEPT_ATTR, isAcceptedMediaFile } from "@/lib/accepted-media";
import {
  formatBytes,
  FREE_TRANSCRIBE_SECONDS,
  maxUploadBytes,
  UNLIMITED_MAX_CONCURRENT,
  UNLIMITED_UPLOAD_POOL,
} from "@/lib/plan-limits";
import { LanguageSelect } from "./language-select";
import { ModePicker } from "./mode-picker";
import {
  isQuotaLimitError,
  QuotaLimitNotice,
} from "./quota-limit-notice";
import {
  DEFAULT_TRANSCRIBE_OPTIONS,
  MODE_TO_MODEL,
  type QuotaSnapshot,
  type TranscribeOptions,
} from "./types";

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
    xhr.onerror = () => reject(new Error("Network request failed during upload."));
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

  useEffect(() => {
    if (!open) {
      setHitLimit(false);
      setError(null);
      setMessage(null);
      setUploads([]);
      setPendingPick(null);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const blocked = limitReached || hitLimit;
  const uploadCap = maxUploadBytes(isUnlimited ? "unlimited" : "free");
  const freeMinutes = Math.round(FREE_TRANSCRIBE_SECONDS / 60);

  function patchUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function uploadOne(file: File, itemId: string) {
    const accepted = isAcceptedMediaFile({
      filename: file.name,
      contentType: file.type,
    });
    if (!accepted.ok) {
      patchUpload(itemId, { status: "error", error: accepted.error });
      return;
    }
    if (file.size > uploadCap) {
      patchUpload(itemId, {
        status: "error",
        error: `Too large for your plan (max ${formatBytes(uploadCap)}).`,
      });
      return;
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
          return;
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
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Upload failed";
      if (raw === "Upload cancelled.") {
        patchUpload(itemId, { status: "cancelled", error: raw });
        return;
      }
      const hint =
        raw === "Failed to fetch" || /network|cors/i.test(raw)
          ? step === "storage"
            ? "Browser blocked the upload to Cloudflare R2 (usually CORS)."
            : "Network request failed. Check connection and try again."
          : raw;
      patchUpload(itemId, { status: "error", error: hint });
    }
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const all = Array.from(fileList);
    if (all.length === 0) return;

    if (!isUnlimited) {
      if (all.length > 1) {
        setPendingPick(all.slice(0, 12));
        setError(
          "Free plan allows one active upload at a time. Choose which file to upload.",
        );
        return;
      }
    } else if (all.length > UNLIMITED_MAX_CONCURRENT) {
      setError(
        `Unlimited uploads up to ${UNLIMITED_MAX_CONCURRENT} files per batch. Extra files were ignored.`,
      );
    }

    const files = all.slice(0, isUnlimited ? UNLIMITED_MAX_CONCURRENT : 1);
    setPendingPick(null);
    setBusy(true);
    setError(null);
    setMessage(null);

    const items: UploadItem[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      progress: 0,
      status: "queued",
    }));
    setUploads(items);

    const work = files.map((file, i) => ({ file, id: items[i].id }));
    const concurrency = isUnlimited ? UNLIMITED_UPLOAD_POOL : 1;
    await runPool(work, concurrency, async ({ file, id }) => {
      await uploadOne(file, id);
    });

    setBusy(false);
    setMessage(
      files.length === 1
        ? `Finished with “${files[0].name}”.`
        : `Finished batch of ${files.length} files.`,
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
            <div
              role="button"
              tabIndex={0}
              aria-label={
                isUnlimited
                  ? "Drop files to upload, or press Enter to browse"
                  : "Drop a file to upload, or press Enter to browse"
              }
              aria-disabled={busy}
              onKeyDown={(e) => {
                if (busy) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const files = e.dataTransfer.files;
                if (files?.length && !busy) void uploadFiles(files);
              }}
              className={`mt-5 rounded-2xl border border-dashed px-5 py-10 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-sea ${
                dragging
                  ? "border-coral bg-coral-soft/50 ring-2 ring-coral/40"
                  : "border-sea/50 bg-secondary/40"
              }`}
            >
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-white text-coral shadow-sm">
                <Upload className="size-5" />
              </div>
              <p className="font-display text-lg font-semibold text-ink">
                {busy
                  ? "Uploading…"
                  : dragging
                    ? "Drop to upload"
                    : isUnlimited
                      ? "Drop files here"
                      : "Drop a file here"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                MP3, MP4, M4A, MOV, AAC, WAV, OGG, OPUS, MPEG, WMA, WMV · max{" "}
                {formatBytes(uploadCap)}
                {isUnlimited
                  ? ` · up to ${UNLIMITED_MAX_CONCURRENT} per batch`
                  : ` · first ${freeMinutes} min transcribed`}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Browse files
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onOpenImportLink}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-60"
                >
                  <Link2 className="size-4 text-sea" />
                  Import from link
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ACCEPT_ATTR}
                multiple={isUnlimited}
                disabled={busy}
                onChange={(event) => {
                  const files = event.target.files;
                  event.target.value = "";
                  if (files?.length) void uploadFiles(files);
                }}
              />
              <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {isUnlimited
                  ? "Unlimited keeps originals forever while your plan is active. Target length: up to 3 hours per file."
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

            {pendingPick ? (
              <div className="mt-4 rounded-2xl border border-border bg-mist/60 p-3.5">
                <p className="text-sm font-semibold text-ink">
                  Choose one file (free plan)
                </p>
                <ul className="mt-2 space-y-1.5">
                  {pendingPick.map((file) => (
                    <li key={file.name + file.size}>
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
                        style={{
                          width: `${
                            item.status === "done"
                              ? 100
                              : item.status === "error" ||
                                  item.status === "cancelled"
                                ? item.progress
                                : item.progress
                          }%`,
                        }}
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

            <div className="mt-5 space-y-4">
              <LanguageSelect
                value={options.language}
                disabled={busy}
                onChange={(language) => setOptions((o) => ({ ...o, language }))}
              />
              <ModePicker
                value={options.mode}
                disabled={busy}
                onChange={(mode) => setOptions((o) => ({ ...o, mode }))}
              />
            </div>

            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="mt-4 text-sm font-semibold text-coral hover:underline"
            >
              {moreOpen ? "Hide" : "Speaker recognition & more settings"}
            </button>

            {moreOpen ? (
              <div className="mt-3 space-y-2.5 rounded-2xl border border-border/70 bg-mist/50 p-3.5">
                <Toggle
                  label="Recognize speakers"
                  hint={
                    isUnlimited
                      ? "Labels who spoke when (provider support pending verification)"
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
                  hint="Stored as a preference; applied when the processor supports it"
                  checked={options.filterFillers}
                  onChange={(filterFillers) =>
                    setOptions((o) => ({ ...o, filterFillers }))
                  }
                />
                <Toggle
                  label="Prefer timestamps"
                  hint="Keep timed segments for the editor and future subtitle exports"
                  checked={options.preferTimestamps}
                  onChange={(preferTimestamps) =>
                    setOptions((o) => ({ ...o, preferTimestamps }))
                  }
                />
              </div>
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
