import { createClient } from "@/lib/supabase/server";

/**
 * Cookie session only — no Auth API round-trip.
 * Proxy already verified claims on protected /app, /account, and desk APIs.
 */
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user ?? null;
  return { supabase, user };
}
