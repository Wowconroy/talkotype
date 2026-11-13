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

async function loadTranscripts(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<DeskTranscript[]> {
  const { data, error } = await admin
    .from("transcripts")
    .select(
      "id, title, status, duration_seconds, requested_language, source_filename, folder_id, source_url, source_kind, created_at, updated_at, content_revision, active_job_id, share_enabled, media_assets(size_bytes, kind, expires_at)",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

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

  return rows.map((row) => {
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
    } as DeskTranscript;
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
      admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
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

  let profile = profileResult.data;
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
