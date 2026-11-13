import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Mirror worker merge logic for a lightweight unit check in the app package.
function dedupeOverlap(previous: string, next: string) {
  const prevWords = previous.split(/\s+/);
  const nextWords = next.split(/\s+/);
  const max = Math.min(24, prevWords.length, nextWords.length);
  for (let n = max; n >= 4; n--) {
    const tail = prevWords.slice(-n).join(" ").toLowerCase();
    const head = nextWords.slice(0, n).join(" ").toLowerCase();
    if (tail === head) return nextWords.slice(n).join(" ");
  }
  return next;
}

function mergeChunkTexts(chunks: Array<{ startSec: number; text: string }>) {
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

describe("chunk merge", () => {
  it("orders by start and removes overlapped words", () => {
    const text = mergeChunkTexts([
      { startSec: 0, text: "hello world this is chunk one" },
      {
        startSec: 8,
        text: "this is chunk one and now chunk two continues",
      },
    ]);
    assert.match(text, /hello world this is chunk one and now chunk two continues/i);
    assert.doesNotMatch(text, /chunk one this is chunk one/i);
  });
});
