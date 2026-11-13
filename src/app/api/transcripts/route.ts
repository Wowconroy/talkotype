import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildObjectKey,
  createUploadUrl,
  isR2Configured,
} from "@/lib/r2";
import { reconcileFreeQuotaForUser } from "@/lib/desk-data";
import {
  FREE_DAILY_TRANSCRIPTS,
  formatBytes,
  maxConcurrentJobs,
  maxUploadBytes,
  mediaExpiresAt,
  normalizePlan,
} from "@/lib/plan-limits";
import { randomUUID } from "crypto";

const ALLOWED_MODELS = new Set([
  "whisper-large-v3-turbo",
  "whisper-large-v3",
]);

function resolveModel(input?: string | null) {
  const fallback =
    process.env.TRANSCRIPTION_MODEL ?? "whisper-large-v3-turbo";
  if (!input) return fallback;
  return ALLOWED_MODELS.has(input) ? input : fallback;
}

function quotaPayload(
  quota: {
    reserved?: boolean;
    already_reserved?: boolean;
    transcripts_used?: number;
    quota_date?: string;
  } | null,
  plan: string | null | undefined,
) {
  const used =
    typeof quota?.transcripts_used === "number" ? quota.transcripts_used : 0;
  return {
    reserved: Boolean(quota?.reserved),
    alreadyReserved: Boolean(quota?.already_reserved),
    transcripts_used: used,
    usage_date: quota?.quota_date ?? null,
    limit: plan === "unlimited" ? null : FREE_DAILY_TRANSCRIPTS,
  };
}

async function releaseQuota(
  admin: ReturnType<typeof createAdminClient>,
  requestKey: string,
) {
  try {
    await admin.rpc("release_transcript_quota", {
      p_request_key: requestKey,
    });
  } catch {
    // Best-effort: create already failed; avoid masking the root error.
  }
}

