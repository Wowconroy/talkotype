/**
 * Live smoke: upload → Groq → persist → TXT export for short UA + EN MP3s.
 * Uses service role + R2 + Groq from .env.local (no browser session).
 *
 *   npm run smoke:transcribe
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildObjectKey,
  getR2Client,
  isR2Configured,
} from "../src/lib/r2";
import { isGroqConfigured, transcribeWithGroq } from "../src/lib/groq-whisper";
import { buildTxt, filenameFor } from "../src/lib/export-formats";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const OUT = join(process.cwd(), ".tmp/smoke");

function requireEnv(name: string) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function admin() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function makeSpeechMp3(params: {
  path: string;
  text: string;
  voiceHint: "en" | "uk";
}) {
  mkdirSync(OUT, { recursive: true });
  const aiff = params.path.replace(/\.mp3$/i, ".aiff");

  let voice: string | null = null;
  try {
    const voices = execFileSync("say", ["-v", "?"], {
      encoding: "utf8",
    });
    if (params.voiceHint === "uk") {
      const uk =
        voices
          .split("\n")
          .find((l) => /\buk_UA\b|\bUkrainian\b/i.test(l))
          ?.trim()
          .split(/\s+/)[0] ?? null;
      voice = uk;
    } else {
      voice =
        voices
          .split("\n")
          .find((l) => /\ben_US\b|\ben_GB\b/i.test(l))
          ?.trim()
          .split(/\s+/)[0] ?? "Samantha";
    }
  } catch {
    voice = params.voiceHint === "en" ? "Samantha" : null;
  }

  if (!voice && params.voiceHint === "uk") {
    // Fallback: English voice reading transliterated Ukrainian (still tests pipeline).
    voice = "Samantha";
    console.warn(
      "No Ukrainian macOS voice found — using English voice for UA sample text.",
    );
  }

  execFileSync("say", ["-v", voice!, "-o", aiff, params.text], {
    stdio: "inherit",
  });

  try {
    execFileSync(
      "ffmpeg",
      ["-y", "-i", aiff, "-ar", "16000", "-ac", "1", "-codec:a", "libmp3lame", params.path],
      { stdio: "pipe" },
    );
  } catch {
    // macOS can often convert without ffmpeg via afconvert
    execFileSync(
      "afconvert",
      ["-f", "mp4f", "-d", "aac", aiff, params.path.replace(/\.mp3$/i, ".m4a")],
      { stdio: "pipe" },
    );
    const m4a = params.path.replace(/\.mp3$/i, ".m4a");
    // Rename path expectation — return m4a if mp3 failed
    writeFileSync(params.path, readFileSync(m4a));
  }
}

async function ensureSmokeUser(sb: ReturnType<typeof admin>) {
  const email = process.env.SMOKE_USER_EMAIL?.trim() || "smoke@talkotype.local";
  const { data: existing } = await sb
    .from("profiles")
    .select("id, plan, email")
    .eq("email", email)
    .maybeSingle();
  if (existing?.id) return existing as { id: string; plan: string; email: string };

  const { data: listed } = await sb.auth.admin.listUsers({ perPage: 50 });
  const found = listed?.users?.find((u) => u.email === email);
  if (found) {
    await sb.from("profiles").upsert({
      id: found.id,
      email,
      plan: "unlimited",
    });
    return { id: found.id, plan: "unlimited", email };
  }

  const { data: created, error } = await sb.auth.admin.createUser({
    email,
    email_confirm: true,
    password: randomUUID(),
  });
  if (error || !created.user) {
    // Fall back to any existing profile for smoke
    const { data: anyProfile } = await sb
      .from("profiles")
      .select("id, plan, email")
      .limit(1)
      .maybeSingle();
    if (!anyProfile) throw error ?? new Error("No profile available for smoke");
    console.warn(`Using existing profile ${anyProfile.email} for smoke`);
    return anyProfile as { id: string; plan: string; email: string };
  }

  await sb.from("profiles").upsert({
    id: created.user.id,
    email,
    plan: "unlimited",
  });
  return { id: created.user.id, plan: "unlimited", email };
}

async function runOne(params: {
  sb: ReturnType<typeof admin>;
  userId: string;
  filePath: string;
  title: string;
  language: string;
  filename: string;
}) {
  const bytes = new Uint8Array(readFileSync(params.filePath));
  const transcriptId = randomUUID();
  const requestKey = `smoke-${transcriptId}`;
  const objectKey = buildObjectKey({
    userId: params.userId,
    transcriptId,
    kind: "original",
    filename: params.filename,
  });

  const { data: transcript, error: tErr } = await params.sb
    .from("transcripts")
    .insert({
      id: transcriptId,
      user_id: params.userId,
      title: params.title,
      source_filename: params.filename,
      source_mime: "audio/mpeg",
      status: "processing",
      requested_language: params.language,
      source_kind: "upload",
    })
    .select("*")
    .single();
  if (tErr || !transcript) throw new Error(tErr?.message ?? "transcript insert");

  const { data: media, error: mErr } = await params.sb
    .from("media_assets")
    .insert({
      transcript_id: transcriptId,
      user_id: params.userId,
      kind: "original",
      object_key: objectKey,
      content_type: "audio/mpeg",
      size_bytes: bytes.byteLength,
      status: "active",
    })
    .select("*")
    .single();
  if (mErr || !media) throw new Error(mErr?.message ?? "media insert");

  const { data: job, error: jErr } = await params.sb
    .from("transcription_jobs")
    .insert({
      transcript_id: transcriptId,
      user_id: params.userId,
      provider: "whisper",
      model: "whisper-large-v3-turbo",
      requested_mode: "balanced",
      status: "processing",
      stage: "transcribing",
      progress_pct: 20,
      speakers_requested: false,
      attempt_count: 1,
      request_key: requestKey,
      source_content_revision: 0,
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (jErr || !job) throw new Error(jErr?.message ?? "job insert");

  await params.sb
    .from("transcripts")
    .update({ active_job_id: job.id, storage_path: objectKey })
    .eq("id", transcriptId);

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: objectKey,
      Body: Buffer.from(bytes),
      ContentType: "audio/mpeg",
    }),
  );

  const result = await transcribeWithGroq({
    bytes,
    filename: params.filename,
    contentType: "audio/mpeg",
    model: "whisper-large-v3-turbo",
    language: params.language,
  });

  if (result.segments?.length) {
    await params.sb.from("transcript_segments").insert(
      result.segments.map((seg, index) => ({
        transcript_id: transcriptId,
        user_id: params.userId,
        job_id: job.id,
        segment_index: index,
        start_ms: Math.max(0, Math.round(seg.start * 1000)),
        end_ms: Math.max(0, Math.round(seg.end * 1000)),
        text: seg.text,
      })),
    );
  }

  const { error: pubErr } = await params.sb.rpc("publish_job_transcript", {
    p_job_id: job.id,
    p_transcript_text: result.text,
    p_detected_language: result.language,
    p_duration_seconds: result.duration,
    p_error_code: null,
    p_mark_failed: false,
  });
  if (pubErr) throw new Error(pubErr.message);

  await params.sb
    .from("transcription_jobs")
    .update({
      stage: "ready",
      progress_pct: 100,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  const { data: saved } = await params.sb
    .from("transcripts")
    .select("id, title, status, transcript_text, detected_language, duration_seconds")
    .eq("id", transcriptId)
    .single();

  const txt = buildTxt({
    title: params.title,
    text: saved?.transcript_text || result.text,
    includeTimestamps: false,
  });
  const txtName = filenameFor(params.title, "txt");
  const txtPath = join(OUT, txtName);
  writeFileSync(txtPath, txt, "utf8");

  return {
    transcriptId,
    status: saved?.status,
    language: saved?.detected_language ?? result.language,
    duration: saved?.duration_seconds ?? result.duration,
    chars: (saved?.transcript_text || result.text).length,
    preview: (saved?.transcript_text || result.text).slice(0, 120),
    txtPath,
    objectKey,
  };
}

async function main() {
  console.log("=== Talkotype live smoke ===");
  if (!isR2Configured()) throw new Error("R2 env incomplete");
  if (!isGroqConfigured()) throw new Error("GROQ_API_KEY missing");

  const enPath = join(OUT, "smoke-en.mp3");
  const uaPath = join(OUT, "smoke-uk.mp3");

  makeSpeechMp3({
    path: enPath,
    voiceHint: "en",
    text: "Hello. This is a short English test for Talkotype transcription.",
  });
  makeSpeechMp3({
    path: uaPath,
    voiceHint: "uk",
    text: "Привіт. Це короткий український тест для транскрипції Talkotype.",
  });

  if (!existsSync(enPath) || !existsSync(uaPath)) {
    throw new Error("Failed to generate smoke MP3s");
  }

  const sb = admin();
  const user = await ensureSmokeUser(sb);
  console.log(`user=${user.email} plan=${user.plan}`);

  const en = await runOne({
    sb,
    userId: user.id,
    filePath: enPath,
    title: "Smoke English",
    language: "en",
    filename: "smoke-en.mp3",
  });
  console.log("EN", JSON.stringify(en, null, 2));

  const ua = await runOne({
    sb,
    userId: user.id,
    filePath: uaPath,
    title: "Smoke Ukrainian",
    language: "uk",
    filename: "smoke-uk.mp3",
  });
  console.log("UK", JSON.stringify(ua, null, 2));

  const pass =
    en.status === "ready" &&
    ua.status === "ready" &&
    en.chars > 0 &&
    ua.chars > 0 &&
    existsSync(en.txtPath) &&
    existsSync(ua.txtPath);

  console.log(pass ? "PASS: upload, transcribe, persist, TXT export" : "FAIL");
  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error("SMOKE FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
