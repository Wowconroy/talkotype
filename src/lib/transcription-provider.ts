/**
 * Thin provider interface around the capabilities we actually use.
 * Quality path: first pass → vocab-primed second pass → gap fill.
 * Speaker labels: AssemblyAI diarization when requested (Groq has none).
 */

import {
  isAssemblyAIConfigured,
  transcribeWithAssemblyAI,
} from "@/lib/assemblyai";
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
    qualityPass: "standard" | "enhanced" | "deep";
    secondPass: boolean;
    gapsMissed?: number;
  };
};

export type TranscribeRequest = {
  bytes: Uint8Array;
  filename: string;
  contentType?: string | null;
  model?: string | null;
  language?: string | null;
  quality?: "standard" | "enhanced" | "deep";
  /** Unlimited "Recognize speakers" — routes to AssemblyAI Universal-2. */
  speakers?: boolean;
  speakersExpected?: number | null;
  /** TRANSCRIPTION_PROVIDER=assemblyai — use AssemblyAI without requiring speakers. */
  assemblyai?: boolean;
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

function gapPolicy(quality: "standard" | "enhanced" | "deep") {
  if (quality === "deep") return { minGapSeconds: 2.5, maxGaps: 24 };
  if (quality === "enhanced") return { minGapSeconds: 3.5, maxGaps: 16 };
  // Swift: still recover multi-second skips (turbo often leaves 3–6s holes).
  return { minGapSeconds: 3, maxGaps: 12 };
}

async function fillCoverageGaps(params: {
  bytes: Uint8Array;
  filename: string;
  model: string;
  language?: string | null;
  quality: "standard" | "enhanced" | "deep";
  segments: TimedSegment[];
  duration: number;
  baseText: string;
}): Promise<{ segments: TimedSegment[]; gapsFilled: number; gapsMissed: number }> {
  if (!(await isFfmpegAvailable()) || params.duration <= 0) {
    return { segments: params.segments, gapsFilled: 0, gapsMissed: 0 };
  }

  const policy = gapPolicy(params.quality);
  const gaps = findCoverageGaps(params.segments, params.duration, {
    minGapSeconds: policy.minGapSeconds,
  });
  let segments = params.segments;
  let gapsFilled = 0;
  let gapsMissed = 0;

  for (const gap of gaps.slice(0, policy.maxGaps)) {
    const start = Math.max(0, gap.start - 0.35);
    const durationSec = Math.min(params.duration - start, gap.duration + 0.7);
    const slice = await extractAudioSlice({
      sourceBytes: params.bytes,
      sourceFilename: params.filename,
      startSec: start,
      durationSec,
    });
    if (!slice) {
      gapsMissed += 1;
      continue;
    }

    const prompt =
      continuationPrompt(segments, gap.start) ||
      vocabularyPromptFromTranscript(params.baseText) ||
      "";

    let filled: GroqTranscriptResult | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        filled = await transcribeWithGroq({
          bytes: new Uint8Array(slice.bytes),
          filename: slice.filename,
          contentType: "audio/flac",
          model: params.model,
          language: params.language,
          prompt,
          temperature: 0,
        });
        break;
      } catch {
        if (attempt === 2) gapsMissed += 1;
      }
    }
    if (!filled) continue;

    const offsetSegs = cleanSegments(filled.segments ?? []).map((s) => ({
      start: s.start + start,
      end: s.end + start,
      text: s.text,
    }));
    if (offsetSegs.length === 0) continue;
    segments = mergeSegmentsWithFills(segments, offsetSegs);
    gapsFilled += 1;
  }

  const remaining = Math.max(0, gaps.length - policy.maxGaps);
  return { segments, gapsFilled, gapsMissed: gapsMissed + remaining };
}

export async function transcribeAudio(
  request: TranscribeRequest,
): Promise<NormalisedTranscript> {
  // AssemblyAI path: speaker diarization and/or TRANSCRIPTION_PROVIDER=assemblyai.
  // Groq Whisper has no diarization API.
  if (request.speakers || request.assemblyai) {
    if (!isAssemblyAIConfigured()) {
      throw new Error(
        request.speakers
          ? "Speaker labels need ASSEMBLYAI_API_KEY. Add the key or turn off Recognize speakers."
          : "ASSEMBLYAI_API_KEY is not configured.",
      );
    }
    const raw = await transcribeWithAssemblyAI({
      bytes: request.bytes,
      language: request.language,
      speakerLabels: Boolean(request.speakers),
      speakersExpected: request.speakersExpected,
    });
    return {
      text: raw.text,
      detectedLanguage: raw.language,
      segments: raw.segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        speaker: seg.speaker,
      })),
      speakers: raw.speakers.length > 0 ? raw.speakers : null,
      provider: raw.provider,
      model: raw.model,
      usage: {
        durationSeconds: raw.duration,
        costUsd: null,
      },
      meta: {
        gapsFilled: 0,
        qualityPass: request.quality || "enhanced",
        secondPass: false,
      },
    };
  }

  const model =
    request.model ||
    process.env.TRANSCRIPTION_MODEL ||
    "whisper-large-v3-turbo";
  const quality =
    request.quality ||
    (model === "whisper-large-v3" ? "enhanced" : "standard");

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

  // Steady + Deep: second vocab-primed pass for stronger coverage.
  if (quality === "enhanced" || quality === "deep") {
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
      secondPass = picked.text !== best.text;
      best = picked;
    }
  }

  const duration =
    typeof best.duration === "number" && best.duration > 0
      ? best.duration
      : Math.max(
          coverageSeconds(best.segments),
          best.segments.reduce((max, s) => Math.max(max, s.end), 0),
        );

  const filled = await fillCoverageGaps({
    bytes: request.bytes,
    filename: request.filename,
    model,
    language: request.language,
    quality,
    segments: best.segments,
    duration,
    baseText: best.text,
  });

  const segments = filled.segments;
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
      gapsFilled: filled.gapsFilled,
      qualityPass: quality,
      secondPass,
      gapsMissed: filled.gapsMissed,
    },
  };
}
