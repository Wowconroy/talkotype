"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { clearSession, getSessionUser, type TalkotypeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/reviews", label: "Reviews" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  const [user, setUser] = useState<TalkotypeUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setUser(getSessionUser());
    sync();
    window.addEventListener("talkotype-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("talkotype-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-mist/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink/75 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/signup"
            className="rounded-full bg-lemon px-3.5 py-1.5 text-sm font-semibold text-ink shadow-[0_0_0_1px_rgba(18,61,58,0.06)] transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Try for free
          </Link>
          {user ? (
            <>
              <Link
                href="/app"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-white/70"
              >
                My desk
              </Link>
              <Link
                href="/account"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-white/70"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setUser(null);
                }}
                className="rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-ink transition hover:bg-secondary"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-white/70"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-coral px-3.5 py-1.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,92,69,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff6f5b]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-white md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-border/70 bg-mist/95 px-4 py-4 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="rounded-xl bg-lemon px-3 py-2 text-center text-sm font-semibold text-ink"
          >
            Try for free
          </Link>
          {user ? (
            <>
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-center text-sm font-medium"
              >
                My desk
              </Link>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-center text-sm font-medium"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setUser(null);
                  setOpen(false);
                }}
                className="rounded-xl px-3 py-2 text-sm font-medium text-ink/70"
              >
                Log out
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border bg-white px-3 py-2 text-center text-sm font-medium"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-coral px-3 py-2 text-center text-sm font-semibold text-white"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
