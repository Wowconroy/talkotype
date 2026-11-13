"use client";

import { TRANSCRIPTION_MODES, type TranscriptionMode } from "./types";

type Props = {
  value: TranscriptionMode;
  onChange: (value: TranscriptionMode) => void;
  disabled?: boolean;
};

export function ModePicker({ value, onChange, disabled }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Transcription mode
      </p>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {TRANSCRIPTION_MODES.map((mode) => {
          const selected = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(mode.id)}
              className={`group relative overflow-hidden rounded-2xl border px-2 pb-2.5 pt-2 text-left transition disabled:opacity-60 ${
                selected
                  ? mode.id === "fast"
                    ? "border-coral bg-coral-soft shadow-[0_8px_20px_rgba(255,92,69,0.18)]"
                    : mode.id === "balanced"
                      ? "border-sea bg-secondary shadow-[0_8px_20px_rgba(126,200,195,0.25)]"
                      : "border-ink bg-ink text-white shadow-[0_8px_20px_rgba(18,61,58,0.22)]"
                  : "border-border bg-white hover:border-sea/60 hover:bg-mist/60"
              }`}
            >
              <ModeArt mode={mode.id} selected={selected} />
              <p
                className={`mt-1.5 text-sm font-semibold ${
                  selected && mode.id === "accurate" ? "text-white" : "text-ink"
                }`}
              >
                {mode.name}
              </p>
              <p
                className={`text-[11px] leading-snug ${
                  selected && mode.id === "accurate"
                    ? "text-white/75"
                    : "text-muted-foreground"
                }`}
              >
                {mode.tagline}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModeArt({
  mode,
  selected,
}: {
  mode: TranscriptionMode;
  selected: boolean;
}) {
  if (mode === "fast") {
    return (
      <div className="relative mx-auto flex h-14 w-full items-center justify-center">
        <svg viewBox="0 0 88 56" className="h-14 w-full" aria-hidden>
          <ellipse cx="44" cy="48" rx="28" ry="4" fill="#ff5c45" opacity="0.12" />
          <path
            d="M18 34c8-10 18-14 28-12 8 2 14 8 18 14"
            stroke="#ff5c45"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
          />
          <path
            d="M22 30c10-12 22-16 34-12"
            stroke="#ff5c45"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
          {/* cheetah-ish sprint marks */}
          <circle cx="58" cy="22" r="10" fill="#123d3a" />
          <circle cx="61" cy="19" r="1.6" fill="#7ec8c3" />
          <circle cx="55" cy="19" r="1.6" fill="#7ec8c3" />
          <ellipse cx="48" cy="30" rx="16" ry="9" fill="#123d3a" />
          <path
            d="M34 28c4 0 6 2 8 2M38 32c3 0 5 1 7 1"
            stroke="#ff5c45"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M62 30c6-2 10 2 12 6"
            stroke="#123d3a"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {selected ? (
            <path
              d="M12 18l6 0M10 24l8 0M14 30l5 0"
              stroke="#ff5c45"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : null}
        </svg>
      </div>
    );
  }

  if (mode === "balanced") {
    return (
      <div className="relative mx-auto flex h-14 w-full items-center justify-center">
        <svg viewBox="0 0 88 56" className="h-14 w-full" aria-hidden>
          <ellipse cx="44" cy="48" rx="28" ry="4" fill="#7ec8c3" opacity="0.2" />
          <path
            d="M12 36c10 6 22 8 34 6 12-2 20-8 28-16"
            stroke="#7ec8c3"
            strokeWidth="2"
            fill="none"
            opacity="0.45"
          />
          {/* dolphin arc */}
          <path
            d="M20 34c8-14 22-18 34-12 8 4 12 12 10 18-8 4-18 4-28 0-8-3-12-6-16-6z"
            fill="#123d3a"
          />
          <circle cx="48" cy="24" r="2" fill="#7ec8c3" />
          <path
            d="M54 20c6-6 12-6 16-2"
            stroke="#123d3a"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M28 36c4 4 10 6 16 4"
            stroke="#7ec8c3"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-14 w-full items-center justify-center">
      <svg viewBox="0 0 88 56" className="h-14 w-full" aria-hidden>
        <ellipse
          cx="44"
          cy="48"
          rx="30"
          ry="4"
          fill={selected ? "#7ec8c3" : "#123d3a"}
          opacity={selected ? 0.25 : 0.1}
        />
        {/* whale body */}
        <ellipse cx="42" cy="30" rx="24" ry="12" fill={selected ? "#fff" : "#123d3a"} />
        <path
          d="M62 28c8-2 14 2 16 8-6 2-12 2-16 0"
          fill={selected ? "#fff" : "#123d3a"}
        />
        <path
          d="M24 24c-4-8-2-14 4-16 2 4 2 8 0 12"
          fill={selected ? "#ffe8e3" : "#ff5c45"}
          opacity="0.9"
        />
        <circle
          cx="30"
          cy="28"
          r="2"
          fill={selected ? "#123d3a" : "#7ec8c3"}
        />
        <path
          d="M36 36c6 2 12 2 18 0"
          stroke={selected ? "#7ec8c3" : "#7ec8c3"}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
