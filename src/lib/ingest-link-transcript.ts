/**
 * End-to-end: source_url → R2 original → queue transcription.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifyLinkHost,
  fetchLinkMedia,
  LinkIngestError,
} from "@/lib/link-ingest";
import { mediaExpiresAt, normalizePlan } from "@/lib/plan-limits";
import { buildObjectKey, isR2Configured, putObjectBytes } from "@/lib/r2";
import {
  dispatchTranscriptionJob,
  isTranscriptionWorkerConfigured,
} from "@/lib/transcription-worker";

type Admin = ReturnType<typeof createAdminClient>;

async function markJobFailed(
  admin: Admin,
  jobId: string,
  transcriptId: string,
  code: string,
  message: string,
) {
  await admin
    .from("transcription_jobs")
    .update({
      status: "failed",
      stage: "failed",
      progress_pct: 100,
      error_code: code,
      error_message: message,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
  await admin
    .from("transcripts")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", transcriptId);
}

export async function ingestLinkTranscript(params: {
  transcriptId: string;
  userId: string;
  /** When set, used to kick the Vercel /process path with the user's session. */
  processKick?: (transcriptId: string) => Promise<void>;
}): Promise<{ ok: true } | { ok: false; error: string; code: string }> {
  if (!isR2Configured()) {
    return {
      ok: false,
      code: "r2_not_configured",
      error: "Cloudflare R2 is not configured.",
    };
  }

  const admin = createAdminClient();
  const { data: transcript } = await admin
    .from("transcripts")
    .select(
      "id, user_id, source_url, source_kind, active_job_id, title, content_revision",
    )
    .eq("id", params.transcriptId)
    .eq("user_id", params.userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!transcript?.source_url || transcript.source_kind !== "link") {
    return {
      ok: false,
      code: "not_link",
      error: "This transcript is not a link import.",
    };
  }
  if (!transcript.active_job_id) {
    return { ok: false, code: "no_job", error: "No active job for transcript." };
  }

  const jobId = transcript.active_job_id as string;
  const sourceUrl = transcript.source_url as string;

  // Already have media → just kick processing.
  const { data: existingMedia } = await admin
    .from("media_assets")
    .select("id")
    .eq("transcript_id", params.transcriptId)
    .eq("kind", "original")
    .is("deleted_at", null)
    .maybeSingle();

  if (existingMedia) {
    await kickProcess(params);
    return { ok: true };
  }

  const hostKind = classifyLinkHost(sourceUrl);
  if (hostKind === "youtube") {
    const message =
      "YouTube links are not downloadable here yet. Download the file and upload it, or paste a direct MP3/MP4 URL.";
    await markJobFailed(
      admin,
      jobId,
      params.transcriptId,
      "youtube_unsupported",
      message,
    );
    return { ok: false, code: "youtube_unsupported", error: message };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", params.userId)
    .maybeSingle();
  const plan = normalizePlan(profile?.plan);

  try {
    await admin
      .from("transcription_jobs")
      .update({
        status: "processing",
        stage: "downloading",
        progress_pct: 8,
        updated_at: new Date().toISOString(),
        error_message: null,
        error_code: null,
      })
      .eq("id", jobId);
    await admin
      .from("transcripts")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.transcriptId);

    const media = await fetchLinkMedia({ sourceUrl, plan });

    await admin
      .from("transcription_jobs")
      .update({
        stage: "uploading",
        progress_pct: 22,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    const objectKey = buildObjectKey({
      userId: params.userId,
      transcriptId: params.transcriptId,
      kind: "original",
      filename: media.filename,
    });

    await putObjectBytes({
      objectKey,
      bytes: media.bytes,
      contentType: media.contentType,
    });

    const { error: mediaError } = await admin.from("media_assets").insert({
      transcript_id: params.transcriptId,
      user_id: params.userId,
      kind: "original",
      object_key: objectKey,
      content_type: media.contentType,
      size_bytes: media.bytes.byteLength,
      expires_at: mediaExpiresAt(plan),
      status: "active",
    });

    if (mediaError) {
      throw new LinkIngestError(
        "media_row_failed",
        mediaError.message || "Could not save media asset.",
      );
    }

    const titleFromFile = media.filename.replace(/\.[^.]+$/, "") || null;
    await admin
      .from("transcripts")
      .update({
        source_filename: media.filename,
        source_mime: media.contentType,
        storage_path: objectKey,
        title:
          transcript.title && !/^Link ·/i.test(String(transcript.title))
            ? transcript.title
            : titleFromFile || transcript.title,
        status: "queued",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.transcriptId);

    await admin
      .from("transcription_jobs")
      .update({
        status: "queued",
        stage: "starting",
        progress_pct: 28,
        updated_at: new Date().toISOString(),
        error_message: null,
        error_code: null,
      })
      .eq("id", jobId);

    await kickProcess(params);
    return { ok: true };
  } catch (err) {
    const code = err instanceof LinkIngestError ? err.code : "ingest_failed";
    const message =
      err instanceof Error ? err.message : "Could not import that link.";
    await markJobFailed(admin, jobId, params.transcriptId, code, message);
    return { ok: false, code, error: message };
  }
}

async function kickProcess(params: {
  transcriptId: string;
  processKick?: (transcriptId: string) => Promise<void>;
}) {
  if (isTranscriptionWorkerConfigured()) {
    const result = await dispatchTranscriptionJob(params.transcriptId);
    if (!result.ok && params.processKick) {
      await params.processKick(params.transcriptId);
    }
    return;
  }
  if (params.processKick) {
    await params.processKick(params.transcriptId);
  }
}
