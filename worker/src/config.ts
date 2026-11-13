export function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export const config = {
  port: Number(process.env.PORT || 8080),
  sharedSecret: process.env.WORKER_SHARED_SECRET?.trim() || "",
  /** Steady/Deep path: full Whisper for coverage on speech + songs. */
  model: process.env.TRANSCRIPTION_MODEL || "whisper-large-v3",
  /** Shorter chunks reduce mid-file skips on music; still fine for talks. */
  chunkSeconds: Number(process.env.CHUNK_SECONDS || 90),
  overlapSeconds: Number(process.env.CHUNK_OVERLAP_SECONDS || 2),
  maxAttempts: Number(process.env.CHUNK_MAX_ATTEMPTS || 3),
  /** Product target — reject above this. */
  maxFileSeconds: Number(process.env.UNLIMITED_MAX_SECONDS || 3 * 60 * 60),
  freeClipSeconds: Number(process.env.FREE_TRANSCRIBE_SECONDS || 30 * 60),
  /** Backup claim interval when HTTP dispatch is missed (was 15s — felt stuck). */
  pollMs: Number(process.env.WORKER_POLL_MS || 3_000),
};