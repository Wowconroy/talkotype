import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyLinkHost,
  resolveDownloadUrl,
  assertPublicHttpUrl,
  LinkIngestError,
} from "./link-ingest";

describe("classifyLinkHost", () => {
  it("detects youtube hosts", () => {
    assert.equal(
      classifyLinkHost("https://www.youtube.com/watch?v=abc"),
      "youtube",
    );
    assert.equal(classifyLinkHost("https://youtu.be/abc"), "youtube");
  });

  it("detects drive and dropbox", () => {
    assert.equal(
      classifyLinkHost("https://drive.google.com/file/d/xyz/view"),
      "gdrive",
    );
    assert.equal(
      classifyLinkHost("https://www.dropbox.com/s/abc/file.mp3?dl=0"),
      "dropbox",
    );
  });

  it("defaults to direct", () => {
    assert.equal(
      classifyLinkHost("https://cdn.example.com/talk.mp3"),
      "direct",
    );
  });
});

describe("resolveDownloadUrl", () => {
  it("rewrites Google Drive file links", () => {
    const out = resolveDownloadUrl(
      "https://drive.google.com/file/d/FILE123/view?usp=sharing",
    );
    assert.match(out, /uc\?export=download/);
    assert.match(out, /FILE123/);
  });

  it("forces Dropbox dl=1", () => {
    const out = resolveDownloadUrl(
      "https://www.dropbox.com/s/abc/clip.mp3?dl=0",
    );
    assert.match(out, /dl=1/);
  });
});

describe("assertPublicHttpUrl", () => {
  it("blocks localhost", async () => {
    await assert.rejects(
      () => assertPublicHttpUrl("http://localhost/secret.mp3"),
      (err: unknown) => err instanceof LinkIngestError,
    );
  });

  it("allows public https", async () => {
    await assertPublicHttpUrl("https://cdn.example.com/a.mp3");
  });
});
