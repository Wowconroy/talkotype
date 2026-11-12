"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type AuthMode = "signup" | "login";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "signup") {
        signUpWithEmail(email, password);
      } else {
        signInWithEmail(email, password);
      }
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went sideways.");
    } finally {
      setPending(false);
    }
  }

  function handleGoogle() {
    setError(null);
    setPending(true);
    try {
      signInWithGoogle();
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google shrugged. Try again?");
      setPending(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-md rounded-[1.75rem] border border-border/80 bg-white/90 p-7 shadow-[0_24px_60px_rgba(18,61,58,0.08)] backdrop-blur sm:p-8">
      <div className="mb-6 space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
          {isSignup ? "New here?" : "Welcome back"}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          {isSignup ? "Join the talk party" : "Slip back in"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isSignup
            ? "Three free transcripts a day. No credit card. No vibes check."
            : "Your transcripts missed you. Or maybe they didn’t. Either way — hi."}
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-mist disabled:opacity-60"
      >
        <GoogleIcon />
        {isSignup ? "Start for free with Google" : "Continue with Google"}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or the classic way
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@somewhere.fun"
            className="w-full rounded-2xl border border-border bg-mist/70 px-4 py-3 text-sm outline-none transition focus:border-sea focus:bg-white focus:ring-4 focus:ring-sea/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Password</span>
          <input
            type="password"
            required
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters of mystery"
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
          {pending ? "One sec…" : isSignup ? "Sign up" : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm leading-relaxed text-muted-foreground">
        {isSignup ? (
          <>
            By using Talkotype, you pinky-promise you&apos;ve glanced at our{" "}
            <Link href="/terms" className="font-medium text-ink underline decoration-sea/60 underline-offset-2">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-ink underline decoration-sea/60 underline-offset-2">
              privacy policy
            </Link>
            . Or at least walked past them confidently.
            <br />
            <span className="mt-2 inline-block">
              Already gossiping with us?{" "}
              <Link href="/login" className="font-semibold text-coral">
                Log in
              </Link>
            </span>
          </>
        ) : (
          <>
            New around here?{" "}
            <Link href="/signup" className="font-semibold text-coral">
              Sign up
            </Link>{" "}
            — it&apos;s freer than a Friday afternoon.
          </>
        )}
      </p>
    </div>
  );
}
