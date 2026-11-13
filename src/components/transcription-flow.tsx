"use client";

import { useEffect, useState } from "react";
import {
  Check,
  FileAudio2,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = ["drop", "listen", "type", "ready"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_MS: Record<Stage, number> = {
  drop: 2800,
  listen: 3200,
  type: 5200,
  ready: 2800,
};

const LINES = [
  {
    speaker: "Alex",
    tone: "text-sea",
    stamp: "0:12",
    text: "Okay so the plan is simple — we ship the landing, keep the colors sunny, and let people talk instead of type.",
  },
  {
    speaker: "Melania",
    tone: "text-coral",
    stamp: "0:21",
    text: "Love it. Also never make me manually timestamp this again. My wrists filed a complaint.",
  },
  {
    speaker: "Alex",
    tone: "text-sea",
    stamp: "0:29",
    text: "Deal. Drop the recording — Talkotype will type it up.",
  },
];

const BARS = [28, 52, 38, 70, 44, 86, 34, 62, 48, 78, 40, 66, 32, 90, 46, 58];

export function TranscriptionFlow() {
  const [stage, setStage] = useState<Stage>("drop");
  const [typedLines, setTypedLines] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const idx = STAGES.indexOf(stage);
      const next = STAGES[(idx + 1) % STAGES.length];
      setStage(next);
      if (next === "drop") {
        setTypedLines(0);
        setCharCount(0);
      }
    }, STAGE_MS[stage]);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "type") return;
    setTypedLines(0);
    setCharCount(0);
    let line = 0;
    let chars = 0;
    const tick = window.setInterval(() => {
      const current = LINES[line];
      if (!current) {
        window.clearInterval(tick);
        return;
      }
      chars += 2;
      if (chars >= current.text.length) {
        setTypedLines(line + 1);
        setCharCount(current.text.length);
        line += 1;
        chars = 0;
        if (line >= LINES.length) {
          window.clearInterval(tick);
          return;
        }
      } else {
        setTypedLines(line);
        setCharCount(chars);
      }
    }, 28);
    return () => window.clearInterval(tick);
  }, [stage]);

  const stageIndex = STAGES.indexOf(stage);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.4rem] bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,92,69,0.12),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(126,200,195,0.22),transparent_50%)]" />

      <div className="overflow-hidden rounded-[1.8rem] border border-border/80 bg-white/90 shadow-[0_28px_60px_rgba(18,61,58,0.1)] backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border/60 bg-mist/70 px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <Sparkles className="size-4 text-coral" />
            Transcription flow
          </div>
          <div className="flex items-center gap-1.5">
            {STAGES.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === stageIndex
                    ? "w-6 bg-coral"
                    : i < stageIndex
                      ? "w-1.5 bg-sea"
                      : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
        </div>

        <div className="relative min-h-[340px] px-5 py-6 sm:min-h-[360px] sm:px-6">
          {/* DROP */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center px-6 transition-all duration-700",
              stage === "drop"
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none translate-y-3 opacity-0",
            )}
          >
            <div className="flow-drop-zone relative flex w-full max-w-sm flex-col items-center rounded-[1.4rem] border border-dashed border-sea/60 bg-secondary/50 px-6 py-10">
              <div className="flow-file absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-white shadow-[0_12px_28px_rgba(255,92,69,0.35)]">
                <FileAudio2 className="size-3.5" />
                meeting-chaos.mp4
              </div>
              <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-white text-coral shadow-sm">
                <Upload className="size-6" />
              </div>
              <p className="font-display text-lg font-semibold text-ink">
                Drop it. We&apos;ll catch it.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Audio or video — into clean words
              </p>
            </div>
          </div>

          {/* LISTEN */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center px-6 transition-all duration-700",
              stage === "listen"
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none translate-y-3 opacity-0",
            )}
          >
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-sea">
              Listening…
            </p>
            <div className="flex h-28 items-end justify-center gap-1.5 sm:gap-2">
              {BARS.map((h, i) => (
                <span
                  key={i}
                  className="flow-bar w-2 rounded-full bg-gradient-to-t from-coral to-sea sm:w-2.5"
                  style={{
                    ["--bar-h" as string]: `${h}%`,
                    animationDelay: `${i * 0.07}s`,
                  }}
                />
              ))}
            </div>
            <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-mist">
              <div className="flow-progress h-full rounded-full bg-coral" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Sound → signal → sentences
            </p>
          </div>

          {/* TYPE */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-center px-5 transition-all duration-700 sm:px-6",
              stage === "type" || stage === "ready"
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none translate-y-3 opacity-0",
            )}
          >
            <div className="space-y-4">
              {LINES.map((line, i) => {
                const visible = typedLines > i || (typedLines === i && stage === "type");
                const done = typedLines > i || stage === "ready";
                const shown =
                  stage === "ready"
                    ? line.text
                    : typedLines > i
                      ? line.text
                      : typedLines === i
                        ? line.text.slice(0, charCount)
                        : "";
                if (!visible && stage === "type") return null;
                if (stage === "type" && typedLines < i) return null;
                return (
                  <div
                    key={`${line.speaker}-${i}`}
                    className={cn(
                      "transition-all duration-500",
                      done || visible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-semibold uppercase tracking-[0.14em]",
                        line.tone,
                      )}
                    >
                      {line.speaker} · {line.stamp}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink">
                      {shown}
                      {stage === "type" && typedLines === i && !done ? (
                        <span className="flow-caret ml-0.5 inline-block h-4 w-[2px] align-[-2px] bg-coral" />
                      ) : null}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* READY badge overlay */}
          <div
            className={cn(
              "pointer-events-none absolute bottom-5 right-5 transition-all duration-500 sm:bottom-6 sm:right-6",
              stage === "ready"
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0",
            )}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(18,61,58,0.25)]">
              <span className="grid size-5 place-items-center rounded-full bg-sea text-ink">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              Ready · export TXT / PDF / DOCX / SRT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
