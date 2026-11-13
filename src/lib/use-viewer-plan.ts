"use client";

import { useEffect, useState } from "react";
import {
  getSessionUser,
  subscribeToAuth,
  type TalkotypeUser,
} from "@/lib/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type ViewerPlan = "free" | "unlimited" | null;

export function useViewerPlan() {
  const [user, setUser] = useState<TalkotypeUser | null>(null);
  const [plan, setPlan] = useState<ViewerPlan>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = async () => {
      const session = await getSessionUser();
      setUser(session);
      if (!session || !isSupabaseConfigured()) {
        setPlan(null);
        setReady(true);
        return;
      }
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", session.id)
          .maybeSingle();
        setPlan(data?.plan === "unlimited" ? "unlimited" : "free");
      } catch {
        setPlan("free");
      } finally {
        setReady(true);
      }
    };
    const onAuth = () => {
      void sync();
    };
    void sync();
    window.addEventListener("talkotype-auth", onAuth);
    const unsubscribe = subscribeToAuth(onAuth);
    return () => {
      window.removeEventListener("talkotype-auth", onAuth);
      unsubscribe();
    };
  }, []);

  return {
    user,
    plan,
    ready,
    isLoggedIn: Boolean(user),
    isPaid: plan === "unlimited",
  };
}
