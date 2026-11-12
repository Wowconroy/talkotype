"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { getSessionUser, type TalkotypeUser } from "@/lib/auth";

export default function AppPage() {
  const router = useRouter();
  const [user, setUser] = useState<TalkotypeUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSessionUser();
    if (!session) {
      router.replace("/signup");
      return;
    }
    setUser(session);
    setReady(true);
  }, [router]);

  if (!ready || !user) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-20 text-sm text-muted-foreground">
        Warming up your talk desk…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
      <div className="rounded-[2rem] border border-border/80 bg-white/90 p-7 shadow-[0_24px_50px_rgba(18,61,58,0.06)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
          Your desk
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Hey {user.name} — ready to talk it out?
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          You&apos;re in. Upload is coming online next; for now this is your
          home base after signup. Free plan: 3 transcripts a day once
          transcription ships.
        </p>

        <div className="mt-8 rounded-[1.6rem] border border-dashed border-sea/50 bg-secondary/50 px-6 py-12 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-white text-coral shadow-sm">
            <Upload className="size-6" />
          </div>
          <p className="font-display text-xl font-semibold text-ink">
            Drop audio or video here soon
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in with {user.provider === "google" ? "Google" : user.email}.
          </p>
          <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
            When uploads go live, files you submit will be processed to create a
            transcript for your account. Only upload recordings you have the
            right to process. Details on access, retention, and deletion are in
            our{" "}
            <Link href="/privacy" className="font-semibold text-ink underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="font-semibold text-ink underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/account"
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white"
          >
            Account settings
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-border bg-mist px-5 py-2.5 text-sm font-semibold text-ink"
          >
            See Unlimited
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border bg-mist px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
