"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Link2, X } from "lucide-react";
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

type Props = {
  open: boolean;
  onClose: () => void;
  onBackToFiles: () => void;
  folderId: string | null;
  isUnlimited: boolean;
  limitReached?: boolean;
  onImported: (quota?: QuotaSnapshot | null) => void;
};

export function ImportLinkModal({
  open,
  onClose,
  onBackToFiles,
  folderId,
  isUnlimited,
  limitReached = false,
  onImported,
}: Props) {
  const [url, setUrl] = useState("");
  const [options, setOptions] = useState<TranscribeOptions>(
    DEFAULT_TRANSCRIBE_OPTIONS,
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hitLimit, setHitLimit] = useState(false);

  useEffect(() => {
    if (!open) {
      setHitLimit(false);
      setError(null);
      setBusy(false);
      setMoreOpen(false);
      return;
    }
    setOptions(
      isUnlimited
        ? DEFAULT_TRANSCRIBE_OPTIONS
        : { ...DEFAULT_TRANSCRIBE_OPTIONS, speakers: false },
    );
  }, [open, isUnlimited]);

  if (!open) return null;

  const blocked = limitReached || hitLimit;

  async function onTranscribe() {
    if (blocked) {
      setHitLimit(true);
      return;
    }
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a media URL first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const language = options.transcribeToEnglish
        ? "en"
        : options.language || undefined;
      const res = await fetch("/api/transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: trimmed,
          title: deriveTitle(trimmed),
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
      const data = await res.json();
      if (!res.ok) {
        if (isQuotaLimitError(data.error)) {
          setHitLimit(true);
          onImported(
            (data as { quota?: QuotaSnapshot | null }).quota ?? null,
          );
          return;
        }
        throw new Error(data.error || "Could not import link");
      }
      setUrl("");
      onImported((data as { quota?: QuotaSnapshot | null }).quota ?? null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-[0_30px_60px_rgba(18,61,58,0.18)] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
              Import
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Import from link
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Paste a direct public media URL (MP3, MP4, and similar). YouTube,
              Drive, and Dropbox download pipelines are not live yet.
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
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onBackToFiles}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-60"
              >
                <ArrowLeft className="size-4 text-sea" />
                Upload files
              </button>
              {["YouTube", "Google Drive", "Dropbox", "Direct URL"].map(
                (label) => (
                  <span
                    key={label}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      label === "Direct URL"
                        ? "bg-sea/15 text-ink"
                        : "bg-mist text-muted-foreground"
                    }`}
                  >
                    {label}
                    {label !== "Direct URL" ? " · soon" : ""}
                  </span>
                ),
              )}
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Media URL
              </span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-mist/40 px-3 py-2.5 focus-within:border-sea focus-within:ring-2 focus-within:ring-sea/30">
                <Link2 className="size-4 shrink-0 text-sea" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>

            <div className="mt-4 space-y-4">
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

            <TranscribeMoreSettings
              options={options}
              onChange={setOptions}
              isUnlimited={isUnlimited}
              moreOpen={moreOpen}
              onToggleMore={() => setMoreOpen((v) => !v)}
              disabled={busy}
            />

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
              disabled={busy || !url.trim()}
              onClick={() => void onTranscribe()}
              className="w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Queuing…" : "Transcribe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function deriveTitle(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `Link · ${host}`;
  } catch {
    return "Imported link";
  }
}
