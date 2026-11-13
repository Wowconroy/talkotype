import { readFileSync } from "node:fs";
import { config } from "./config.js";

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export type GroqResult = {
  text: string;
  language: string | null;
  duration: number | null;
  segments: Array<{ start: number; end: number; text: string }>;
};

export async function transcribeFile(params: {
  path: string;
  filename: string;
  language?: string | null;
  model?: string | null;
  attempt?: number;
  /** Vocab/style priming only — never “don’t say X”. */
  prompt?: string | null;
}): Promise<GroqResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const bytes = new Uint8Array(readFileSync(params.path));
  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], { type: "audio/flac" }),
    params.filename.endsWith(".flac")
      ? params.filename
      : `${params.filename}.flac`,
  );
  form.append("model", params.model || config.model);
  form.append("response_format", "verbose_json");
  form.append("temperature", "0");
  form.append("timestamp_granularities[]", "segment");
  if (params.language) form.append("language", params.language);
  if (params.prompt) form.append("prompt", params.prompt.slice(0, 800));

  const attempt = params.attempt ?? 1;
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const payload = (await res.json().catch(() => ({}))) as {
    text?: string;
    language?: string;
    duration?: number;
    segments?: Array<{ start?: number; end?: number; text?: string }>;
    error?: { message?: string } | string;
  };

  if (!res.ok) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message || `Groq failed (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    if ((res.status === 429 || res.status >= 500) && attempt < config.maxAttempts) {
      const waitMs = Math.min(30_000, 1000 * 2 ** attempt);
      await new Promise((r) => setTimeout(r, waitMs));
      return transcribeFile({ ...params, attempt: attempt + 1 });
    }
    throw err;
  }

  return {
    text: (payload.text || "").trim(),
    language: payload.language ?? null,
    duration:
      typeof payload.duration === "number"
        ? Math.round(payload.duration)
        : null,
    segments: (payload.segments || [])
      .map((s) => ({
        start: Number(s.start ?? 0),
        end: Number(s.end ?? 0),
        text: (s.text || "").trim(),
      }))
      .filter((s) => s.text),
  };
}
