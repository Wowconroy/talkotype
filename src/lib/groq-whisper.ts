/**
 * Groq OpenAI-compatible Whisper transcription.
 * https://console.groq.com/docs/speech-to-text
 */

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export type GroqTranscriptResult = {
  text: string;
  language?: string | null;
  duration?: number | null;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
};

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function transcribeWithGroq(params: {
  bytes: Uint8Array;
  filename: string;
  contentType?: string | null;
  model?: string | null;
  language?: string | null;
  /** Style/vocab priming only. Avoid “don’t say X” — Whisper echoes it. */
  prompt?: string | null;
  temperature?: number;
}): Promise<GroqTranscriptResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");

  const model =
    params.model ||
    process.env.TRANSCRIPTION_MODEL ||
    "whisper-large-v3-turbo";

  const form = new FormData();
  const blob = new Blob([Buffer.from(params.bytes)], {
    type: params.contentType || "application/octet-stream",
  });
  form.append("file", blob, params.filename || "audio.mp3");
  form.append("model", model);
  form.append("response_format", "verbose_json");
  form.append("temperature", String(params.temperature ?? 0));
  form.append("timestamp_granularities[]", "segment");
  if (params.language) {
    // Whisper expects ISO-639-1; map en-GB / en-US → en
    const lang = params.language.toLowerCase().startsWith("en")
      ? "en"
      : params.language;
    form.append("language", lang);
  }
  if (params.prompt) {
    form.append("prompt", params.prompt.slice(0, 800));
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
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
        : payload.error?.message || `Groq transcription failed (${res.status})`;
    throw new Error(message);
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
