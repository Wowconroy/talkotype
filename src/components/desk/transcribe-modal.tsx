"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Link2, Upload, X } from "lucide-react";
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

  useEffect(() => {
    if (!open) {
      setHitLimit(false);
      setError(null);
      setMessage(null);
    }
  }, [open]);

  if (!open) return null;

  const blocked = limitReached || hitLimit;

  async function uploadFile(file: File) {
    if (blocked) {
      setHitLimit(true);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    let step = "start";
    try {
      const language = options.transcribeToEnglish
        ? "en"
        : options.language || undefined;

      step = "create";
      const createRes = await fetch("/api/transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          requestedLanguage: language,
          transcriptionModel: MODE_TO_MODEL[options.mode],
          speakers: options.speakers,
          folderId,
          filterFillers: options.filterFillers,
          preferTimestamps: options.preferTimestamps,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        if (isQuotaLimitError(created.error)) {
          setHitLimit(true);
          onUploaded(
            (created as { quota?: QuotaSnapshot | null }).quota ?? null,
          );
          return;
        }
        throw new Error(created.error || "Could not start upload");
      }

      step = "storage";
      const put = await fetch(created.upload.url as string, {
        method: "PUT",
        headers: created.upload.headers as HeadersInit,
        body: file,
      });
      if (!put.ok) {
        throw new Error(
          `Upload to storage failed (${put.status}). Check R2 CORS for talkotype.app.`,
        );
      }

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

      setMessage(`Uploaded “${file.name}”. Transcription queued.`);
      onUploaded(
        (created as { quota?: QuotaSnapshot | null }).quota ?? null,
      );
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Upload failed";
      const hint =
        raw === "Failed to fetch" || /network|cors/i.test(raw)
          ? step === "storage"
            ? "Browser blocked the upload to Cloudflare R2 (usually CORS)."
            : "Network request failed. Check connection and try again."
          : raw;
      setError(hint);
    } finally {
      setBusy(false);
    }
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
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file && !busy) void uploadFile(file);
              }}
              className={`mt-5 rounded-2xl border border-dashed px-5 py-10 text-center transition ${
                dragging
                  ? "border-coral bg-coral-soft/50"
                  : "border-sea/50 bg-secondary/40"
              }`}
            >
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-white text-coral shadow-sm">
                <Upload className="size-5" />
              </div>
              <p className="font-display text-lg font-semibold text-ink">
                {busy ? "Uploading…" : "Drop a file here"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                MP3, WAV, M4A, MP4, and similar formats
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
                accept="audio/*,video/*"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  if (file) void uploadFile(file);
                }}
              />
              <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Only upload recordings you have the right to process.{" "}
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
                  hint="Applied when the processor supports it"
                  checked={options.filterFillers}
                  onChange={(filterFillers) =>
                    setOptions((o) => ({ ...o, filterFillers }))
                  }
                />
                <Toggle
                  label="Prefer timestamps"
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
