/**
 * Thin provider interface around the capabilities we actually use.
 * Quality path: first pass → vocab-primed second pass → gap fill.
 */

import { extractAudioSlice, isFfmpegAvailable } from "@/lib/ffmpeg-local";
import {
  isGroqConfigured,
  transcribeWithGroq,
  type GroqTranscriptResult,
} from "@/lib/groq-whisper";
import {
  cleanSegments,
  continuationPrompt,
  coverageSeconds,
  findCoverageGaps,
  mergeSegmentsWithFills,
  pickBetterPass,
  stripHallucinationsFromText,
  textFromSegments,
  vocabularyPromptFromTranscript,
  type TimedSegment,
} from "@/lib/transcript-quality";

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
    costUsd: number | null;
  };
  meta?: {
    gapsFilled: number;
    qualityPass: "standard" | "deep";
    secondPass: boolean;
  };
};

export type TranscribeRequest = {
  bytes: Uint8Array;
  filename: string;
  contentType?: string | null;
  model?: string | null;
  language?: string | null;
  quality?: "standard" | "deep";
};

export function isTranscriptionConfigured() {
  return isGroqConfigured();
}

function normaliseRaw(raw: GroqTranscriptResult) {
  const segments = cleanSegments(raw.segments ?? []);
  const text =
    segments.length > 0
      ? textFromSegments(segments)
      : stripHallucinationsFromText(raw.text);
  return {
    text,
    language: raw.language ?? null,
    duration: raw.duration ?? null,
    segments,
  };
}

export async function transcribeAudio(
  request: TranscribeRequest,
): Promise<NormalisedTranscript> {
  const model =
    request.model ||
    process.env.TRANSCRIPTION_MODEL ||
    "whisper-large-v3-turbo";
  const quality =
    request.quality ||
    (model === "whisper-large-v3" ? "deep" : "standard");

  // Pass 1: no instructional prompt (negations cause Whisper to echo them).
  const raw1 = await transcribeWithGroq({
    bytes: request.bytes,
    filename: request.filename,
    contentType: request.contentType,
    model,
    language: request.language,
    prompt: "",
    temperature: 0,
  });
  let best = normaliseRaw(raw1);
  let secondPass = false;

  if (quality === "deep") {
    const vocab = vocabularyPromptFromTranscript(best.text);
    if (vocab) {
      const raw2 = await transcribeWithGroq({
        bytes: request.bytes,
        filename: request.filename,
        contentType: request.contentType,
        model,
        language: request.language,
        prompt: vocab,
        temperature: 0,
      });
      const pass2 = normaliseRaw(raw2);
      const picked = pickBetterPass(best, pass2);
      secondPass = picked === pass2 || picked.text !== best.text;
      best = picked;
    }
  }

  let segments = best.segments;
  let gapsFilled = 0;
  const duration =
    typeof best.duration === "number" && best.duration > 0
      ? best.duration
      : Math.max(
          coverageSeconds(segments),
          segments.reduce((max, s) => Math.max(max, s.end), 0),
        );

  if (quality === "deep" && duration > 0 && (await isFfmpegAvailable())) {
    const gaps = findCoverageGaps(segments, duration, { minGapSeconds: 8 });

    for (const gap of gaps.slice(0, 8)) {
      const start = Math.max(0, gap.start - 0.35);
      const durationSec = Math.min(duration - start, gap.duration + 0.7);
      const slice = await extractAudioSlice({
        sourceBytes: request.bytes,
        sourceFilename: request.filename,
        startSec: start,
        durationSec,
      });
      if (!slice) continue;

      const prompt =
        continuationPrompt(segments, gap.start) ||
        vocabularyPromptFromTranscript(best.text) ||
        "";

      try {
        const filled = await transcribeWithGroq({
          bytes: new Uint8Array(slice.bytes),
          filename: slice.filename,
          contentType: "audio/flac",
          model,
          language: request.language,
          prompt,
          temperature: 0,
        });
        const offsetSegs = cleanSegments(filled.segments ?? []).map((s) => ({
          start: s.start + start,
          end: s.end + start,
          text: s.text,
        }));
        if (offsetSegs.length === 0) continue;
        segments = mergeSegmentsWithFills(segments, offsetSegs);
        gapsFilled += 1;
      } catch {
        // Keep base transcript if a gap pass fails.
      }
    }
  }

  const text =
    segments.length > 0
      ? textFromSegments(segments)
      : stripHallucinationsFromText(best.text);

  return {
    text,
    detectedLanguage: best.language,
    segments: segments.map((seg) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
      speaker: null,
    })),
    speakers: null,
    provider: "groq",
    model,
    usage: {
      durationSeconds: duration ? Math.round(duration) : null,
      costUsd: null,
    },
    meta: {
      gapsFilled,
      qualityPass: quality,
      secondPass,
    },
  };
}
