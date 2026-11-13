"use client";

import Link from "next/link";
import type { TranscribeOptions } from "./types";

export const SPEAKER_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type Props = {
  options: TranscribeOptions;
  onChange: (next: TranscribeOptions) => void;
  isUnlimited: boolean;
  moreOpen: boolean;
  onToggleMore: () => void;
  disabled?: boolean;
};

export function TranscribeMoreSettings({
  options,
  onChange,
  isUnlimited,
  moreOpen,
  onToggleMore,
  disabled,
}: Props) {
  if (!isUnlimited) {
    return (
      <div className="mt-4 rounded-2xl border border-border/80 bg-mist/50 p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-coral">
            Unlimited
          </span>
          <p className="text-sm font-semibold text-ink">
            Speaker recognition & more settings
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          On Unlimited you can label speakers (Speaker A / B / C…), pick how many
          people are talking, filter fillers, prefer timestamps, and force
          English output.
        </p>
        <Link
          href="/pricing"
          className="mt-2.5 inline-block text-xs font-semibold text-coral hover:underline"
        >
          See Unlimited →
        </Link>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggleMore}
        disabled={disabled}
        className="mt-4 text-sm font-semibold text-coral hover:underline disabled:opacity-60"
      >
        {moreOpen
          ? "Hide more settings"
          : "Speaker recognition & more settings"}
      </button>

      {moreOpen ? (
        <div className="mt-3 space-y-2.5 rounded-2xl border border-border/70 bg-mist/50 p-3.5">
          <Toggle
            label="Recognize speakers"
            hint="Labels each section with who is speaking"
            checked={options.speakers}
            disabled={disabled}
            onChange={(speakers) => onChange({ ...options, speakers })}
          />

          {options.speakers ? (
            <div className="rounded-xl border border-border/70 bg-white px-3 py-2.5">
              <label
                htmlFor="speaker-count"
                className="block text-sm font-medium text-ink"
              >
                How many speakers?
              </label>
              <select
                id="speaker-count"
                value={options.speakerCount}
                disabled={disabled}
                onChange={(e) =>
                  onChange({
                    ...options,
                    speakerCount: Number(e.target.value) || 2,
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sea"
              >
                {SPEAKER_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} speakers
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Toggle
            label="Transcribe to English"
            hint="Forces English output language"
            checked={options.transcribeToEnglish}
            disabled={disabled}
            onChange={(transcribeToEnglish) =>
              onChange({ ...options, transcribeToEnglish })
            }
          />
          <Toggle
            label="Filter filler words"
            hint="Stored as a preference; applied when supported"
            checked={options.filterFillers}
            disabled={disabled}
            onChange={(filterFillers) =>
              onChange({ ...options, filterFillers })
            }
          />
          <Toggle
            label="Prefer timestamps"
            hint="Show timed segments in the editor and exports"
            checked={options.preferTimestamps}
            disabled={disabled}
            onChange={(preferTimestamps) =>
              onChange({ ...options, preferTimestamps })
            }
          />
        </div>
      ) : null}
    </>
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
