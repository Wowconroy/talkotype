/**
 * Import-from-link: resolve public media URLs → bytes for R2 + transcription.
 * Supports direct media URLs, public Google Drive files, and Dropbox shares.
 * YouTube needs a downloadable file URL (or the Fly worker with yt-dlp) for now.
 */

import { isIP } from "node:net";
import {
  ACCEPTED_EXTENSIONS,
  extensionOf,
  isAcceptedMediaFile,
} from "@/lib/accepted-media";
import { maxUploadBytes, type PlanTier } from "@/lib/plan-limits";

/** Soft cap so Vercel serverless does not OOM buffering the download. */
export const LINK_INGEST_MAX_BYTES = 200 * 1024 * 1024;

export type LinkHostKind = "direct" | "youtube" | "gdrive" | "dropbox";

export class LinkIngestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "LinkIngestError";
    this.code = code;
  }
}

export function classifyLinkHost(rawUrl: string): LinkHostKind {
  let host = "";
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "m.youtube.com" ||
    host === "www.youtube.com"
  ) {
    return "youtube";
  }
  if (
    host === "drive.google.com" ||
    host === "docs.google.com" ||
    host.endsWith(".googleusercontent.com")
  ) {
    return "gdrive";
  }
  if (
    host === "dropbox.com" ||
    host.endsWith(".dropbox.com") ||
    host.includes("dropboxusercontent.com")
  ) {
    return "dropbox";
  }
  return "direct";
}

/** Rewrite share pages to a direct (or closer-to-direct) download URL. */
export function resolveDownloadUrl(rawUrl: string): string {
  const kind = classifyLinkHost(rawUrl);
  const url = new URL(rawUrl);

  if (kind === "dropbox") {
    url.searchParams.set("dl", "1");
    url.searchParams.delete("raw");
    return url.toString();
  }

  if (kind === "gdrive") {
    const fromPath = url.pathname.match(/\/file\/d\/([^/]+)/);
    const id =
      fromPath?.[1] ||
      url.searchParams.get("id") ||
      url.searchParams.get("file_id");
    if (id) {
      return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
    }
  }

  return rawUrl;
}

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!v4) return false;
  const a = Number(v4[1]);
  const b = Number(v4[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/** Block SSRF to localhost / link-local / cloud metadata. */
export async function assertPublicHttpUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new LinkIngestError("invalid_url", "That does not look like a valid URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new LinkIngestError("invalid_url", "Only http(s) links are supported.");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "metadata.google.internal" ||
    host === "metadata" ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    throw new LinkIngestError("blocked_host", "That host is not allowed.");
  }
  if (isIP(host) && isPrivateIp(host)) {
    throw new LinkIngestError("blocked_host", "Private network addresses are not allowed.");
  }
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1].trim().replace(/"/g, ""));
    } catch {
      /* fall through */
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() || null;
}

function filenameFromUrl(rawUrl: string): string {
  try {
    const path = new URL(rawUrl).pathname;
    const base = path.split("/").filter(Boolean).pop() || "media.bin";
    return decodeURIComponent(base);
  } catch {
    return "media.bin";
  }
}

function extFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/m4a": "m4a",
    "audio/aac": "aac",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/opus": "opus",
    "audio/webm": "webm",
    "audio/x-ms-wma": "wma",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/x-ms-wmv": "wmv",
    "video/mpeg": "mpeg",
    "video/webm": "webm",
  };
  return map[mime.split(";")[0]!.trim().toLowerCase()] ?? null;
}

function ensureFilename(params: {
  url: string;
  contentType: string | null;
  contentDisposition: string | null;
}): string {
  const fromHeader = filenameFromDisposition(params.contentDisposition);
  let name = fromHeader || filenameFromUrl(params.url);
  name = name.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "_").slice(0, 120);
  if (!extensionOf(name)) {
    const ext = extFromMime(params.contentType || "") || "mp3";
    name = `${name.replace(/\.$/, "")}.${ext}`;
  }
  return name || "media.mp3";
}

export function linkIngestLimitBytes(plan: PlanTier) {
  return Math.min(maxUploadBytes(plan), LINK_INGEST_MAX_BYTES);
}

export type FetchedLinkMedia = {
  bytes: Buffer;
  filename: string;
  contentType: string;
  sourceUrl: string;
  hostKind: LinkHostKind;
};

