import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  clipTranscriptToSeconds,
  FREE_TRANSCRIBE_SECONDS,
  normalizePlan,
} from "@/lib/plan-limits";
import { getObjectBytes, isR2Configured } from "@/lib/r2";
import { isGroqConfigured, transcribeWithGroq } from "@/lib/groq-whisper";

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

  const provider =
    job?.provider || process.env.TRANSCRIPTION_PROVIDER || "whisper";
  const useAssembly = provider === "assemblyai";

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

  if (!useAssembly && !isGroqConfigured()) {
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
      stage: "transcribing",
      progress_pct: 15,
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
    if (useAssembly) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "AssemblyAI path needs async polling. Use Whisper (default) for now.",
        },
        { status: 501 },
      );
    }

    const { bytes, contentType } = await getObjectBytes(media.object_key);

    await admin
      .from("transcription_jobs")
      .update({
        progress_pct: 40,
        stage: "transcribing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcript.active_job_id);

    const filename =
      transcript.source_filename ||
      media.object_key.split("/").pop() ||
      "audio.mp3";

    const rawResult = await transcribeWithGroq({
      bytes,
      filename,
      contentType: media.content_type || contentType,
      model: job?.model,
      language: transcript.requested_language,
    });

    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    const plan = normalizePlan(ownerProfile?.plan);
    const result =
      plan === "free"
        ? clipTranscriptToSeconds(rawResult, FREE_TRANSCRIBE_SECONDS)
        : { ...rawResult, clipped: false };

    await admin
      .from("transcription_jobs")
      .update({
        progress_pct: 85,
        stage: "publishing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcript.active_job_id);

    // Replace segments when Groq returns timed chunks.
    await admin
      .from("transcript_segments")
      .delete()
      .eq("transcript_id", id);

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

    return NextResponse.json({
      ok: true,
      status: "ready",
      provider: "whisper",
      model: job?.model ?? "whisper-large-v3-turbo",
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
