/** Verified upload formats for the product brief (Task 2). */

export const ACCEPTED_EXTENSIONS = [
  "mp3",
  "mp4",
  "m4a",
  "mov",
  "aac",
  "wav",
  "ogg",
  "opus",
  "mpeg",
  "mpg",
  "wma",
  "wmv",
] as const;

export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

/** MIME types browsers commonly send for the formats above. */
export const ACCEPTED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/opus",
  "audio/webm",
  "audio/x-ms-wma",
  "video/mp4",
  "video/quicktime",
  "video/x-ms-wmv",
  "video/mpeg",
  "video/x-mpeg",
  "application/ogg",
  "application/octet-stream", // some browsers omit type — extension still checked
]);

export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(
  ",",
);

export function extensionOf(filename: string): string {
  const parts = filename.trim().toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

export function isAcceptedMediaFile(params: {
  filename: string;
  contentType?: string | null;
}): { ok: true } | { ok: false; error: string } {
  const ext = extensionOf(params.filename);
  if (!ext || !(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    return {
      ok: false,
      error: `Unsupported format “.${ext || "unknown"}”. Use: ${ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}.`,
    };
  }

  const mime = (params.contentType ?? "").trim().toLowerCase();
  if (mime && !ACCEPTED_MIME_TYPES.has(mime)) {
    // Extension passed; some OSes send odd MIME — warn only if clearly wrong family.
    const looksAudioVideo =
      mime.startsWith("audio/") ||
      mime.startsWith("video/") ||
      mime === "application/ogg" ||
      mime === "application/octet-stream";
    if (!looksAudioVideo) {
      return {
        ok: false,
        error: `File type “${mime}” is not an audio/video upload we accept.`,
      };
    }
  }

  return { ok: true };
}