/**
 * Download a public media URL into memory (capped).
 * Callers must have already rejected YouTube if unsupported.
 */
export async function fetchLinkMedia(params: {
  sourceUrl: string;
  plan: PlanTier;
  signal?: AbortSignal;
}): Promise<FetchedLinkMedia> {
  const hostKind = classifyLinkHost(params.sourceUrl);
  if (hostKind === "youtube") {
    throw new LinkIngestError(
      "youtube_unsupported",
      "YouTube links are not downloadable here yet. Download the audio/video and upload the file, or paste a direct MP3/MP4 URL.",
    );
  }

  await assertPublicHttpUrl(params.sourceUrl);
  const downloadUrl = resolveDownloadUrl(params.sourceUrl);
  await assertPublicHttpUrl(downloadUrl);

  const maxBytes = linkIngestLimitBytes(params.plan);

  const res = await fetch(downloadUrl, {
    redirect: "follow",
    signal: params.signal ?? AbortSignal.timeout(120_000),
    headers: {
      // Some hosts (Drive/Dropbox) behave better with a browser-like UA.
      "User-Agent":
        "Mozilla/5.0 (compatible; TalkotypeBot/1.0; +https://talkotype.app)",
      Accept: "audio/*,video/*,application/octet-stream,*/*",
    },
  });

  if (!res.ok) {
    throw new LinkIngestError(
      "fetch_failed",
      `Could not download that link (${res.status}). Make sure it is public.`,
    );
  }

  const contentType = (res.headers.get("content-type") || "").split(";")[0]!
    .trim()
    .toLowerCase();
  const contentLength = Number(res.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new LinkIngestError(
      "too_large",
      `That file is too large for link import (max ${Math.round(maxBytes / (1024 * 1024))} MB). Upload the file from your device instead.`,
    );
  }

  // Google Drive virus-scan interstitial returns HTML.
  if (contentType.includes("text/html")) {
    throw new LinkIngestError(
      "not_direct_media",
      hostKind === "gdrive"
        ? "Google Drive blocked the direct download (file may need “Anyone with the link”, or is too large). Download it and upload the file instead."
        : "That URL returned a web page, not an audio/video file. Paste a direct media link.",
    );
  }

  const filename = ensureFilename({
    url: downloadUrl,
    contentType,
    contentDisposition: res.headers.get("content-disposition"),
  });

  const accepted = isAcceptedMediaFile({
    filename,
    contentType: contentType || "application/octet-stream",
  });
  // Allow missing/odd MIME when the extension is known; otherwise require AV type.
  if (!accepted.ok) {
    const ext = extensionOf(filename);
    const known = (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext);
    const looksAv =
      !contentType ||
      contentType.startsWith("audio/") ||
      contentType.startsWith("video/") ||
      contentType === "application/octet-stream" ||
      contentType === "binary/octet-stream";
    if (!known || !looksAv) {
      throw new LinkIngestError("unsupported_format", accepted.error);
    }
  }

  const ab = await res.arrayBuffer();
  if (ab.byteLength <= 0) {
    throw new LinkIngestError("empty", "The download was empty.");
  }
  if (ab.byteLength > maxBytes) {
    throw new LinkIngestError(
      "too_large",
      `That file is too large for link import (max ${Math.round(maxBytes / (1024 * 1024))} MB). Upload the file from your device instead.`,
    );
  }

  const resolvedType =
    contentType && contentType !== "application/octet-stream"
      ? contentType
      : extFromMime(contentType || "")
        ? contentType
        : guessMimeFromFilename(filename);

  return {
    bytes: Buffer.from(ab),
    filename,
    contentType: resolvedType,
    sourceUrl: params.sourceUrl,
    hostKind,
  };
}

function guessMimeFromFilename(filename: string): string {
  const ext = extensionOf(filename);
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    m4a: "audio/mp4",
    mov: "video/quicktime",
    aac: "audio/aac",
    wav: "audio/wav",
    ogg: "audio/ogg",
    opus: "audio/opus",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    wma: "audio/x-ms-wma",
    wmv: "video/x-ms-wmv",
    webm: "video/webm",
  };
  return map[ext] || "application/octet-stream";
}
