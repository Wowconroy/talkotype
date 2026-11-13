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
  durationSeconds?: number | null;
  open: boolean;
  onClose: () => void;
};

export function TranscriptAudioPlayer({
  title,
  src,
  seekMs,
  seekToken = 0,
  durationSeconds = null,
  open,
  onClose,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Seconds to seek to; cleared after a successful seeked event. */
  const pendingSeekSecRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const metaDurationMs =
    durationSeconds != null && Number.isFinite(durationSeconds)
      ? Math.max(0, Math.round(durationSeconds * 1000))
      : 0;
  const effectiveDurationMs = durationMs > 0 ? durationMs : metaDurationMs;

  const progress =
    effectiveDurationMs > 0
      ? Math.min(100, Math.max(0, (currentMs / effectiveDurationMs) * 100))
      : 0;

  function syncDuration(audio: HTMLAudioElement) {
    const d = audio.duration;
    if (Number.isFinite(d) && d > 0) {
      setDurationMs(Math.round(d * 1000));
    }
  }

  function tryApplyPendingSeek(audio: HTMLAudioElement) {
    const target = pendingSeekSecRef.current;
    if (target == null) return;
    if (audio.readyState < 1) return;
    try {
      syncDuration(audio);
      audio.currentTime = target;
      setCurrentMs(Math.round(target * 1000));
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false);
          setError("Could not start playback — click play.");
        });
    } catch {
      setError("Could not seek in this file.");
    }
  }

  // New click → optimistic UI + queue a seek.
  useEffect(() => {
    if (!open || seekMs == null) return;
    const sec = Math.max(0, seekMs / 1000);
    pendingSeekSecRef.current = sec;
    setCurrentMs(Math.round(seekMs));
    setError(null);
    const audio = audioRef.current;
    if (audio) tryApplyPendingSeek(audio);
  }, [seekMs, seekToken, open]);

  useEffect(() => {
    if (open) return;
    pendingSeekSecRef.current = null;
    setPlaying(false);
    setCurrentMs(0);
    setError(null);
  }, [open]);

  // Wire media events once per open session.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !open) return;

    const onReady = () => tryApplyPendingSeek(audio);
    const onDuration = () => syncDuration(audio);
    const onTime = () => {
      // Don't fight a pending seek with 0:00 timeupdates during load.
      if (pendingSeekSecRef.current != null && audio.currentTime < 0.2) return;
      setCurrentMs(Math.round(audio.currentTime * 1000));
    };
    const onSeeked = () => {
      const target = pendingSeekSecRef.current;
      if (target != null && Math.abs(audio.currentTime - target) < 0.75) {
        pendingSeekSecRef.current = null;
      }
      setCurrentMs(Math.round(audio.currentTime * 1000));
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setError("Audio failed to load.");

    audio.addEventListener("loadedmetadata", onReady);
    audio.addEventListener("loadeddata", onReady);
    audio.addEventListener("canplay", onReady);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onReady);
      audio.removeEventListener("loadeddata", onReady);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [open]);

  // Load source when it arrives / changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !open || !src) return;
    setError(null);

    let absolute = src;
    try {
      absolute = new URL(src, window.location.href).href;
    } catch {
      /* keep src */
    }

    if (audio.src !== absolute) {
      audio.src = src;
      audio.load();
      return;
    }
    tryApplyPendingSeek(audio);
  }, [src, open, seekToken]);

  if (!open) return null;

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        tryApplyPendingSeek(audio);
        await audio.play();
        setPlaying(true);
      } catch {
        setError("Could not start playback.");
      }
    } else {
      audio.pause();
    }
  }

  function scrub(value: number) {
    const audio = audioRef.current;
    if (!audio || effectiveDurationMs <= 0) return;
    const next = (value / 100) * (effectiveDurationMs / 1000);
    pendingSeekSecRef.current = next;
    setCurrentMs(Math.round(next * 1000));
    try {
      audio.currentTime = next;
    } catch {
      /* wait until seekable */
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border/80 bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(18,61,58,0.12)] backdrop-blur">
      <audio ref={audioRef} preload="auto" playsInline />
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
              <span className="w-12 shrink-0 text-[11px] tabular-nums text-muted-foreground">
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
              <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {effectiveDurationMs > 0
                  ? clockFromMs(effectiveDurationMs)
                  : "—"}
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
