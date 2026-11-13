"use client";

import Link from "next/link";
import { ArrowRight, InfinityIcon } from "lucide-react";
import { useViewerPlan } from "@/lib/use-viewer-plan";

export function HomeCtaBanner() {
  const { isPaid, isLoggedIn } = useViewerPlan();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#123d3a_0%,#1f6f68_48%,#7ec8c3_100%)] px-6 py-12 text-white shadow-[0_30px_60px_rgba(18,61,58,0.18)] sm:px-10 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          {isPaid ? (
            <>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                You’re Unlimited — go drop the next file
              </h2>
              <p className="mt-3 text-base text-white/80">
                No daily ceiling, priority speed, and the whole export kit. Your
                desk is the shortest path to another transcript.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
                >
                  <InfinityIcon className="size-4 text-coral" />
                  Open your desk
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/account"
                  className="inline-flex items-center justify-center rounded-full border border-white/35 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Manage plan
                </Link>
              </div>
            </>
          ) : isLoggedIn ? (
            <>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready when your next idea starts mid-sentence
              </h2>
              <p className="mt-3 text-base text-white/80">
                Jump back to your desk and keep talking. Upgrade later if you
                want Unlimited glow.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
                >
                  Open your desk
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full border border-white/35 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  See Unlimited
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready when your next idea starts mid-sentence
              </h2>
              <p className="mt-3 text-base text-white/80">
                Jump in free. Upgrade later if you fall in love with never
                typing meeting notes again.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
                >
                  Start for free with Google
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full border border-white/35 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Or use email like a classic
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
