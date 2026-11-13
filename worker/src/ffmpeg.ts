import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);

export type ProbeResult = {
  durationSeconds: number;
  hasAudio: boolean;
  formatName: string | null;
};

export async function probeMedia(filePath: string): Promise<ProbeResult> {
  const { stdout } = await execFileAsync(
    "ffprobe",
    [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
  const json = JSON.parse(stdout) as {
    format?: { duration?: string; format_name?: string };
    streams?: Array<{ codec_type?: string }>;
  };
  const duration = Number(json.format?.duration ?? 0);
  const hasAudio = (json.streams ?? []).some((s) => s.codec_type === "audio");
  return {
    durationSeconds: Number.isFinite(duration) ? duration : 0,
    hasAudio,
    formatName: json.format?.format_name ?? null,
  };
}

export function workDir(jobId: string) {
  const dir = join(tmpdir(), "talkotype-worker", jobId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Extract mono 16 kHz FLAC (Groq-friendly, small, lossless). */
export async function extractAudio(params: {
  inputPath: string;
  outputPath: string;
  maxSeconds?: number | null;
}) {
  const args = [
    "-y",
    "-i",
    params.inputPath,
    "-vn",
    "-map",
    "0:a:0?",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-c:a",
    "flac",
  ];
  if (params.maxSeconds && params.maxSeconds > 0) {
    args.push("-t", String(params.maxSeconds));
  }
  args.push(params.outputPath);
  try {
    await execFileAsync("ffmpeg", args, { maxBuffer: 16 * 1024 * 1024 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/Stream map|matches no streams|does not contain/i.test(message)) {
      throw new Error("missing_audio_track");
    }
    throw new Error(`ffmpeg_extract_failed: ${message.slice(0, 180)}`);
  }
  if (!existsSync(params.outputPath)) {
    throw new Error("ffmpeg_extract_empty");
  }
}

export type ChunkPlan = {
  index: number;
  startSec: number;
  endSec: number;
  path: string;
};

export async function splitAudioChunks(params: {
  audioPath: string;
  outDir: string;
  durationSeconds: number;
  chunkSeconds: number;
  overlapSeconds: number;
}): Promise<ChunkPlan[]> {
  const chunks: ChunkPlan[] = [];
  const step = Math.max(30, params.chunkSeconds - params.overlapSeconds);
  let start = 0;
  let index = 0;

  while (start < params.durationSeconds - 0.05) {
    const end = Math.min(params.durationSeconds, start + params.chunkSeconds);
    const out = join(params.outDir, `chunk-${String(index).padStart(4, "0")}.flac`);
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-ss",
        String(start),
        "-i",
        params.audioPath,
        "-t",
        String(end - start),
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "flac",
        out,
      ],
      { maxBuffer: 16 * 1024 * 1024 },
    );
    chunks.push({ index, startSec: start, endSec: end, path: out });
    index += 1;
    if (end >= params.durationSeconds) break;
    start += step;
  }

  return chunks;
}

export function writeOriginalTemp(dir: string, bytes: Buffer, filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  const path = join(dir, `original-${randomUUID()}-${safe || "media.bin"}`);
  writeFileSync(path, bytes);
  return path;
}