export async function GET() {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("transcripts")
    .select(
      "id, title, status, duration_seconds, requested_language, source_filename, folder_id, source_url, source_kind, created_at, updated_at, content_revision, active_job_id, share_enabled, media_assets(size_bytes, kind, expires_at)",
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = data ?? [];
  const jobIds = rows
    .map((row) => row.active_job_id)
    .filter((id): id is string => Boolean(id));

  let modelByJob = new Map<string, string | null>();
  if (jobIds.length > 0) {
    const { data: jobs } = await admin
      .from("transcription_jobs")
      .select("id, model")
      .in("id", jobIds);
    modelByJob = new Map(
      (jobs ?? []).map((job) => [
        job.id as string,
        (job.model as string | null) ?? null,
      ]),
    );
  }

  const transcripts = rows.map((row) => {
    const media = Array.isArray(row.media_assets) ? row.media_assets : [];
    const original =
      media.find((m: { kind?: string }) => m.kind === "original") ??
      media[0] ??
      null;
    const { media_assets: _omit, ...rest } = row;
    return {
      ...rest,
      model: row.active_job_id
        ? (modelByJob.get(row.active_job_id) ?? null)
        : null,
      media_size_bytes: original?.size_bytes ?? null,
      media_expires_at: original?.expires_at ?? null,
    };
  });

  return NextResponse.json({ transcripts });
}

export async function POST(request: Request) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    filename?: string;
    contentType?: string;
    sizeBytes?: number;
    requestedLanguage?: string;
    title?: string;
    requestKey?: string;
    speakers?: boolean;
    folderId?: string | null;
    transcriptionModel?: string;
    sourceUrl?: string;
    filterFillers?: boolean;
    preferTimestamps?: boolean;
  };

  const sourceUrl = body.sourceUrl?.trim() || null;
  const isLinkImport = Boolean(sourceUrl);

  if (!isLinkImport && !isR2Configured()) {
    return NextResponse.json(
      {
        error:
          "Cloudflare R2 is not configured. Add R2_* env vars to enable uploads.",
      },
      { status: 503 },
    );
  }

  if (isLinkImport) {
    try {
      const parsed = new URL(sourceUrl!);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json(
          { error: "sourceUrl must be http(s)" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid sourceUrl" },
        { status: 400 },
      );
    }
  }

  const filename = body.filename?.trim();
  const contentType = body.contentType?.trim();
  if (!isLinkImport && (!filename || !contentType)) {
    return NextResponse.json(
      { error: "filename and contentType are required" },
      { status: 400 },
    );
  }

  const requestKey = body.requestKey?.trim() || randomUUID();
  const wantSpeakers = Boolean(body.speakers);
  const model = resolveModel(body.transcriptionModel);
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const plan = normalizePlan(profile?.plan);
  const isUnlimited = plan === "unlimited";
  const speakersRequested = wantSpeakers && isUnlimited;
  const uploadCap = maxUploadBytes(plan);

  if (
    !isLinkImport &&
    typeof body.sizeBytes === "number" &&
    body.sizeBytes > uploadCap
  ) {
    return NextResponse.json(
      {
        error: `File is too large for your plan (max ${formatBytes(uploadCap)}).`,
        maxBytes: uploadCap,
      },
      { status: 413 },
    );
  }

  if (wantSpeakers && !isUnlimited) {
    return NextResponse.json(
      { error: "Speaker labels require Unlimited plan." },
      { status: 402 },
    );
  }

  let folderId: string | null = body.folderId ?? null;
  if (folderId) {
    const { data: folder } = await admin
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 400 });
    }
  }

  const { data: activeCount, error: activeError } = await admin.rpc(
    "count_active_jobs",
    { p_user_id: user.id },
  );
  if (activeError) {
    return NextResponse.json({ error: activeError.message }, { status: 400 });
  }
  const maxConcurrent = maxConcurrentJobs(plan);
  if (typeof activeCount === "number" && activeCount >= maxConcurrent) {
    return NextResponse.json(
      {
        error: isUnlimited
          ? `Too many files processing (max ${maxConcurrent} at once). Wait for some to finish.`
          : "Free plan processes one file at a time. Wait for it to finish, or go Unlimited.",
        activeJobs: activeCount,
        maxConcurrent,
      },
      { status: 429 },
    );
  }

  // Drop ghost free-plan slots before reserve so UI/DB stay aligned with live files.
  if (!isUnlimited) {
    await reconcileFreeQuotaForUser(user.id);
  }

  const { data: quotaRows, error: quotaError } = await admin.rpc(
    "reserve_transcript_quota",
    {
      p_user_id: user.id,
      p_request_key: requestKey,
      p_daily_limit: FREE_DAILY_TRANSCRIPTS,
    },
  );

  if (quotaError) {
    return NextResponse.json({ error: quotaError.message }, { status: 400 });
  }

  const quota = Array.isArray(quotaRows) ? quotaRows[0] : quotaRows;
  if (!quota?.reserved && !quota?.already_reserved) {
    return NextResponse.json(
      {
        error: "Daily free transcript limit reached.",
        quota,
      },
      { status: 429 },
    );
  }

  if (quota?.already_reserved) {
    const { data: existingJob } = await admin
      .from("transcription_jobs")
      .select("*, transcripts(*)")
      .eq("request_key", requestKey)
      .maybeSingle();
    if (existingJob) {
      return NextResponse.json({
        reused: true,
        requestKey,
        job: existingJob,
        transcript: existingJob.transcripts,
        quota: quotaPayload(quota, profile?.plan),
      });
    }
  }

  const transcriptId = randomUUID();
  const title =
    body.title?.trim() ||
    (isLinkImport
      ? "Imported link"
      : filename!.replace(/\.[^.]+$/, "") || "Untitled transcript");

  const { data: transcript, error: transcriptError } = await admin
    .from("transcripts")
    .insert({
      id: transcriptId,
      user_id: user.id,
      title,
      source_filename: isLinkImport ? null : filename,
      source_mime: isLinkImport ? null : contentType,
      status: "queued",
      requested_language: body.requestedLanguage ?? null,
      folder_id: folderId,
      source_url: sourceUrl,
      source_kind: isLinkImport ? "link" : "upload",
    })
    .select("*")
    .single();

  if (transcriptError || !transcript) {
    await releaseQuota(admin, requestKey);
    return NextResponse.json(
      { error: transcriptError?.message ?? "Could not create transcript" },
      { status: 400 },
    );
  }

  // Link import: store URL as pending — no R2 / media / processing yet.
  if (isLinkImport) {
    const { data: job, error: jobError } = await admin
      .from("transcription_jobs")
      .insert({
        transcript_id: transcriptId,
        user_id: user.id,
        provider: process.env.TRANSCRIPTION_PROVIDER ?? "whisper",
        model,
        status: "queued",
        stage: "awaiting_source",
        progress_pct: 0,
        speakers_requested: speakersRequested,
        attempt_count: 0,
        request_key: requestKey,
        source_content_revision: transcript.content_revision ?? 0,
        error_message: "Link import queued — media ingest coming soon.",
      })
      .select("*")
      .single();

    if (jobError || !job) {
      await admin.from("transcripts").delete().eq("id", transcriptId);
      await releaseQuota(admin, requestKey);
      return NextResponse.json(
        { error: jobError?.message ?? "Could not create job" },
        { status: 400 },
      );
    }

    await admin
      .from("transcripts")
      .update({ active_job_id: job.id })
      .eq("id", transcriptId);

    return NextResponse.json({
      reused: false,
      requestKey,
      linkPending: true,
      transcript: { ...transcript, active_job_id: job.id },
      job,
      quota: quotaPayload(quota, profile?.plan),
    });
  }

  const objectKey = buildObjectKey({
    userId: user.id,
    transcriptId,
    kind: "original",
    filename: filename!,
  });

  const { data: media, error: mediaError } = await admin
    .from("media_assets")
    .insert({
      transcript_id: transcriptId,
      user_id: user.id,
      kind: "original",
      object_key: objectKey,
      content_type: contentType!,
      size_bytes: body.sizeBytes ?? null,
      expires_at: mediaExpiresAt(plan),
      status: "active",
    })
    .select("*")
    .single();

  if (mediaError || !media) {
    await admin.from("transcripts").delete().eq("id", transcriptId);
    await releaseQuota(admin, requestKey);
    return NextResponse.json(
      { error: mediaError?.message ?? "Could not create media asset" },
      { status: 400 },
    );
  }

  const { data: job, error: jobError } = await admin
    .from("transcription_jobs")
    .insert({
      transcript_id: transcriptId,
      user_id: user.id,
      provider: process.env.TRANSCRIPTION_PROVIDER ?? "whisper",
      model,
      status: "queued",
      stage: "queued",
      progress_pct: 0,
      speakers_requested: speakersRequested,
      attempt_count: 0,
      request_key: requestKey,
      source_content_revision: transcript.content_revision ?? 0,
    })
    .select("*")
    .single();

  if (jobError || !job) {
    await admin.from("media_assets").delete().eq("id", media.id);
    await admin.from("transcripts").delete().eq("id", transcriptId);
    await releaseQuota(admin, requestKey);
    return NextResponse.json(
      { error: jobError?.message ?? "Could not create job" },
      { status: 400 },
    );
  }

  await admin
    .from("transcripts")
    .update({ active_job_id: job.id, storage_path: objectKey })
    .eq("id", transcriptId);

  let uploadUrl: string;
  try {
    uploadUrl = await createUploadUrl({
      objectKey,
      contentType: contentType!,
    });
  } catch (err) {
    await admin.from("transcription_jobs").delete().eq("id", job.id);
    await admin.from("media_assets").delete().eq("id", media.id);
    await admin.from("transcripts").delete().eq("id", transcriptId);
    await releaseQuota(admin, requestKey);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not create upload URL",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    reused: false,
    requestKey,
    transcript: { ...transcript, active_job_id: job.id, storage_path: objectKey },
    job,
    media,
    upload: {
      url: uploadUrl,
      method: "PUT",
      headers: { "Content-Type": contentType },
      objectKey,
      expiresAt: media.expires_at,
    },
    quota: quotaPayload(quota, profile?.plan),
  });
}
