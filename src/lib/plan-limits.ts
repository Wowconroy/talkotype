export type PlanTier = "free" | "unlimited";

/** Free: 3 attempts / UTC day (not restored by deletes). */
export const FREE_DAILY_TRANSCRIPTS = 3;

/** Free: only the first N seconds are transcribed (longer files are clipped). */
export const FREE_TRANSCRIBE_SECONDS = 30 * 60;

/** Unlimited: hard ceiling per file. */
export const UNLIMITED_MAX_SECONDS = 10 * 60 * 60;

/** Concurrent processing slots. */
export const FREE_MAX_CONCURRENT = 1;
export const UNLIMITED_MAX_CONCURRENT = 50;

/** Max upload bytes. */
export const FREE_MAX_UPLOAD_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
export const UNLIMITED_MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

/** Free originals expire after N days; Unlimited keeps forever (null). */
export const FREE_MEDIA_RETENTION_DAYS = 7;

export function normalizePlan(plan: string | null | undefined): PlanTier {
  return plan === "unlimited" ? "unlimited" : "free";
}

export function maxConcurrentJobs(plan: PlanTier) {
  return plan === "unlimited"
    ? UNLIMITED_MAX_CONCURRENT
    : FREE_MAX_CONCURRENT;
}

export function maxUploadBytes(plan: PlanTier) {
  return plan === "unlimited"
    ? UNLIMITED_MAX_UPLOAD_BYTES
    : FREE_MAX_UPLOAD_BYTES;
}

export function maxFileSeconds(plan: PlanTier) {
  return plan === "unlimited"
    ? UNLIMITED_MAX_SECONDS
    : FREE_TRANSCRIBE_SECONDS;
}

/** ISO expiry for original media, or null = keep forever. */
export function mediaExpiresAt(
  plan: PlanTier,
  from = new Date(),
): string | null {
  if (plan === "unlimited") return null;
  return new Date(
    from.getTime() + FREE_MEDIA_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(0)} MB`;
}

/**
 * Clip Groq (or similar) output to the first `limitSeconds` for free plan.
 * Returns unchanged payload when already within the limit.
 */
export function clipTranscriptToSeconds<
  T extends {
    text: string;
    duration?: number | null;
    segments?: Array<{ start: number; end: number; text: string }>;
  },
>(result: T, limitSeconds: number): T & { clipped: boolean } {
  const duration =
    typeof result.duration === "number" ? result.duration : null;
  const segments = result.segments ?? [];

  const overDuration = duration != null && duration > limitSeconds;
  const overSegments = segments.some((s) => s.start >= limitSeconds);

  if (!overDuration && !overSegments) {
    return { ...result, clipped: false };
  }

  const kept = segments
    .filter((s) => s.start < limitSeconds)
    .map((s) => ({
      ...s,
      end: Math.min(s.end, limitSeconds),
    }));

  const text =
    kept.length > 0
      ? kept
          .map((s) => s.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      : result.text;

  return {
    ...result,
    text,
    duration: Math.min(duration ?? limitSeconds, limitSeconds),
    segments: kept.length > 0 ? kept : segments,
    clipped: true,
  };
}
