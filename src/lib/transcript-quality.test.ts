import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cleanSegments,
  findCoverageGaps,
  isHallucinatedSegment,
  pickBetterPass,
  stripHallucinationsFromText,
  vocabularyPromptFromTranscript,
} from "./transcript-quality";

describe("transcript quality", () => {
  it("flags thanks-for-watching hallucinations", () => {
    assert.equal(isHallucinatedSegment("Дякую за перегляд!"), true);
    assert.equal(isHallucinatedSegment("Thanks for watching"), true);
    assert.equal(isHallucinatedSegment("Музика"), true);
    assert.equal(isHallucinatedSegment("Хто кабачок"), false);
  });

  it("finds skipped mid-song gaps", () => {
    const gaps = findCoverageGaps(
      [
        { start: 0, end: 54, text: "verse one" },
        { start: 106, end: 150, text: "verse two" },
      ],
      162,
      { minGapSeconds: 8 },
    );
    assert.ok(gaps.some((g) => g.start < 60 && g.end > 100));
  });

  it("cleans segments and strips thanks anywhere", () => {
    const segs = cleanSegments([
      { start: 0, end: 2, text: "Привіт" },
      { start: 2, end: 3, text: "Музика" },
      { start: 155, end: 160, text: "Дякую за перегляд!" },
    ]);
    assert.equal(segs.length, 1);
    assert.equal(
      stripHallucinationsFromText("Куплет. Дякую за перегляд! Ще рядок"),
      "Куплет. Ще рядок",
    );
  });

  it("picks the denser second pass", () => {
    const a = {
      text: "short",
      segments: [{ start: 0, end: 2, text: "short" }],
    };
    const b = {
      text: "much longer transcript with many useful words here",
      segments: [
        { start: 0, end: 10, text: "much longer transcript" },
        { start: 10, end: 20, text: "with many useful words here" },
      ],
    };
    const picked = pickBetterPass(a, b);
    assert.match(picked.text, /longer transcript/i);
  });

  it("builds vocab prompt without instructional negations", () => {
    const prompt = vocabularyPromptFromTranscript(
      "Хто кабачок Меланія Дякую за перегляд!",
    );
    assert.ok(prompt);
    assert.doesNotMatch(prompt!, /дякую за перегляд/i);
    assert.match(prompt!, /кабачок/i);
  });
});
