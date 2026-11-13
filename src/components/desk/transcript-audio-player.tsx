"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, X } from "lucide-react";
import { clockFromMs } from "@/lib/transcript-display";

type Props = {
  title: string;
  src: string | null;
  contentType?: string | null;
  seekMs: number | null;
  /** Bumps when the same timestamp is clicked again. */
  seekToken?: number;
  durationSeconds?: number | null;
  preparing?: boolean;
  open: boolean;
  onClose: () => void;
};

function isAudioContentType(contentType: string | null | undefined) {
  if (!contentType) return false;
  return (
    contentType.startsWith("audio/") ||
    contentType.includes("mpeg") ||
    contentType.includes("mp4a") ||
    contentType.includes("flac") ||
    contentType.includes("wav") ||
    contentType.includes("ogg")
  );
}

export function TranscriptAudioPlayer({
  title,
  src,
  contentType = null,
  seekMs,
  seekToken = 0,
  durationSeconds = null,
  preparing = false,
  open,
  onClose,
}: Props) {
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const pendingSeekSecRef = useRef<number | null>(null);
  const seekGenRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Prefer <audio> for extracted MP3/M4A — frame-accurate seeks vs MP4 keyframes.
  const useAudioTag =
    isAudioContentType(contentType) ||
    (typeof src === "string" && /\.(mp3|m4a|flac|wav|ogg)(\?|$)/i.test(src));

  const metaDurationMs =
    durationSeconds != null && Number.isFinite(durationSeconds)
      ? Math.max(0, Math.round(durationSeconds * 1000))
      : 0;
  const effectiveDurationMs = durationMs > 0 ? durationMs : metaDurationMs;

  const progress =
    effectiveDurationMs > 0
      ? Math.min(100, Math.max(0, (currentMs / effectiveDurationMs) * 100))
      : 0;

  function syncDuration(media: HTMLMediaElement) {
    const d = media.duration;
    if (Number.isFinite(d) && d > 0) {
      setDurationMs(Math.round(d * 1000));
    }
  }

  function tryApplyPendingSeek(media: HTMLMediaElement, gen: number) {
    const target = pendingSeekSecRef.current;
    if (target == null) return;
    if (seekGenRef.current !== gen) return;
    if (media.readyState < 1) return;
    try {
      syncDuration(media);
      const max =
        Number.isFinite(media.duration) && media.duration > 0
          ? Math.max(0, media.duration - 0.05)
          : target;
      const next = Math.max(0, Math.min(target, max));
      if (typeof media.fastSeek === "function") {
        try {
          media.fastSeek(next);
        } catch {
          media.currentTime = next;
        }
      } else {
        media.currentTime = next;
      }
      setCurrentMs(Math.round(next * 1000));
      void media
        .play()
        .then(() => {
          if (seekGenRef.current === gen) setPlaying(true);
        })
        .catch(() => {
          if (seekGenRef.current !== gen) return;
          setPlaying(false);
          setError("Could not start playback — click play.");
        });
    } catch {
      if (seekGenRef.current === gen) {
        setError("Could not seek in this file.");
      }
    }
  }

  useEffect(() => {
    if (!open || seekMs == null) return;
    const sec = Math.max(0, seekMs / 1000);
    const gen = ++seekGenRef.current;
    pendingSeekSecRef.current = sec;
    setCurrentMs(Math.round(seekMs));
    setError(null);
    const media = mediaRef.current;
    if (media) tryApplyPendingSeek(media, gen);
  }, [seekMs, seekToken, open]);

  useEffect(() => {
    if (open) return;
    pendingSeekSecRef.current = null;
    seekGenRef.current += 1;
    setPlaying(false);
    setCurrentMs(0);
    setError(null);
  }, [open]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !open) return;

    const onReady = () => tryApplyPendingSeek(media, seekGenRef.current);
    const onDuration = () => syncDuration(media);
    const onTime = () => {
      const pending = pendingSeekSecRef.current;
      if (pending != null && media.currentTime < 0.35 && pending > 1) return;
      setCurrentMs(Math.round(media.currentTime * 1000));
    };
    const onSeeked = () => {
      const target = pendingSeekSecRef.current;
      const actual = media.currentTime;
      if (target != null && Math.abs(actual - target) <= 0.75) {
        pendingSeekSecRef.current = null;
      }
      setCurrentMs(Math.round(actual * 1000));
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setError("Audio failed to load.");

    media.addEventListener("loadedmetadata", onReady);
    media.addEventListener("loadeddata", onReady);
    media.addEventListener("canplay", onReady);
    media.addEventListener("durationchange", onDuration);
    media.addEventListener("timeupdate", onTime);
    media.addEventListener("seeked", onSeeked);
    media.addEventListener("play", onPlay);
    media.addEventListener("pause", onPause);
    media.addEventListener("error", onError);

    return () => {
      media.removeEventListener("loadedmetadata", onReady);
      media.removeEventListener("loadeddata", onReady);
      media.removeEventListener("canplay", onReady);
      media.removeEventListener("durationchange", onDuration);
      media.removeEventListener("timeupdate", onTime);
      media.removeEventListener("seeked", onSeeked);
      media.removeEventListener("play", onPlay);
      media.removeEventListener("pause", onPause);
      media.removeEventListener("error", onError);
    };
  }, [open, useAudioTag]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !open || !src) return;
    setError(null);

    let absolute = src;
    try {
      absolute = new URL(src, window.location.href).href;
    } catch {
      /* keep src */
    }

    if (media.src !== absolute) {
      media.src = src;
      media.load();
      return;
    }
    tryApplyPendingSeek(media, seekGenRef.current);
  }, [src, open, seekToken, useAudioTag]);

  if (!open) return null;

  async function togglePlay() {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) {
      try {
        tryApplyPendingSeek(media, seekGenRef.current);
        await media.play();
        setPlaying(true);
      } catch {
        setError("Could not start playback.");
      }
    } else {
      media.pause();
    }
  }

  function scrub(value: number) {
    const media = mediaRef.current;
    if (!media || effectiveDurationMs <= 0) return;
    const next = (value / 100) * (effectiveDurationMs / 1000);
    const gen = ++seekGenRef.current;
    pendingSeekSecRef.current = next;
    setCurrentMs(Math.round(next * 1000));
    try {
      media.currentTime = next;
      void media.play().then(() => {
        if (seekGenRef.current === gen) setPlaying(true);
      });
    } catch {
      /* wait until seekable */
    }
  }

  const mediaClassName =
    "pointer-events-none absolute h-0 w-0 opacity-0";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border/80 bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(18,61,58,0.12)] backdrop-blur">
      {useAudioTag ? (
        <audio
          ref={mediaRef as React.MutableRefObject<HTMLAudioElement | null>}
          preload="auto"
          className={mediaClassName}
        />
      ) : (
        <video
          ref={mediaRef as React.MutableRefObject<HTMLVideoElement | null>}
          preload="auto"
          playsInline
          className={mediaClassName}
        />
      )}
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
            ) : preparing || !src ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {preparing
                  ? "Preparing precise audio for seeking… (first click can take a minute on long videos)"
                  : "Loading audio…"}
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
              if (mediaRef.current) mediaRef.current.volume = v;
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
