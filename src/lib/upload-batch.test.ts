import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAcceptedMediaFile } from "./accepted-media";
import {
  FREE_MAX_CONCURRENT,
  UNLIMITED_MAX_CONCURRENT,
  UNLIMITED_UPLOAD_POOL,
} from "./plan-limits";
import {
  canStartNewJob,
  selectUploadBatch,
  validateUploadCandidate,
} from "./upload-batch";

function file(name: string, size = 1024, type = "audio/mpeg") {
  return { name, size, type };
}

describe("format allowlist", () => {
  it("accepts advertised extensions", () => {
    for (const ext of [
      "mp3",
      "mp4",
      "m4a",
      "mov",
      "aac",
      "wav",
      "ogg",
      "opus",
      "mpeg",
      "wma",
      "wmv",
    ]) {
      const r = isAcceptedMediaFile({
        filename: `clip.${ext}`,
        contentType: "application/octet-stream",
      });
      assert.equal(r.ok, true, ext);
    }
  });

  it("rejects unsupported formats", () => {
    const r = isAcceptedMediaFile({
      filename: "notes.pdf",
      contentType: "application/pdf",
    });
    assert.equal(r.ok, false);
  });
});

describe("free upload batch", () => {
  it("accepts a single file", () => {
    const d = selectUploadBatch("free", [file("a.mp3")]);
    assert.equal(d.ok, true);
    if (d.ok) assert.equal(d.files.length, 1);
  });

  it("requires a choice when multiple files are dropped", () => {
    const d = selectUploadBatch("free", [
      file("a.mp3"),
      file("b.mp3"),
      file("c.mp3"),
    ]);
    assert.equal(d.ok, false);
    assert.equal(d.needsChoice, true);
    assert.equal(d.files.length, 3);
    assert.match(d.error, /one active upload/i);
  });

  it("blocks a second concurrent job while one is active", () => {
    const r = canStartNewJob({ plan: "free", activeCount: FREE_MAX_CONCURRENT });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.maxConcurrent, 1);
  });
});

describe("paid upload batch", () => {
  it("allows up to 20 files", () => {
    const files = Array.from({ length: 20 }, (_, i) => file(`f${i}.mp3`));
    const d = selectUploadBatch("unlimited", files);
    assert.equal(d.ok, true);
    if (d.ok) {
      assert.equal(d.files.length, 20);
      assert.equal(d.truncated, false);
      assert.equal(d.uploadPool, UNLIMITED_UPLOAD_POOL);
    }
  });

  it("truncates the 21st file in one batch", () => {
    const files = Array.from({ length: 21 }, (_, i) => file(`f${i}.mp3`));
    const d = selectUploadBatch("unlimited", files);
    assert.equal(d.ok, true);
    if (d.ok) {
      assert.equal(d.files.length, UNLIMITED_MAX_CONCURRENT);
      assert.equal(d.truncated, true);
    }
  });

  it("rejects when concurrent slots are full", () => {
    const r = canStartNewJob({
      plan: "unlimited",
      activeCount: UNLIMITED_MAX_CONCURRENT,
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.maxConcurrent, 20);
  });

  it("allows starting when under the concurrent cap", () => {
    const r = canStartNewJob({
      plan: "unlimited",
      activeCount: UNLIMITED_MAX_CONCURRENT - 1,
    });
    assert.equal(r.ok, true);
  });
});

describe("size validation", () => {
  it("rejects oversize free uploads", () => {
    const r = validateUploadCandidate("free", {
      name: "huge.mp3",
      size: 2 * 1024 * 1024 * 1024,
      type: "audio/mpeg",
    });
    assert.equal(r.ok, false);
  });

  it("accepts a normal mp3", () => {
    const r = validateUploadCandidate("unlimited", file("ok.mp3", 5_000_000));
    assert.equal(r.ok, true);
  });
});
