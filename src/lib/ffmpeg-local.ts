import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const execFileAsync = promisify(execFile);

let ffmpegPathCache: string | null | undefined;
let ffprobePathCache: string | null | undefined;
let ffmpegAvailable: boolean | null = null;

function resolveFfmpegPath(): string | null {
  if (ffmpegPathCache !== undefined) return ffmpegPathCache;
  const bundled =
    typeof ffmpegStatic === "string" && existsSync(ffmpegStatic)
      ? ffmpegStatic
      : null;
  ffmpegPathCache = bundled ?? "ffmpeg";
  return ffmpegPathCache;
}

function resolveFfprobePath(): string | null {
  if (ffprobePathCache !== undefined) return ffprobePathCache;
  const candidate =
    typeof ffprobeStatic?.path === "string" ? ffprobeStatic.path : null;
  const bundled = candidate && existsSync(candidate) ? candidate : null;
  ffprobePathCache = bundled ?? "ffprobe";
  return ffprobePathCache;
}

export async function isFfmpegAvailable() {
  if (ffmpegAvailable != null) return ffmpegAvailable;
  const ffmpeg = resolveFfmpegPath();
  const ffprobe = resolveFfprobePath();
  if (!ffmpeg || !ffprobe) {
    ffmpegAvailable = false;
    return false;
  }
  try {
    await execFileAsync(ffmpeg, ["-version"], { timeout: 8000 });
    await execFileAsync(ffprobe, ["-version"], { timeout: 8000 });
    ffmpegAvailable = true;
  } catch {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

function safeName(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "_") || "audio.bin";
}

/**
 * Full-file extract to mono 16 kHz MP3 (small + Groq-friendly).
 * Prefer MP3 over FLAC so 20–30 min videos stay well under provider limits.
 */
export async function extractAudioFile(params: {
  sourceBytes: Uint8Array;
  sourceFilename: string;
  maxSeconds?: number | null;
}): Promise<{ bytes: Buffer; filename: string; contentType: string } | null> {
  if (!(await isFfmpegAvailable())) return null;

  const ffmpeg = resolveFfmpegPath();
  if (!ffmpeg) return null;

  const dir = join(tmpdir(), "talkotype-extract", randomUUID());
  mkdirSync(dir, { recursive: true });
  const input = join(dir, safeName(params.sourceFilename));
  const output = join(dir, "audio.mp3");

  try {
    writeFileSync(input, Buffer.from(params.sourceBytes));
    const args = [
      "-y",
      "-i",
      input,
      "-vn",
      "-map",
      "0:a:0?",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "64k",
    ];
    if (params.maxSeconds && params.maxSeconds > 0) {
      args.push("-t", String(params.maxSeconds));
    }
    args.push(output);

    await execFileAsync(ffmpeg, args, {
      timeout: 240_000,
      maxBuffer: 32 * 1024 * 1024,
    });
    if (!existsSync(output)) return null;
    return {
      bytes: readFileSync(output),
      filename: "audio.mp3",
      contentType: "audio/mpeg",
    };
  } catch {
    return null;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

/** Cut a time range to mono 16 kHz FLAC for a gap-fill pass. */
export async function extractAudioSlice(params: {
  sourceBytes: Uint8Array;
  sourceFilename: string;
  startSec: number;
  durationSec: number;
}): Promise<{ bytes: Buffer; filename: string } | null> {
  if (!(await isFfmpegAvailable())) return null;

  const ffmpeg = resolveFfmpegPath();
  if (!ffmpeg) return null;

  const dir = join(tmpdir(), "talkotype-gap", randomUUID());
  mkdirSync(dir, { recursive: true });
  const input = join(dir, safeName(params.sourceFilename));
  const output = join(dir, "slice.flac");

  try {
    writeFileSync(input, Buffer.from(params.sourceBytes));
    await execFileAsync(
      ffmpeg,
      [
        "-y",
        "-ss",
        String(Math.max(0, params.startSec)),
        "-i",
        input,
        "-t",
        String(Math.max(0.5, params.durationSec)),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "flac",
        output,
      ],
      { timeout: 120_000, maxBuffer: 16 * 1024 * 1024 },
    );
    if (!existsSync(output)) return null;
    return { bytes: readFileSync(output), filename: "slice.flac" };
  } catch {
    return null;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

export function looksLikeVideo(params: {
  filename?: string | null;
  contentType?: string | null;
}) {
  const type = (params.contentType || "").toLowerCase();
  if (type.startsWith("video/")) return true;
  const name = (params.filename || "").toLowerCase();
  return /\.(mp4|mov|m4v|webm|mkv|avi|wmv)$/i.test(name);
}

/** Groq Whisper practical upload ceiling. */
export const GROQ_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
