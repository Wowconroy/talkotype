"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

/** Sends already-signed-in users away from login/signup. */
export function AuthGate({
  mode,
  next,
}: {
  mode: "login" | "signup";
  next?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const user = await getSessionUser();
      if (cancelled || !user) return;

      const fromQuery =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      const target =
        next ||
        (fromQuery && fromQuery.startsWith("/") ? fromQuery : null) ||
        "/app";
      router.replace(target);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, next, router]);

  return null;
}
