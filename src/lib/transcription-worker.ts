/**
 * Dispatch transcription jobs to the Fly FFmpeg worker.
 * When unset, the app falls back to the in-process Vercel path.
 */

export function isTranscriptionWorkerConfigured() {
  return Boolean(
    process.env.TRANSCRIPTION_WORKER_URL?.trim() &&
      process.env.TRANSCRIPTION_WORKER_SECRET?.trim(),
  );
}

export async function dispatchTranscriptionJob(transcriptId: string) {
  const base = process.env.TRANSCRIPTION_WORKER_URL?.trim()?.replace(/\/$/, "");
  const secret = process.env.TRANSCRIPTION_WORKER_SECRET?.trim();
  if (!base || !secret) {
    return { ok: false as const, reason: "worker_not_configured" };
  }

  const res = await fetch(`${base}/jobs/${transcriptId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    // Worker acknowledges with 202 and processes async.
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok && res.status !== 202) {
    const body = await res.text().catch(() => "");
    return {
      ok: false as const,
      reason: `worker_http_${res.status}`,
      detail: body.slice(0, 200),
    };
  }

  return { ok: true as const };
}
