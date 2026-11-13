"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { getSessionUser, subscribeToAuth } from "@/lib/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const footerLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/reviews", label: "Reviews" },
  { href: "/account", label: "Account" },
  { href: "/blog", label: "Blog" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const sync = async () => {
      const session = await getSessionUser();
      if (!session || !isSupabaseConfigured()) {
        setIsPaid(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", session.id)
          .maybeSingle();
        setIsPaid(data?.plan === "unlimited");
      } catch {
        setIsPaid(false);
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

  const links = isPaid
    ? footerLinks.filter((link) => link.href !== "/pricing")
    : footerLinks;

  return (
    <footer className="mt-auto border-t border-border/80 bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Talkotype turns audio and video into editable transcripts. See our{" "}
            <Link href="/terms" className="font-medium text-ink hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-ink hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink/70 transition hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/70">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © 2026 Talkotype. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
