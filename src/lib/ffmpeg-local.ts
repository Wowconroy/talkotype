import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);

let ffmpegAvailable: boolean | null = null;

export async function isFfmpegAvailable() {
  if (ffmpegAvailable != null) return ffmpegAvailable;
  try {
    await execFileAsync("ffmpeg", ["-version"], { timeout: 5000 });
    await execFileAsync("ffprobe", ["-version"], { timeout: 5000 });
    ffmpegAvailable = true;
  } catch {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

/** Cut a time range to mono 16 kHz FLAC for a gap-fill pass. */
export async function extractAudioSlice(params: {
  sourceBytes: Uint8Array;
  sourceFilename: string;
  startSec: number;
  durationSec: number;
}): Promise<{ bytes: Buffer; filename: string } | null> {
  if (!(await isFfmpegAvailable())) return null;

  const dir = join(tmpdir(), "talkotype-gap", randomUUID());
  mkdirSync(dir, { recursive: true });
  const safe = params.sourceFilename.replace(/[^a-zA-Z0-9._-]+/g, "_") || "audio.bin";
  const input = join(dir, safe);
  const output = join(dir, "slice.flac");

  try {
    writeFileSync(input, Buffer.from(params.sourceBytes));
    await execFileAsync(
      "ffmpeg",
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
