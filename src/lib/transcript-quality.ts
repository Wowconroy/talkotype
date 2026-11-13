export type TimedSegment = {
  start: number;
  end: number;
  text: string;
};

/** Phrases Whisper invents on music outros / silence. */
const HALLUCINATION_PATTERNS: RegExp[] = [
  /^дякую за перегляд!?$/i,
  /^thanks for watching!?$/i,
  /^thank you for watching!?$/i,
  /^підписуйтесь.*$/i,
  /^subscribe.*$/i,
  /^like and subscribe.*$/i,
  /^див(і|и)ться інші.*$/i,
  /^see you next time!?$/i,
];

/** Non-lexical labels that are not sung/spoken lyrics. */
const NON_SPEECH_ONLY =
  /^(музика|music|звучить музика|\[music\]|\(music\)|♪+|instrumental)+[.!?]*$/i;

export function isHallucinatedSegment(text: string) {
  const t = text.trim();
  if (!t) return true;
  if (NON_SPEECH_ONLY.test(t)) return true;
  return HALLUCINATION_PATTERNS.some((re) => re.test(t));
}

export function cleanSegments(segments: TimedSegment[]): TimedSegment[] {
  const cleaned = segments
    .map((s) => ({
      ...s,
      text: s.text.replace(/\s+/g, " ").trim(),
    }))
    .filter((s) => s.text && !isHallucinatedSegment(s.text));

  // Collapse runs of short vocalises (Ух! / Uh!) into one timed line.
  const out: TimedSegment[] = [];
  for (const seg of cleaned) {
    const vocalise = /^(ух|uh)[!.,]*$/i.test(seg.text);
    const prev = out[out.length - 1];
    if (
      vocalise &&
      prev &&
      /^(ух|uh)[!.,]*$/i.test(prev.text.split(/\s+/).pop() || "")
    ) {
      prev.end = seg.end;
      if (!/ух-ух/i.test(prev.text)) {
        prev.text = `${prev.text.replace(/[!]+$/g, "")}-ух!`;
      }
      continue;
    }
    out.push({ ...seg });
  }
  return out;
}

export function textFromSegments(segments: TimedSegment[]) {
  return segments
    .map((s) => s.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHallucinationsFromText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(
      /\s*(?:Дякую за перегляд|Thanks for watching|Thank you for watching)!?\s*/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export type Gap = { start: number; end: number; duration: number };

/** Find timeline holes where Whisper skipped content. */
export function findCoverageGaps(
  segments: TimedSegment[],
  durationSeconds: number,
  options?: { minGapSeconds?: number; endPadding?: number },
): Gap[] {
  const minGap = options?.minGapSeconds ?? 8;
  const endPadding = options?.endPadding ?? 1.5;
  const cleaned = [...segments].sort((a, b) => a.start - b.start);
  const gaps: Gap[] = [];

  let cursor = 0;
  for (const seg of cleaned) {
    if (seg.start - cursor >= minGap) {
      gaps.push({
        start: cursor,
        end: seg.start,
        duration: seg.start - cursor,
      });
    }
    cursor = Math.max(cursor, seg.end);
  }

  const end = Math.max(0, durationSeconds - endPadding);
  if (end - cursor >= minGap) {
    gaps.push({ start: cursor, end, duration: end - cursor });
  }

  return gaps;
}

export function mergeSegmentsWithFills(
  base: TimedSegment[],
  fills: TimedSegment[],
): TimedSegment[] {
  return cleanSegments([...base, ...fills]).sort((a, b) => a.start - b.start);
}

export function coverageSeconds(segments: TimedSegment[]) {
  return segments.reduce(
    (sum, s) => sum + Math.max(0, s.end - s.start),
    0,
  );
}

export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Prefer the pass with more real words / timeline coverage. */
export function pickBetterPass<
  T extends { text: string; segments: TimedSegment[] },
>(a: T, b: T): T {
  const ca = cleanSegments(a.segments);
  const cb = cleanSegments(b.segments);
  const score = (text: string, segs: TimedSegment[]) =>
    wordCount(stripHallucinationsFromText(text)) * 2 + coverageSeconds(segs);
  return score(b.text, cb) > score(a.text, ca)
    ? { ...b, segments: cb, text: textFromSegments(cb) || stripHallucinationsFromText(b.text) }
    : { ...a, segments: ca, text: textFromSegments(ca) || stripHallucinationsFromText(a.text) };
}

/** Vocab priming from a first pass — never instruct "don't say X" (Whisper echoes it). */
export function vocabularyPromptFromTranscript(text: string) {
  const cleaned = stripHallucinationsFromText(text)
    .replace(/\b(ух[!.,]*)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 12) return null;
  return cleaned.slice(0, 400);
}

export function continuationPrompt(segments: TimedSegment[], beforeSec: number) {
  const prior = segments
    .filter((s) => s.end <= beforeSec + 0.5)
    .map((s) => s.text)
    .join(" ");
  const slice = stripHallucinationsFromText(prior).slice(-240);
  return slice.length >= 12 ? slice : null;
}
