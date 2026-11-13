import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FREE_MEDIA_RETENTION_DAYS, mediaExpiresAt } from "./plan-limits";

describe("free media retention", () => {
  it("sets a 7-day expiry for free and null for unlimited", () => {
    const from = new Date("2026-11-13T12:00:00.000Z");
    assert.equal(FREE_MEDIA_RETENTION_DAYS, 7);
    assert.equal(
      mediaExpiresAt("free", from),
      "2026-11-20T12:00:00.000Z",
    );
    assert.equal(mediaExpiresAt("unlimited", from), null);
  });
});
