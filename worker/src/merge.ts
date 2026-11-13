export type TimedSegment = {
  start: number;
  end: number;
  text: string;
};

/**
 * Merge chunk transcripts in timeline order.
 * Drops duplicated boundary text from overlaps by comparing word tails/heads.
 */
export function mergeChunkTexts(
  chunks: Array<{ startSec: number; text: string }>,
): string {
  const ordered = [...chunks].sort((a, b) => a.startSec - b.startSec);
  let out = "";
  for (const chunk of ordered) {
    const text = chunk.text.trim();
    if (!text) continue;
    if (!out) {
      out = text;
      continue;
    }
    out = `${out} ${dedupeOverlap(out, text)}`.replace(/\s+/g, " ").trim();
  }
  return out;
}

const JUNK_ONLY = /^(?:[oо]\.?|[.,;:!?…]+|…+)$/iu;
const HALLUCINATION_ONLY =
  /^(дякую за перегляд!?|thanks for watching!?|thank you for watching!?|музика|music)$/i;

function isJunkSegment(text: string) {
  const t = text.trim();
  if (!t) return true;
  if (JUNK_ONLY.test(t)) return true;
  if (HALLUCINATION_ONLY.test(t)) return true;
  return false;
}

export function mergeSegments(
  chunks: Array<{ startSec: number; segments: TimedSegment[] }>,
): TimedSegment[] {
  const merged: TimedSegment[] = [];
  for (const chunk of [...chunks].sort((a, b) => a.startSec - b.startSec)) {
    for (const seg of chunk.segments) {
      const text = seg.text.replace(/\s+/g, " ").trim();
      if (isJunkSegment(text)) continue;
      merged.push({
        start: seg.start + chunk.startSec,
        end: seg.end + chunk.startSec,
        text,
      });
    }
  }
  // Drop near-duplicate overlap segments (same text within 1.5s window).
  const deduped: TimedSegment[] = [];
  for (const seg of merged.sort((a, b) => a.start - b.start)) {
    const prev = deduped[deduped.length - 1];
    if (
      prev &&
      prev.text.toLowerCase() === seg.text.toLowerCase() &&
      Math.abs(seg.start - prev.start) < 1.5
    ) {
      prev.end = Math.max(prev.end, seg.end);
      continue;
    }
    deduped.push(seg);
  }
  return deduped;
}

function dedupeOverlap(previous: string, next: string) {
  const prevWords = previous.split(/\s+/);
  const nextWords = next.split(/\s+/);
  const max = Math.min(24, prevWords.length, nextWords.length);
  for (let n = max; n >= 4; n--) {
    const tail = prevWords.slice(-n).join(" ").toLowerCase();
    const head = nextWords.slice(0, n).join(" ").toLowerCase();
    if (tail === head) {
      return nextWords.slice(n).join(" ");
    }
  }
  return next;
}
