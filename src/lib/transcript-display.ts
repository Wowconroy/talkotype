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

function cleanWords(words: WordStamp[] | null | undefined): WordStamp[] {
  if (!words || words.length === 0) return [];
  return words
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
}

/**
 * When the provider returns word stamps but no segments (e.g. FormData only
 * kept `timestamp_granularities[]=word`), rebuild sentence-ish segments.
 */
export function segmentsFromWords(
  words: WordStamp[] | null | undefined,
): Array<{ start: number; end: number; text: string }> {
  const cleaned = cleanWords(words);
  if (cleaned.length === 0) return [];

  const out: Array<{ start: number; end: number; text: string }> = [];
  let buf: WordStamp[] = [];

  const flush = () => {
    if (buf.length === 0) return;
    out.push({
      start: buf[0].start,
      end: buf[buf.length - 1].end,
      text: buf
        .map((w) => w.word)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    });
    buf = [];
  };

  for (let i = 0; i < cleaned.length; i++) {
    const w = cleaned[i];
    const next = cleaned[i + 1];
    buf.push(w);
    const ended = /[.!?…]$/.test(w.word);
    const longPause = next ? next.start - w.end >= 0.7 : false;
    const manyWords = buf.length >= 16;
    if (ended || longPause || manyWords || !next) flush();
  }
  return out.filter((s) => s.text);
}

/**
 * Whisper segment starts are often slightly early. Prefer the first word
 * start inside the segment window when word timestamps are available.
 */
export function refineSegmentsWithWords<
  T extends { start: number; end: number; text: string },
>(segments: T[], words: WordStamp[] | null | undefined): T[] {
  const cleaned = cleanWords(words);
  if (cleaned.length === 0) return segments;
  if (!segments || segments.length === 0) {
    return segmentsFromWords(cleaned) as T[];
  }

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

/** Finalise ASR segments: refine, or rebuild from words when segments missing. */
export function ensureTimedSegments(
  segments: Array<{ start: number; end: number; text: string }> | null | undefined,
  words?: WordStamp[] | null,
): Array<{ start: number; end: number; text: string }> {
  const refined = refineSegmentsWithWords(segments ?? [], words);
  if (refined.length > 0) return refined;
  return segmentsFromWords(words);
}

/** Split a plain transcript blob into sentence-sized chunks for display. */
export function splitPlainTextSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts =
    cleaned.match(/[^.!?…]+(?:[.!?…]+["”']?|(?=$))/g) ?? [cleaned];
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * When DB segments are missing, fabricate clickable sentences with times
 * proportional to character offset across the known duration.
 */
export function syntheticSegmentsFromText(
  text: string,
  durationSeconds: number | null | undefined,
): DisplaySegment[] {
  const sentences = splitPlainTextSentences(text);
  if (sentences.length === 0) return [];
  const totalChars = sentences.reduce((n, s) => n + s.length, 0) || 1;
  const durationMs = Math.max(
    1,
    Math.round((durationSeconds && durationSeconds > 0 ? durationSeconds : 60) * 1000),
  );
  let offset = 0;
  return sentences.map((sentence, index) => {
    const start_ms = Math.round((offset / totalChars) * durationMs);
    offset += sentence.length;
    const end_ms = Math.round((offset / totalChars) * durationMs);
    return {
      segment_index: index,
      start_ms,
      end_ms: Math.max(end_ms, start_ms + 1),
      text: sentence,
      speaker_id: null,
      speaker_label: null,
    };
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
