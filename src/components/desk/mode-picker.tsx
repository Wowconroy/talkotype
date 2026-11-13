"use client";

import Image from "next/image";
import { TRANSCRIPTION_MODES, type TranscriptionMode } from "./types";

type Props = {
  value: TranscriptionMode;
  onChange: (value: TranscriptionMode) => void;
  disabled?: boolean;
};

const MODE_ART: Record<TranscriptionMode, { src: string; alt: string }> = {
  fast: { src: "/modes/swift.png", alt: "Cheetah — Swift mode" },
  balanced: { src: "/modes/steady.png", alt: "Dolphin leaping — Steady mode" },
  accurate: {
    src: "/modes/deep.png",
    alt: "Careful listener taking notes — Deep mode",
  },
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
          const art = MODE_ART[mode.id];
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
              <div className="relative mx-auto h-14 w-full overflow-hidden">
                <Image
                  src={art.src}
                  alt={art.alt}
                  fill
                  sizes="120px"
                  className="object-contain p-0.5"
                />
              </div>
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
