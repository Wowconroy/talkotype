"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function BlogDemo({
  variant,
}: {
  variant: "upload" | "waveform" | "fix";
}) {
  if (variant === "upload") return <UploadDemo />;
  if (variant === "fix") return <FixDemo />;
  return <WaveformDemo />;
}

function UploadDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStep(2);
      return;
    }
    const id = window.setInterval(() => {
      setStep((value) => (value + 1) % 3);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-[1.4rem] border border-border/80 bg-white/90 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
        Demo · upload flow
      </p>
      <div className="mt-3 rounded-[1.1rem] border border-dashed border-sea/50 bg-secondary/50 px-4 py-8 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          {step === 0 && "Drop an MP4 or MP3 here"}
          {step === 1 && "Uploading sample-meeting.mp4…"}
          {step === 2 && "Ready to transcribe"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Talkotype accepts MP3, M4A, WAV, MP4, and MOV.
        </p>
        <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-white">
          <div
            className={cn(
              "h-full rounded-full bg-coral transition-all duration-700",
              step === 0 && "w-0",
              step === 1 && "w-2/3",
              step === 2 && "w-full",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function WaveformDemo() {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShowText(true);
      return;
    }
    const id = window.setInterval(() => {
      setShowText((value) => !value);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-[1.4rem] border border-border/80 bg-white/90 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
        Demo · waveform to text
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1rem] bg-mist p-4">
          <div className="flex h-16 items-end gap-1">
            {[40, 72, 48, 90, 56, 78, 36, 84, 60, 70, 44, 88].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-full bg-gradient-to-t from-sea to-coral animate-float"
                style={{ height: `${height}%`, animationDelay: `${index * 80}ms` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground">Audio energy</p>
        </div>
        <div className="rounded-[1rem] bg-mist p-4">
          <p
            className={cn(
              "text-sm leading-relaxed text-ink transition-opacity duration-500",
              showText ? "opacity-100" : "opacity-40",
            )}
          >
            “Let’s ship the landing page first, then wire up exports.”
          </p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            Editable transcript appears
          </p>
        </div>
      </div>
    </div>
  );
}

function FixDemo() {
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setFixed(true);
      return;
    }
    const id = window.setInterval(() => {
      setFixed((value) => !value);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-[1.4rem] border border-border/80 bg-white/90 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
        Demo · fix names and numbers
      </p>
      <div className="mt-3 space-y-2 rounded-[1rem] bg-mist p-4 text-sm leading-relaxed">
        <p className={cn(!fixed && "bg-coral-soft/80")}>
          {fixed
            ? "Speaker 1: Maya from legal signed off on Friday."
            : "Speaker 1: Mayor from legal signed off on fry day."}
        </p>
        <p className={cn(fixed && "text-sea")}>
          {fixed ? "Corrected: Maya · Friday" : "Needs review: names · dates"}
        </p>
      </div>
    </div>
  );
}
