/**
 * AssemblyAI pre-recorded transcription with optional speaker diarization.
 * Used when Unlimited users enable "Recognize speakers" (Groq Whisper has no diarization).
 */

const UPLOAD_URL = "https://api.assemblyai.com/v2/upload";
const TRANSCRIPT_URL = "https://api.assemblyai.com/v2/transcript";

export type AssemblySegment = {
  start: number;
  end: number;
  text: string;
  speaker: string | null;
};

export type AssemblyTranscriptResult = {
  text: string;
  language: string | null;
  duration: number | null;
  segments: AssemblySegment[];
  speakers: Array<{ id: string; label: string }>;
  provider: "assemblyai";
  model: string;
};

export function isAssemblyAIConfigured() {
  return Boolean(process.env.ASSEMBLYAI_API_KEY?.trim());
}

function authHeaders() {
  const key = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!key) throw new Error("ASSEMBLYAI_API_KEY is not configured.");
  return {
    Authorization: key,
    "Content-Type": "application/json",
  };
}

function mapLanguage(language?: string | null) {
  if (!language) return undefined;
  const lower = language.toLowerCase();
  if (lower.startsWith("en")) return "en";
  return lower.slice(0, 2);
}

function speakerLabel(raw: string) {
  const letter = raw.trim().toUpperCase();
  if (/^[A-Z]$/.test(letter)) return `Speaker ${letter}`;
  if (/^\d+$/.test(letter)) {
    // 0 → A, 1 → B
    const idx = Number(letter);
    return `Speaker ${String.fromCharCode(65 + (idx % 26))}`;
  }
  return `Speaker ${letter}`;
}

async function uploadAudio(bytes: Uint8Array) {
  const key = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!key) throw new Error("ASSEMBLYAI_API_KEY is not configured.");

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: key,
      "Content-Type": "application/octet-stream",
    },
    body: Buffer.from(bytes),
  });
  const payload = (await res.json().catch(() => ({}))) as {
    upload_url?: string;
    error?: string;
  };
  if (!res.ok || !payload.upload_url) {
    throw new Error(
      payload.error || `AssemblyAI upload failed (${res.status})`,
    );
  }
  return payload.upload_url;
}

type PollPayload = {
  id?: string;
  status?: string;
  text?: string | null;
  language_code?: string | null;
  audio_duration?: number | null;
  utterances?: Array<{
    speaker?: string;
    text?: string;
    start?: number;
    end?: number;
  }> | null;
  words?: Array<{
    text?: string;
    start?: number;
    end?: number;
    speaker?: string | null;
  }> | null;
  error?: string | null;
};

async function createTranscript(params: {
  audioUrl: string;
  language?: string | null;
  speakerLabels: boolean;
  speakersExpected?: number | null;
}) {
  const body: Record<string, unknown> = {
    audio_url: params.audioUrl,
    punctuate: true,
    format_text: true,
    speaker_labels: params.speakerLabels,
    // Pin Universal-2 for speaker jobs (Whisper remains the default ASR).
    speech_models: ["universal-2"],
  };
  const lang = mapLanguage(params.language);
  if (lang) body.language_code = lang;

  if (params.speakerLabels) {
    const count =
      typeof params.speakersExpected === "number" &&
      params.speakersExpected >= 1 &&
      params.speakersExpected <= 10
        ? Math.round(params.speakersExpected)
        : 2;
    body.speakers_expected = count;
  }

  const res = await fetch(TRANSCRIPT_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as PollPayload & {
    error?: string;
  };
  if (!res.ok || !payload.id) {
    throw new Error(
      payload.error || `AssemblyAI create failed (${res.status})`,
    );
  }
  return payload.id;
}

async function pollTranscript(
  id: string,
  options?: {
    timeoutMs?: number;
    intervalMs?: number;
    onProgress?: (pct: number) => void | Promise<void>;
  },
) {
  const timeoutMs = options?.timeoutMs ?? 240_000;
  const intervalMs = options?.intervalMs ?? 2500;
  const started = Date.now();
  let tick = 0;

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`${TRANSCRIPT_URL}/${id}`, {
      headers: authHeaders(),
    });
    const payload = (await res.json().catch(() => ({}))) as PollPayload;
    if (!res.ok) {
      throw new Error(
        payload.error || `AssemblyAI poll failed (${res.status})`,
      );
    }
    if (payload.status === "completed") return payload;
    if (payload.status === "error") {
      throw new Error(payload.error || "AssemblyAI transcription failed");
    }
    tick += 1;
    // Soft climb 42→78 while AssemblyAI processes (no native %).
    if (options?.onProgress) {
      const pct = Math.min(78, 42 + tick * 3);
      await options.onProgress(pct);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("AssemblyAI transcription timed out");
}

function utterancesToSegments(
  payload: PollPayload,
): { segments: AssemblySegment[]; speakers: Array<{ id: string; label: string }> } {
  const utterances = payload.utterances ?? [];
  if (utterances.length > 0) {
    const order: string[] = [];
    const seen = new Set<string>();
    for (const u of utterances) {
      const raw = (u.speaker || "A").toString();
      if (!seen.has(raw)) {
        seen.add(raw);
        order.push(raw);
      }
    }
    const speakers = order.map((raw) => {
      const label = speakerLabel(raw);
      return { id: label, label };
    });
    const segments = utterances
      .map((u) => ({
        start: Math.max(0, (u.start ?? 0) / 1000),
        end: Math.max(0, (u.end ?? 0) / 1000),
        text: (u.text || "").trim(),
        speaker: u.speaker ? speakerLabel(u.speaker) : null,
      }))
      .filter((s) => s.text);
    return { segments, speakers };
  }

  // Fallback without utterances: whole text, no speakers.
  const text = (payload.text || "").trim();
  return {
    segments: text
      ? [{ start: 0, end: Number(payload.audio_duration ?? 0), text, speaker: null }]
      : [],
    speakers: [],
  };
}

export async function transcribeWithAssemblyAI(params: {
  bytes: Uint8Array;
  language?: string | null;
  speakerLabels?: boolean;
  speakersExpected?: number | null;
  onProgress?: (pct: number) => void | Promise<void>;
}): Promise<AssemblyTranscriptResult> {
  await params.onProgress?.(42);
  const audioUrl = await uploadAudio(params.bytes);
  await params.onProgress?.(46);
  const id = await createTranscript({
    audioUrl,
    language: params.language,
    speakerLabels: params.speakerLabels !== false,
    speakersExpected: params.speakersExpected,
  });
  await params.onProgress?.(50);
  const payload = await pollTranscript(id, { onProgress: params.onProgress });
  const { segments, speakers } = utterancesToSegments(payload);
  const text =
    (payload.text || "").trim() ||
    segments
      .map((s) => s.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  return {
    text,
    language: payload.language_code ?? mapLanguage(params.language) ?? null,
    duration:
      typeof payload.audio_duration === "number"
        ? Math.round(payload.audio_duration)
        : null,
    segments,
    speakers,
    provider: "assemblyai",
    model: "universal-2",
  };
}
