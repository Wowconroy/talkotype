import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

function preferredDisplayName(user: User) {
  const meta = user.user_metadata ?? {};
  const fromMeta = [meta.full_name, meta.name, meta.given_name]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean);
  if (fromMeta) return fromMeta;
  const email = user.email ?? "";
  return email.split("@")[0] || "Friend";
}

export async function ensureProfile(user: User) {
  const admin = createAdminClient();

  const { data: existing, error: readError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (existing) return existing;

  const provider =
    user.app_metadata?.provider === "google" ? "google" : "email";
  const email = user.email ?? "";

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        display_name: preferredDisplayName(user),
        provider,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (profileError) throw new Error(profileError.message);

  await admin
    .from("notification_settings")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  return profile;
}
