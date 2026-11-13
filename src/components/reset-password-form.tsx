"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { getSessionUser, updatePassword } from "@/lib/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [missingSession, setMissingSession] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const user = await getSessionUser();
      if (cancelled) return;
      if (!user) {
        setMissingSession(true);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => {
        router.push("/app");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[1.75rem] border border-border/80 bg-white/90 p-7 shadow-[0_24px_60px_rgba(18,61,58,0.08)] backdrop-blur sm:p-8">
      <div className="mb-6 space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
          Account
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Set a new password
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Choose a new password for your Talkotype account.
        </p>
      </div>

      {!ready ? (
        <p className="text-center text-sm text-muted-foreground">Checking link…</p>
      ) : missingSession ? (
        <div className="space-y-4 text-center">
          <p className="rounded-2xl bg-coral-soft px-3 py-2 text-sm text-coral">
            This reset link is invalid or expired. Request a new one from the
            login page.
          </p>
          <Link href="/login" className="font-semibold text-coral">
            Back to log in
          </Link>
        </div>
      ) : done ? (
        <p className="rounded-2xl bg-sea/10 px-3 py-2 text-center text-sm text-ink">
          Password updated. Taking you to your desk…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-ink">New password</span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-2xl border border-border bg-mist/70 py-3 pl-4 pr-12 text-sm outline-none transition focus:border-sea focus:bg-white focus:ring-4 focus:ring-sea/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-2xl text-muted-foreground transition hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-ink">Confirm password</span>
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full rounded-2xl border border-border bg-mist/70 px-4 py-3 text-sm outline-none transition focus:border-sea focus:bg-white focus:ring-4 focus:ring-sea/20"
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-coral-soft px-3 py-2 text-sm text-coral">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,92,69,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff6f5b] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
