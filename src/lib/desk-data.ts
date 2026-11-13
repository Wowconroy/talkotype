import type { User } from "@supabase/supabase-js";
import type {
  DeskFolder,
  DeskTranscript,
  DeskUsage,
} from "@/components/desk/types";
import { ensureProfile } from "@/lib/ensure-profile";
import { FREE_DAILY_TRANSCRIPTS } from "@/lib/plan-limits";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeskBootstrap = {
  displayName: string;
  plan: string;
  ownerEmail: string | null;
  usage: DeskUsage;
  folders: DeskFolder[];
  transcripts: DeskTranscript[];
};

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Free plan: daily_usage is the attempt counter (never lowered by deletes).
 * Only reclaim abandoned create reservations (no job after grace window).
 */
export async function reconcileFreeQuotaForUser(userId: string) {
  const admin = createAdminClient();
  const today = utcToday();

  try {
    await admin.rpc("release_orphaned_quota", { p_user_id: userId });
  } catch {
    // Best-effort; usage row below is still authoritative.
  }

  const { data: usage } = await admin
    .from("daily_usage")
    .select("transcripts_used")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  return {
    transcripts_used: usage?.transcripts_used ?? 0,
    usage_date: today,
    limit: FREE_DAILY_TRANSCRIPTS as number | null,
  };
}

type TranscriptRow = {
  id: string;
  title: string | null;
  status: string;
  duration_seconds: number | null;
  requested_language: string | null;
  source_filename: string | null;
  folder_id: string | null;
  source_url: string | null;
  source_kind: string | null;
  created_at: string;
  updated_at: string;
  content_revision: number | null;
  active_job_id: string | null;
  share_enabled: boolean | null;
  media_assets?: Array<{
    size_bytes?: number | null;
    kind?: string | null;
    expires_at?: string | null;
  }> | null;
  active_job?: { model?: string | null } | { model?: string | null }[] | null;
};

function mapTranscriptRow(row: TranscriptRow): DeskTranscript {
  const media = Array.isArray(row.media_assets) ? row.media_assets : [];
  const original =
    media.find((m) => m.kind === "original") ?? media[0] ?? null;
  const job = Array.isArray(row.active_job)
    ? row.active_job[0]
    : row.active_job;
  const {
    media_assets: _omitMedia,
    active_job: _omitJob,
    ...rest
  } = row;
  return {
    ...rest,
    model: job?.model ?? null,
    media_size_bytes: original?.size_bytes ?? null,
    media_expires_at: original?.expires_at ?? null,
  } as DeskTranscript;
}

async function loadTranscripts(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<DeskTranscript[]> {
  // One round-trip: embed media + active job model via FK.
  const { data, error } = await admin
    .from("transcripts")
    .select(
      "id, title, status, duration_seconds, requested_language, source_filename, folder_id, source_url, source_kind, created_at, updated_at, content_revision, active_job_id, share_enabled, media_assets(size_bytes, kind, expires_at), active_job:transcription_jobs!active_job_id(model)",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!error && data) {
    return (data as TranscriptRow[]).map(mapTranscriptRow);
  }

  // Fallback if the FK embed alias isn't available in this project yet.
  const { data: rows, error: fallbackError } = await admin
    .from("transcripts")
    .select(
      "id, title, status, duration_seconds, requested_language, source_filename, folder_id, source_url, source_kind, created_at, updated_at, content_revision, active_job_id, share_enabled, media_assets(size_bytes, kind, expires_at)",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (fallbackError) throw new Error(fallbackError.message || error?.message);

  const list = (rows ?? []) as TranscriptRow[];
  const jobIds = list
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

  return list.map((row) => {
    const mapped = mapTranscriptRow(row);
    if (!mapped.model && row.active_job_id) {
      mapped.model = modelByJob.get(row.active_job_id) ?? null;
    }
    return mapped;
  });
}

export async function loadDeskBootstrap(
  userId: string,
  user?: User | null,
): Promise<DeskBootstrap> {
  const admin = createAdminClient();
  const today = utcToday();

  const [profileResult, foldersResult, usageResult, transcripts] =
    await Promise.all([
      admin
        .from("profiles")
        .select("display_name, email, plan")
        .eq("id", userId)
        .maybeSingle(),
      admin
        .from("folders")
        .select("id, name, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      admin
        .from("daily_usage")
        .select("transcripts_used, usage_date")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle(),
      loadTranscripts(admin, userId),
    ]);

  if (foldersResult.error) {
    throw new Error(foldersResult.error.message);
  }

  let profile = profileResult.data as {
    display_name?: string | null;
    email?: string | null;
    plan?: string | null;
  } | null;
  if (!profile && user) {
    profile = await ensureProfile(user);
  }
  if (!profile) {
    throw new Error("Profile not found");
  }

  const plan = (profile.plan as string) ?? "free";
  const stored = usageResult.data?.transcripts_used ?? 0;

  const usage: DeskUsage =
    plan === "free"
      ? {
          transcripts_used: stored,
          usage_date: today,
          limit: FREE_DAILY_TRANSCRIPTS,
        }
      : {
          transcripts_used: stored,
          usage_date: today,
          limit: null,
        };

  return {
    displayName:
      (profile.display_name as string) ||
      (profile.email as string)?.split("@")[0] ||
      "Friend",
    plan,
    ownerEmail: (profile.email as string) ?? null,
    usage,
    folders: (foldersResult.data as DeskFolder[]) ?? [],
    transcripts,
  };
}
