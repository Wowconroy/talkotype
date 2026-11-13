"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, X } from "lucide-react";
import { clockFromMs } from "@/lib/transcript-display";

type Props = {
  title: string;
  src: string | null;
  seekMs: number | null;
  /** Bumps when the same timestamp is clicked again. */
  seekToken?: number;
  open: boolean;
  onClose: () => void;
};

export function TranscriptAudioPlayer({
  title,
  src,
  seekMs,
  seekToken = 0,
  open,
  onClose,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src || !open) return;
    setError(null);
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
  }, [src, open]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !open || seekMs == null || !src) return;
    const seekSec = Math.max(0, seekMs / 1000);
    const apply = () => {
      try {
        audio.currentTime = seekSec;
        void audio.play().then(() => setPlaying(true)).catch(() => {
          setError("Could not start playback — click play.");
        });
      } catch {
        setError("Could not seek in this file.");
      }
    };
    if (audio.readyState >= 1) apply();
    else audio.addEventListener("loadedmetadata", apply, { once: true });
  }, [seekMs, seekToken, src, open]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentMs(Math.round(audio.currentTime * 1000));
    const onMeta = () =>
      setDurationMs(Math.round((audio.duration || 0) * 1000));
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onErr = () => setError("Audio failed to load.");
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onErr);
    };
  }, []);

  if (!open) return null;

  const progress =
    durationMs > 0 ? Math.min(100, (currentMs / durationMs) * 100) : 0;

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setError("Could not start playback.");
      }
    } else {
      audio.pause();
    }
  }

  function scrub(value: number) {
    const audio = audioRef.current;
    if (!audio || durationMs <= 0) return;
    const next = (value / 100) * (durationMs / 1000);
    audio.currentTime = next;
    setCurrentMs(Math.round(next * 1000));
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border/80 bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(18,61,58,0.12)] backdrop-blur">
      <audio ref={audioRef} preload="metadata" />
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => void togglePlay()}
            disabled={!src}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-sea text-white disabled:opacity-50"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink" title={title}>
              {title || "Audio"}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="w-10 shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {clockFromMs(currentMs)}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                onChange={(e) => scrub(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-sea"
                aria-label="Seek"
              />
              <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {durationMs > 0 ? clockFromMs(durationMs) : "—"}
              </span>
            </div>
            {error ? (
              <p className="mt-1 text-xs text-coral">{error}</p>
            ) : !src ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Loading audio…
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Volume2 className="size-4 text-muted-foreground" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
            className="w-20 accent-sea"
            aria-label="Volume"
          />
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-mist hover:text-ink"
            aria-label="Close player"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
