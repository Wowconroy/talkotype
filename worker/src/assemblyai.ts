/**
 * AssemblyAI path for worker jobs that request speaker labels.
 */

const UPLOAD_URL = "https://api.assemblyai.com/v2/upload";
const TRANSCRIPT_URL = "https://api.assemblyai.com/v2/transcript";

export type AssemblyResult = {
  text: string;
  language: string | null;
  duration: number | null;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    speaker: string | null;
  }>;
  speakers: Array<{ label: string }>;
};

export function isAssemblyAIConfigured() {
  return Boolean(process.env.ASSEMBLYAI_API_KEY?.trim());
}

function speakerLabel(raw: string) {
  const letter = raw.trim().toUpperCase();
  if (/^[A-Z]$/.test(letter)) return `Speaker ${letter}`;
  if (/^\d+$/.test(letter)) {
    const idx = Number(letter);
    return `Speaker ${String.fromCharCode(65 + (idx % 26))}`;
  }
  return `Speaker ${letter}`;
}

function mapLanguage(language?: string | null) {
  if (!language) return undefined;
  const lower = language.toLowerCase();
  if (lower.startsWith("en")) return "en";
  return lower.slice(0, 2);
}

export async function transcribeWithSpeakers(params: {
  bytes: Buffer;
  language?: string | null;
  speakersExpected?: number | null;
}): Promise<AssemblyResult> {
  const key = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!key) throw new Error("ASSEMBLYAI_API_KEY is not configured");

  const uploadRes = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: key,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(params.bytes),
  });
  const uploadPayload = (await uploadRes.json().catch(() => ({}))) as {
    upload_url?: string;
    error?: string;
  };
  if (!uploadRes.ok || !uploadPayload.upload_url) {
    throw new Error(
      uploadPayload.error || `AssemblyAI upload failed (${uploadRes.status})`,
    );
  }

  const count =
    typeof params.speakersExpected === "number" &&
    params.speakersExpected >= 1 &&
    params.speakersExpected <= 10
      ? Math.round(params.speakersExpected)
      : 2;

  const body: Record<string, unknown> = {
    audio_url: uploadPayload.upload_url,
    punctuate: true,
    format_text: true,
    speaker_labels: true,
    speech_models: ["universal-2"],
    speakers_expected: count,
  };
  const lang = mapLanguage(params.language);
  if (lang) body.language_code = lang;

  const createRes = await fetch(TRANSCRIPT_URL, {
    method: "POST",
    headers: {
      Authorization: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const created = (await createRes.json().catch(() => ({}))) as {
    id?: string;
    error?: string;
  };
  if (!createRes.ok || !created.id) {
    throw new Error(
      created.error || `AssemblyAI create failed (${createRes.status})`,
    );
  }

  const started = Date.now();
  while (Date.now() - started < 20 * 60_000) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetch(`${TRANSCRIPT_URL}/${created.id}`, {
      headers: { Authorization: key },
    });
    const payload = (await pollRes.json().catch(() => ({}))) as {
      status?: string;
      text?: string | null;
      language_code?: string | null;
      audio_duration?: number | null;
      error?: string | null;
      utterances?: Array<{
        speaker?: string;
        text?: string;
        start?: number;
        end?: number;
      }> | null;
    };
    if (!pollRes.ok) {
      throw new Error(
        payload.error || `AssemblyAI poll failed (${pollRes.status})`,
      );
    }
    if (payload.status === "error") {
      throw new Error(payload.error || "AssemblyAI transcription failed");
    }
    if (payload.status !== "completed") continue;

    const order: string[] = [];
    const seen = new Set<string>();
    for (const u of payload.utterances ?? []) {
      const raw = (u.speaker || "A").toString();
      if (!seen.has(raw)) {
        seen.add(raw);
        order.push(raw);
      }
    }
    const speakers = order.map((raw) => ({ label: speakerLabel(raw) }));
    const segments = (payload.utterances ?? [])
      .map((u) => ({
        start: Math.max(0, (u.start ?? 0) / 1000),
        end: Math.max(0, (u.end ?? 0) / 1000),
        text: (u.text || "").trim(),
        speaker: u.speaker ? speakerLabel(u.speaker) : null,
      }))
      .filter((s) => s.text);

    return {
      text:
        (payload.text || "").trim() ||
        segments
          .map((s) => s.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      language: payload.language_code ?? lang ?? null,
      duration:
        typeof payload.audio_duration === "number"
          ? Math.round(payload.audio_duration)
          : null,
      segments,
      speakers,
    };
  }

  throw new Error("AssemblyAI transcription timed out");
}
