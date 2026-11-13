import type { User } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/ensure-profile";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const [profileResult, notificationsResult, invoicesResult, usageResult] =
    await Promise.all([
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
        : { transcripts_used: stored, usage_date: today, limit: 3 },
    invoices: (invoicesResult.data as Array<Record<string, unknown>>) ?? [],
  };
}
