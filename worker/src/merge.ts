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

export function mergeSegments(
  chunks: Array<{ startSec: number; segments: TimedSegment[] }>,
): TimedSegment[] {
  const merged: TimedSegment[] = [];
  for (const chunk of [...chunks].sort((a, b) => a.startSec - b.startSec)) {
    for (const seg of chunk.segments) {
      merged.push({
        start: seg.start + chunk.startSec,
        end: seg.end + chunk.startSec,
        text: seg.text.trim(),
      });
    }
  }
  return merged.filter((s) => s.text);
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
