import type { User } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/ensure-profile";
import { FREE_DAILY_TRANSCRIPTS } from "@/lib/plan-limits";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccountLibraryStats = {
  /** Non-deleted files currently in the desk. */
  inLibrary: number;
  /** Ready files in the desk. */
  readyInLibrary: number;
  /** Soft-deleted / expired media rows still in DB. */
  removedFromLibrary: number;
  /** Lifetime successful transcriptions (survives hard delete when migration applied). */
  allTimeFiles: number;
  /** Audio seconds still in the live library. */
  libraryAudioSeconds: number;
  /** Lifetime audio seconds transcribed (survives hard delete when migration applied). */
  allTimeAudioSeconds: number;
  /** Ready files created in the current UTC month. */
  thisMonthFiles: number;
  /** Average ready-file duration in the live library (seconds). */
  averageDurationSeconds: number;
  /** Longest ready file in the live library (seconds). */
  longestDurationSeconds: number;
};

export type AccountBootstrapPayload = {
  profile: Record<string, unknown>;
  notifications: {
    completed_transcripts: boolean;
    free_quota_resets: boolean;
    product_updates: boolean;
  };
  dailyUsage: {
    transcripts_used: number;
    usage_date: string;
    limit: number | null;
  };
  invoices: Array<Record<string, unknown>>;
  stats: AccountLibraryStats;
};

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fast account read — no orphan-quota RPC. Matches desk bootstrap style:
 * parallel selects only so Settings can SSR without a client waterfall.
 */
export async function loadAccountBootstrap(
  userId: string,
  user?: User | null,
): Promise<AccountBootstrapPayload> {
  const admin = createAdminClient();
  const today = utcToday();

  const monthStart = `${today.slice(0, 8)}01`;

  const [
    profileResult,
    notificationsResult,
    invoicesResult,
    usageResult,
    liveResult,
    removedResult,
    usageHistoryResult,
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin
      .from("notification_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("daily_usage")
      .select("transcripts_used, usage_date")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .maybeSingle(),
    admin
      .from("transcripts")
      .select("id, status, duration_seconds, created_at")
      .eq("user_id", userId)
      .is("deleted_at", null),
    admin
      .from("transcripts")
      .select("id, duration_seconds")
      .eq("user_id", userId)
      .not("deleted_at", "is", null),
    admin
      .from("daily_usage")
      .select("transcripts_used")
      .eq("user_id", userId),
  ]);

  let profile = profileResult.data;
  if (!profile && user) {
    profile = await ensureProfile(user);
  }
  if (!profile) {
    throw new Error("Profile not found");
  }

  const plan = (profile.plan as string) ?? "free";
  const stored = usageResult.data?.transcripts_used ?? 0;

  const live = (liveResult.data ?? []) as Array<{
    id: string;
    status: string | null;
    duration_seconds: number | null;
    created_at: string;
  }>;
  const removed = (removedResult.data ?? []) as Array<{
    id: string;
    duration_seconds: number | null;
  }>;
  const ready = live.filter((t) => t.status === "ready");
  const libraryAudioSeconds = ready.reduce(
    (sum, t) => sum + Math.max(0, t.duration_seconds ?? 0),
    0,
  );
  const removedAudioSeconds = removed.reduce(
    (sum, t) => sum + Math.max(0, t.duration_seconds ?? 0),
    0,
  );
  const thisMonthFiles = ready.filter(
    (t) => (t.created_at || "").slice(0, 10) >= monthStart,
  ).length;
  const durations = ready
    .map((t) => Math.max(0, t.duration_seconds ?? 0))
    .filter((n) => n > 0);
  const averageDurationSeconds =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
  const longestDurationSeconds =
    durations.length > 0 ? Math.max(...durations) : 0;

  const profileFiles =
    typeof profile.stats_files_total === "number"
      ? profile.stats_files_total
      : 0;
  const profileAudio =
    typeof profile.stats_audio_seconds_total === "number"
      ? profile.stats_audio_seconds_total
      : 0;
  const usageAttempts = (usageHistoryResult.data ?? []).reduce(
    (sum, row) => sum + Math.max(0, row.transcripts_used ?? 0),
    0,
  );
  const knownRows = live.length + removed.length;
  const allTimeFiles = Math.max(profileFiles, knownRows, usageAttempts);
  const allTimeAudioSeconds = Math.max(
    profileAudio,
    libraryAudioSeconds + removedAudioSeconds,
  );

  return {
    profile,
    notifications: notificationsResult.data ?? {
      completed_transcripts: true,
      free_quota_resets: true,
      product_updates: true,
    },
    dailyUsage:
      plan === "unlimited"
        ? { transcripts_used: 0, usage_date: today, limit: null }
        : {
            transcripts_used: stored,
            usage_date: today,
            limit: FREE_DAILY_TRANSCRIPTS,
          },
    invoices: (invoicesResult.data as Array<Record<string, unknown>>) ?? [],
    stats: {
      inLibrary: live.length,
      readyInLibrary: ready.length,
      removedFromLibrary: removed.length,
      allTimeFiles,
      libraryAudioSeconds,
      allTimeAudioSeconds,
      thisMonthFiles,
      averageDurationSeconds,
      longestDurationSeconds,
    },
  };
}
