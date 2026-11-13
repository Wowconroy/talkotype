import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  isAssemblyAIConfigured,
  transcribeWithSpeakers,
} from "./assemblyai.js";
import { admin, downloadObject, uploadObject } from "./clients.js";
import { config } from "./config.js";
import {
  extractAudio,
  probeMedia,
  splitAudioChunks,
  workDir,
  writeOriginalTemp,
} from "./ffmpeg.js";
import { transcribeFile } from "./groq.js";
import { mergeChunkTexts, mergeSegments } from "./merge.js";

type JobRow = {
  id: string;
  transcript_id: string;
  user_id: string;
  status: string;
  model: string | null;
  attempt_count: number | null;
  source_content_revision: number | null;
};

export async function processTranscript(transcriptId: string) {
  const sb = admin();

  const { data: transcript, error: tErr } = await sb
    .from("transcripts")
    .select(
      "id, user_id, active_job_id, source_filename, requested_language, deleted_at",
    )
    .eq("id", transcriptId)
    .maybeSingle();

  if (tErr) throw new Error(tErr.message);
  if (!transcript || transcript.deleted_at) {
    throw new Error("transcript_not_found_or_deleted");
  }
  if (!transcript.active_job_id) throw new Error("no_active_job");

  const { data: job, error: jErr } = await sb
    .from("transcription_jobs")
    .select("*")
    .eq("id", transcript.active_job_id)
    .maybeSingle();
  if (jErr || !job) throw new Error(jErr?.message ?? "job_not_found");

  if (job.status === "ready") {
    return { ok: true, skipped: true, reason: "already_ready" };
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("plan")
    .eq("id", transcript.user_id)
    .maybeSingle();
  const plan = profile?.plan === "unlimited" ? "unlimited" : "free";
  const maxSeconds =
    plan === "free" ? config.freeClipSeconds : config.maxFileSeconds;

  await updateJob(sb, job.id, {
    status: "processing",
    stage: "preparing_audio",
    progress_pct: 5,
    attempt_count: (job.attempt_count ?? 0) + 1,
    started_at: new Date().toISOString(),
    error_code: null,
    error_message: null,
  });
  await sb
    .from("transcripts")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", transcriptId);

  const { data: media } = await sb
    .from("media_assets")
    .select("*")
    .eq("transcript_id", transcriptId)
    .eq("kind", "original")
    .is("deleted_at", null)
    .maybeSingle();

  if (!media?.object_key) {
    return failJob(sb, job as JobRow, "original_media_missing");
  }

  const dir = workDir(job.id);
  try {
    const { bytes } = await downloadObject(media.object_key);
    const originalPath = writeOriginalTemp(
      dir,
      bytes,
      transcript.source_filename || "media.bin",
    );

    const probe = await probeMedia(originalPath);
    if (!probe.hasAudio) {
      return failJob(sb, job as JobRow, "missing_audio_track");
    }
    if (probe.durationSeconds <= 0) {
      return failJob(sb, job as JobRow, "invalid_duration");
    }
    if (plan === "unlimited" && probe.durationSeconds > config.maxFileSeconds) {
      return failJob(sb, job as JobRow, "duration_over_limit");
    }

    const effectiveDuration = Math.min(probe.durationSeconds, maxSeconds);
    const audioPath = join(dir, "extracted.flac");

    await updateJob(sb, job.id, {
      stage: "preparing_audio",
      progress_pct: 15,
    });

    await extractAudio({
      inputPath: originalPath,
      outputPath: audioPath,
      maxSeconds: plan === "free" ? maxSeconds : null,
    });

    // Persist extracted audio for retry / retention separation.
    const extractedKey = media.object_key.replace(
      "/original/",
      "/extracted_audio/",
    ).replace(/[^/]+$/, `extracted-${Date.now()}.flac`);
    const audioBytes = readFileSync(audioPath);
    await uploadObject({
      objectKey: extractedKey,
      body: audioBytes,
      contentType: "audio/flac",
    });

    // Replace any prior extracted_audio row for this transcript.
    await sb
      .from("media_assets")
      .delete()
      .eq("transcript_id", transcriptId)
      .eq("kind", "extracted_audio");
    await sb.from("media_assets").insert({
      transcript_id: transcriptId,
      user_id: transcript.user_id,
      kind: "extracted_audio",
      object_key: extractedKey,
      content_type: "audio/flac",
      size_bytes: audioBytes.byteLength,
      // Follow the original's retention window (free = 7 days).
      expires_at: media.expires_at ?? null,
      status: "active",
    });

    // Speaker labels: AssemblyAI diarization on the full extracted audio.
    if (job.speakers_requested) {
      if (!isAssemblyAIConfigured()) {
        return failJob(sb, job as JobRow, "assemblyai_not_configured");
      }
      await updateJob(sb, job.id, {
        stage: "diarizing",
        progress_pct: 40,
        provider: "assemblyai",
        model: "universal-2",
      });
      const diarized = await transcribeWithSpeakers({
        bytes: audioBytes,
        language: transcript.requested_language,
        speakersExpected:
          typeof job.speakers_expected === "number"
            ? job.speakers_expected
            : null,
      });

      await updateJob(sb, job.id, {
        stage: "publishing",
        progress_pct: 90,
      });

      await sb.from("transcript_segments").delete().eq("transcript_id", transcriptId);
      await sb.from("transcript_speakers").delete().eq("transcript_id", transcriptId);

      const speakerIdByLabel = new Map<string, string>();
      if (diarized.speakers.length > 0) {
        const { data: insertedSpeakers, error: speakerErr } = await sb
          .from("transcript_speakers")
          .insert(
            diarized.speakers.map((sp, index) => ({
              transcript_id: transcriptId,
              user_id: transcript.user_id,
              speaker_index: index,
              label: sp.label,
            })),
          )
          .select("id, label");
        if (speakerErr) throw new Error(speakerErr.message);
        for (const row of insertedSpeakers ?? []) {
          speakerIdByLabel.set(row.label as string, row.id as string);
        }
      }

      if (diarized.segments.length > 0) {
        const { error: segErr } = await sb.from("transcript_segments").insert(
          diarized.segments.map((seg, index) => ({
            transcript_id: transcriptId,
            user_id: transcript.user_id,
            job_id: job.id,
            segment_index: index,
            start_ms: Math.max(0, Math.round(seg.start * 1000)),
            end_ms: Math.max(0, Math.round(seg.end * 1000)),
            text: seg.text,
            speaker_id: seg.speaker
              ? (speakerIdByLabel.get(seg.speaker) ?? null)
              : null,
          })),
        );
        if (segErr) throw new Error(segErr.message);
      }

      const { error: pubErr } = await sb.rpc("publish_job_transcript", {
        p_job_id: job.id,
        p_transcript_text: diarized.text,
        p_detected_language: diarized.language,
        p_duration_seconds: Math.round(
          diarized.duration ?? effectiveDuration,
        ),
        p_error_code: null,
        p_mark_failed: false,
      });
      if (pubErr) throw new Error(pubErr.message);

      await updateJob(sb, job.id, {
        stage: "ready",
        progress_pct: 100,
        status: "ready",
        finished_at: new Date().toISOString(),
      });

      return {
        ok: true,
        transcriptId,
        jobId: job.id,
        provider: "assemblyai",
        speakers: diarized.speakers.length,
        segments: diarized.segments.length,
      };
    }

    await updateJob(sb, job.id, {
      stage: "chunking",
      progress_pct: 25,
    });

    const chunkDir = join(dir, "chunks");
    mkdirSync(chunkDir, { recursive: true });

    const plans = await splitAudioChunks({
      audioPath,
      outDir: chunkDir,
      durationSeconds: effectiveDuration,
      chunkSeconds: config.chunkSeconds,
      overlapSeconds: config.overlapSeconds,
    });

    // Replace prior chunk rows for this job (retry-safe).
    await sb.from("transcription_chunks").delete().eq("job_id", job.id);
    if (plans.length > 0) {
      await sb.from("transcription_chunks").insert(
        plans.map((p) => ({
          job_id: job.id,
          transcript_id: transcriptId,
          user_id: transcript.user_id,
          chunk_index: p.index,
          start_ms: Math.round(p.startSec * 1000),
          end_ms: Math.round(p.endSec * 1000),
          status: "queued",
          attempt_count: 0,
        })),
      );
    }

    await updateJob(sb, job.id, {
      stage: "transcribing",
      progress_pct: 30,
      model: job.model || config.model,
    });

    const chunkResults: Array<{
      startSec: number;
      text: string;
      segments: Array<{ start: number; end: number; text: string }>;
      language: string | null;
    }> = [];

    let detectedLanguage: string | null = null;

    for (const plan of plans) {
      await sb
        .from("transcription_chunks")
        .update({
          status: "processing",
          attempt_count: 1,
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", job.id)
        .eq("chunk_index", plan.index);

      try {
        const result = await transcribeFile({
          path: plan.path,
          filename: `chunk-${plan.index}.flac`,
          language: transcript.requested_language,
          model: job.model || config.model,
        });
        detectedLanguage = detectedLanguage || result.language;
        chunkResults.push({
          startSec: plan.startSec,
          text: result.text,
          segments: result.segments,
          language: result.language,
        });
        await sb
          .from("transcription_chunks")
          .update({
            status: "ready",
            output_text: result.text,
            error_code: null,
            updated_at: new Date().toISOString(),
          })
          .eq("job_id", job.id)
          .eq("chunk_index", plan.index);
      } catch (err) {
        const message =
          err instanceof Error ? err.message.slice(0, 180) : "chunk_failed";
        await sb
          .from("transcription_chunks")
          .update({
            status: "failed",
            error_code: message,
            updated_at: new Date().toISOString(),
          })
          .eq("job_id", job.id)
          .eq("chunk_index", plan.index);
        throw err;
      }

      const done = chunkResults.length;
      const pct = 30 + Math.round((done / Math.max(plans.length, 1)) * 55);
      await updateJob(sb, job.id, {
        stage: "transcribing",
        progress_pct: Math.min(85, pct),
      });
    }

    await updateJob(sb, job.id, {
      stage: "publishing",
      progress_pct: 90,
    });

    const text = mergeChunkTexts(chunkResults);
    const segments = mergeSegments(chunkResults);

    await sb.from("transcript_segments").delete().eq("transcript_id", transcriptId);
    await sb.from("transcript_speakers").delete().eq("transcript_id", transcriptId);
    if (segments.length > 0) {
      const { error: segErr } = await sb.from("transcript_segments").insert(
        segments.map((seg, index) => ({
          transcript_id: transcriptId,
          user_id: transcript.user_id,
          job_id: job.id,
          segment_index: index,
          start_ms: Math.max(0, Math.round(seg.start * 1000)),
          end_ms: Math.max(0, Math.round(seg.end * 1000)),
          text: seg.text,
        })),
      );
      if (segErr) throw new Error(segErr.message);
    }

    const { error: pubErr } = await sb.rpc("publish_job_transcript", {
      p_job_id: job.id,
      p_transcript_text: text,
      p_detected_language: detectedLanguage,
      p_duration_seconds: Math.round(effectiveDuration),
      p_error_code: null,
      p_mark_failed: false,
    });
    if (pubErr) throw new Error(pubErr.message);

    await updateJob(sb, job.id, {
      stage: "ready",
      progress_pct: 100,
      status: "ready",
      finished_at: new Date().toISOString(),
    });

    return {
      ok: true,
      chunks: plans.length,
      duration: effectiveDuration,
      chars: text.length,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message.slice(0, 200) : "process_error";
    await failJob(sb, job as JobRow, message);
    throw err;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
}

async function updateJob(
  sb: ReturnType<typeof admin>,
  jobId: string,
  patch: Record<string, unknown>,
) {
  await sb
    .from("transcription_jobs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

async function failJob(
  sb: ReturnType<typeof admin>,
  job: JobRow,
  errorCode: string,
) {
  await sb.rpc("publish_job_transcript", {
    p_job_id: job.id,
    p_transcript_text: "",
    p_error_code: errorCode,
    p_mark_failed: true,
  });
  await updateJob(sb, job.id, {
    stage: "failed",
    error_code: errorCode,
    error_message: errorCode,
  });
  return { ok: false, error: errorCode };
}

export async function claimQueuedJobs(limit = 2) {
  const sb = admin();
  const { data } = await sb
    .from("transcription_jobs")
    .select("id, transcript_id, status, stage, updated_at")
    .eq("status", "queued")
    .eq("stage", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  return (data ?? []).map((row) => row.transcript_id as string);
}
