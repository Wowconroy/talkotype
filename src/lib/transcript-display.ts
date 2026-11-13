/** Helpers for compact inline transcript rendering + timestamp refinement. */

export type DisplaySegment = {
  segment_index: number;
  start_ms: number | null;
  end_ms: number | null;
  text: string;
  speaker_id?: string | null;
  speaker_label?: string | null;
};

export type WordStamp = {
  word: string;
  start: number;
  end: number;
};

export function clockFromMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function isJunkDisplayText(text: string) {
  const t = text.trim();
  if (!t) return true;
  if (/^дякую за перегляд!?$/i.test(t)) return true;
  if (/^thanks for watching!?$/i.test(t)) return true;
  if (/^(музика|звучить музика)$/i.test(t)) return true;
  if (/^(?:[oо]\.?|[.,;:!?…]+)$/iu.test(t)) return true;
  return false;
}

/**
 * Whisper segment starts are often slightly early. Prefer the first word
 * start inside the segment window when word timestamps are available.
 */
export function refineSegmentsWithWords<
  T extends { start: number; end: number; text: string },
>(segments: T[], words: WordStamp[] | null | undefined): T[] {
  if (!words || words.length === 0) return segments;
  const cleaned = words
    .map((w) => ({
      word: (w.word || "").trim(),
      start: Number(w.start),
      end: Number(w.end),
    }))
    .filter(
      (w) =>
        w.word &&
        Number.isFinite(w.start) &&
        Number.isFinite(w.end) &&
        w.end >= w.start,
    );
  if (cleaned.length === 0) return segments;

  return segments.map((seg) => {
    const inRange = cleaned.filter(
      (w) => w.start >= seg.start - 0.35 && w.start <= seg.end + 0.15,
    );
    if (inRange.length === 0) return seg;
    const start = inRange[0].start;
    const end = Math.max(seg.end, inRange[inRange.length - 1].end);
    return { ...seg, start, end };
  });
}

/** Pack segments into dense paragraphs (competitor-style). */
export function groupSegmentsIntoParagraphs(
  segments: DisplaySegment[],
  options?: { maxChars?: number; maxSegments?: number; maxGapMs?: number },
): DisplaySegment[][] {
  const maxChars = options?.maxChars ?? 420;
  const maxSegments = options?.maxSegments ?? 5;
  const maxGapMs = options?.maxGapMs ?? 8_000;
  const paras: DisplaySegment[][] = [];
  let current: DisplaySegment[] = [];
  let chars = 0;

  for (const seg of segments) {
    const prev = current[current.length - 1];
    const gap =
      prev?.end_ms != null && seg.start_ms != null
        ? seg.start_ms - prev.end_ms
        : 0;
    const speakerChanged =
      Boolean(prev?.speaker_id || seg.speaker_id) &&
      prev?.speaker_id !== seg.speaker_id;
    const shouldBreak =
      current.length >= maxSegments ||
      chars + seg.text.length > maxChars ||
      gap > maxGapMs ||
      speakerChanged;

    if (shouldBreak && current.length > 0) {
      paras.push(current);
      current = [];
      chars = 0;
    }
    current.push(seg);
    chars += seg.text.length + 1;
  }
  if (current.length > 0) paras.push(current);
  return paras;
}
