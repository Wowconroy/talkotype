/**
 * Thin provider interface around the capabilities we actually use.
 * Normalises results so jobs stay portable across Groq / future providers.
 */

import {
  isGroqConfigured,
  transcribeWithGroq,
  type GroqTranscriptResult,
} from "@/lib/groq-whisper";

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
  speaker?: string | null;
};

export type NormalisedTranscript = {
  text: string;
  detectedLanguage: string | null;
  segments: TranscriptSegment[];
  speakers: Array<{ id: string; label: string }> | null;
  provider: string;
  model: string;
  usage: {
    durationSeconds: number | null;
    /** Provider-reported or estimated cost in USD when known. */
    costUsd: number | null;
  };
};

export type TranscribeRequest = {
  bytes: Uint8Array;
  filename: string;
  contentType?: string | null;
  model?: string | null;
  language?: string | null;
};

export function isTranscriptionConfigured() {
  return isGroqConfigured();
}

export async function transcribeAudio(
  request: TranscribeRequest,
): Promise<NormalisedTranscript> {
  const raw: GroqTranscriptResult = await transcribeWithGroq(request);
  const model =
    request.model ||
    process.env.TRANSCRIPTION_MODEL ||
    "whisper-large-v3-turbo";

  return {
    text: raw.text,
    detectedLanguage: raw.language ?? null,
    segments: (raw.segments ?? []).map((seg) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
      speaker: null,
    })),
    speakers: null,
    provider: "groq",
    model,
    usage: {
      durationSeconds: raw.duration ?? null,
      costUsd: null,
    },
  };
}
