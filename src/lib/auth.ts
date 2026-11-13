import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { clearCachedDisplayName } from "@/lib/display-name";

export type TalkotypeUser = {
  id: string;
  email: string;
  name: string;
  provider: "email" | "google";
  createdAt: string;
};

function mapUser(user: {
  id: string;
  email?: string | null;
  created_at?: string;
  app_metadata?: { provider?: string };
  user_metadata?: { full_name?: string; name?: string };
}): TalkotypeUser {
  const provider =
    user.app_metadata?.provider === "google" ? "google" : "email";
  const email = user.email ?? "";
  return {
    id: user.id,
    email,
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split("@")[0] ||
      "Friend",
    provider,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

function emitAuthEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("talkotype-auth"));
  }
}

export async function getSessionUser(): Promise<TalkotypeUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  // Prefer local session for snappy UI; fall back to Auth API verify.
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) {
    return mapUser(sessionData.session.user);
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return mapUser(data.user);
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured yet.");
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    throw new Error("Email and password are required.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const supabase = createClient();
  const origin = window.location.origin;
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
  if (data.user) {
    emitAuthEvent();
    return {
      user: mapUser(data.user),
      needsEmailConfirmation: !data.session,
    };
  }
  throw new Error("Could not create account.");
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured yet.");
  }
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Could not sign in.");
  emitAuthEvent();
  return mapUser(data.user);
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured yet.");
  }
  const supabase = createClient();
  const origin = window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/app`,
    },
  });
  if (error) throw new Error(error.message);
}

export async function requestPasswordReset(email: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured yet.");
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error("Enter the email for your account.");
  }
  const supabase = createClient();
  const origin = window.location.origin;
  const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured yet.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  emitAuthEvent();
}

export async function clearSession() {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  await supabase.auth.signOut();
  if (userId) clearCachedDisplayName(userId);
  emitAuthEvent();
}

export function subscribeToAuth(callback: () => void) {
  if (!isSupabaseConfigured()) return () => undefined;
  const supabase = createClient();
  const { data } = supabase.auth.onAuthStateChange(() => {
    callback();
  });
  return () => data.subscription.unsubscribe();
}
