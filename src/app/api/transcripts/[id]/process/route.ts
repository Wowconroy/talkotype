import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractAudioFile,
  GROQ_MAX_UPLOAD_BYTES,
  isFfmpegAvailable,
  looksLikeVideo,
} from "@/lib/ffmpeg-local";
import {
  clipTranscriptToSeconds,
  FREE_TRANSCRIBE_SECONDS,
  normalizePlan,
} from "@/lib/plan-limits";
import { getObjectBytes, isR2Configured } from "@/lib/r2";
import { qualityForMode } from "@/lib/transcription-modes";
import { isAssemblyAIConfigured } from "@/lib/assemblyai";
import {
  isTranscriptionConfigured,
  transcribeAudio,
} from "@/lib/transcription-provider";

type Params = { params: Promise<{ id: string }> };

export const maxDuration = 300;

/**
 * Processing entrypoint. Whisper via Groq is the default engine.
 * AssemblyAI remains an optional alternate when TRANSCRIPTION_PROVIDER=assemblyai.
 */
export async function POST(_request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: transcript } = await admin
    .from("transcripts")
    .select("*, media_assets(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!transcript?.active_job_id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const media = (
    transcript.media_assets as Array<{
      kind: string;
      object_key: string;
      content_type?: string | null;
      size_bytes?: number | null;
      deleted_at: string | null;
    }>
  )?.find((item) => item.kind === "original" && !item.deleted_at);

  if (!media) {
    return NextResponse.json(
      { error: "Original media missing" },
      { status: 400 },
    );
  }

  const { data: job } = await admin
    .from("transcription_jobs")
    .select("*")
    .eq("id", transcript.active_job_id)
    .maybeSingle();

  const speakersRequested = Boolean(job?.speakers_requested);
  const speakersExpected =
    typeof job?.speakers_expected === "number" ? job.speakers_expected : null;
  const provider =
    job?.provider || process.env.TRANSCRIPTION_PROVIDER || "whisper";
  // Whisper stays default; AssemblyAI only when speakers are on (or legacy override).
  const useAssembly =
    provider === "assemblyai" ||
    (speakersRequested && isAssemblyAIConfigured());

  if (!isR2Configured()) {
    await admin.rpc("publish_job_transcript", {
      p_job_id: transcript.active_job_id,
      p_transcript_text: "",
      p_detected_language: null,
      p_duration_seconds: null,
      p_error_code: "r2_not_configured",
      p_mark_failed: true,
    });
    return NextResponse.json(
      { ok: false, error: "R2 is not configured." },
      { status: 503 },
    );
  }

  if (speakersRequested && !isAssemblyAIConfigured()) {
    await admin.rpc("publish_job_transcript", {
      p_job_id: transcript.active_job_id,
      p_transcript_text: "",
      p_error_code: "assemblyai_not_configured",
      p_mark_failed: true,
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          "Speaker labels need ASSEMBLYAI_API_KEY. Add the key or turn off Recognize speakers.",
      },
      { status: 503 },
    );
  }

  if (!useAssembly && !isTranscriptionConfigured()) {
    await admin.rpc("publish_job_transcript", {
      p_job_id: transcript.active_job_id,
      p_transcript_text: "",
      p_error_code: "transcription_provider_not_configured",
      p_mark_failed: true,
    });
    return NextResponse.json(
      { ok: false, error: "GROQ_API_KEY is not configured." },
      { status: 503 },
    );
  }

  await admin
    .from("transcription_jobs")
    .update({
      status: "processing",
      stage: "preparing_audio",
      progress_pct: 10,
      attempt_count: (job?.attempt_count ?? 0) + 1,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
      error_code: null,
    })
    .eq("id", transcript.active_job_id);

  await admin
    .from("transcripts")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", id);

  try {
    const { bytes, contentType } = await getObjectBytes(media.object_key);

    const filename =
      transcript.source_filename ||
      media.object_key.split("/").pop() ||
      "audio.mp3";

    const { data: ownerProfileEarly } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    const planEarly = normalizePlan(ownerProfileEarly?.plan);
    const maxSeconds =
      planEarly === "free" ? FREE_TRANSCRIBE_SECONDS : null;

    const videoLike = looksLikeVideo({
      filename,
      contentType: media.content_type || contentType,
    });
    const tooBigForGroq =
      bytes.byteLength > GROQ_MAX_UPLOAD_BYTES ||
      (typeof media.size_bytes === "number" &&
        media.size_bytes > GROQ_MAX_UPLOAD_BYTES);
    // Even mid-size MP4s often fail raw Groq upload from Vercel — always extract.
    const shouldExtract =
      videoLike || tooBigForGroq || bytes.byteLength > 20 * 1024 * 1024;

    let audioBytes = bytes;
    let audioFilename = filename;
    let audioType = media.content_type || contentType;

    const jobId = transcript.active_job_id as string;
    let lastReportedPct = 10;

    const reportProgress = async (pct: number, stage?: string) => {
      const next = Math.max(lastReportedPct, Math.min(99, Math.round(pct)));
      // Only write when % advances (avoids hammering Supabase during ticks).
      if (next <= lastReportedPct) return;
      lastReportedPct = next;
      await admin
        .from("transcription_jobs")
        .update({
          progress_pct: next,
          ...(stage ? { stage } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    };

    // Videos / oversized uploads → compact mono MP3 before Groq.
    if (shouldExtract) {
      await reportProgress(18, "preparing_audio");

      if (!(await isFfmpegAvailable())) {
        throw new Error(
          "This video needs audio extraction. Export MP3/M4A under 100MB, or deploy the media worker.",
        );
      }

      // Soft climb during FFmpeg extract (can take minutes on long MP4s).
      let extractPct = 18;
      const extractTick = setInterval(() => {
        extractPct = Math.min(32, extractPct + 1);
        void reportProgress(extractPct, "preparing_audio");
      }, 2000);

      let extracted: Awaited<ReturnType<typeof extractAudioFile>> = null;
      try {
        extracted = await extractAudioFile({
          sourceBytes: bytes,
          sourceFilename: filename,
          maxSeconds,
        });
      } finally {
        clearInterval(extractTick);
      }
      if (!extracted) {
        throw new Error(
          "Could not extract audio from this video. Try exporting MP3/M4A and upload again.",
        );
      }
      audioBytes = extracted.bytes;
      audioFilename = extracted.filename;
      audioType = extracted.contentType;
      await reportProgress(34, "preparing_audio");
    }

    if (audioBytes.byteLength > GROQ_MAX_UPLOAD_BYTES) {
      throw new Error(
        "Audio is still over the 100MB provider limit after extraction. Split the file or deploy the media worker for chunking.",
      );
    }

    await reportProgress(
      35,
      speakersRequested ? "diarizing" : "transcribing",
    );

    const quality = qualityForMode(
      (job?.requested_mode as string | null | undefined) ?? null,
    );

    const normalised = await transcribeAudio({
      bytes: audioBytes,
      filename: audioFilename,
      contentType: audioType,
      model: job?.model,
      language: transcript.requested_language,
      quality,
      speakers: speakersRequested,
      speakersExpected,
      assemblyai: provider === "assemblyai",
      onProgress: (pct, detail) =>
        reportProgress(
          pct,
          detail === "diarizing"
            ? "diarizing"
            : speakersRequested
              ? "diarizing"
              : "transcribing",
        ),
    });

    const rawResult = {
      text: normalised.text,
      language: normalised.detectedLanguage,
      duration: normalised.usage.durationSeconds,
      segments: normalised.segments,
    };

    const result =
      planEarly === "free"
        ? clipTranscriptToSeconds(rawResult, FREE_TRANSCRIBE_SECONDS)
        : { ...rawResult, clipped: false };

    await admin
      .from("transcription_jobs")
      .update({
        progress_pct: 85,
        stage: "publishing",
        provider: normalised.provider,
        model: normalised.model,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcript.active_job_id);

    // Replace speakers + segments for this transcript revision.
    await admin.from("transcript_segments").delete().eq("transcript_id", id);
    await admin.from("transcript_speakers").delete().eq("transcript_id", id);

    const speakerIdByLabel = new Map<string, string>();
    if (normalised.speakers && normalised.speakers.length > 0) {
      const rows = normalised.speakers.map((sp, index) => ({
        transcript_id: id,
        user_id: user.id,
        speaker_index: index,
        label: sp.label,
      }));
      const { data: insertedSpeakers, error: speakerErr } = await admin
        .from("transcript_speakers")
        .insert(rows)
        .select("id, label");
      if (speakerErr) throw new Error(speakerErr.message);
      for (const row of insertedSpeakers ?? []) {
        speakerIdByLabel.set(row.label as string, row.id as string);
      }
    }

    if (result.segments && result.segments.length > 0) {
      await admin.from("transcript_segments").insert(
        result.segments.map((seg, index) => ({
          transcript_id: id,
          user_id: user.id,
          job_id: transcript.active_job_id,
          segment_index: index,
          start_ms: Math.max(0, Math.round(seg.start * 1000)),
          end_ms: Math.max(0, Math.round(seg.end * 1000)),
          text: seg.text,
          speaker_id: seg.speaker
            ? (speakerIdByLabel.get(seg.speaker) ?? null)
            : null,
        })),
      );
    }

    const { data: published, error: publishError } = await admin.rpc(
      "publish_job_transcript",
      {
        p_job_id: transcript.active_job_id,
        p_transcript_text: result.text,
        p_detected_language: result.language,
        p_duration_seconds: result.duration,
        p_error_code: null,
        p_mark_failed: false,
      },
    );

    if (publishError) {
      throw new Error(publishError.message);
    }

    await admin
      .from("transcription_jobs")
      .update({
        progress_pct: 100,
        stage: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcript.active_job_id);

    return NextResponse.json({
      ok: true,
      status: "ready",
      provider: normalised.provider,
      model: normalised.model,
      requestedMode: job?.requested_mode ?? null,
      transcript: published,
      chars: result.text.length,
      segments: result.segments?.length ?? 0,
      clippedToFreeLimit: result.clipped,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message.slice(0, 200) : "process_error";
    await admin.rpc("publish_job_transcript", {
      p_job_id: transcript.active_job_id,
      p_transcript_text: "",
      p_error_code: message,
      p_mark_failed: true,
    });
    await admin
      .from("transcription_jobs")
      .update({
        error_message: message,
        stage: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcript.active_job_id);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
