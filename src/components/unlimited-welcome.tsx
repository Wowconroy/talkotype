"use client";

import Link from "next/link";
import {
  Briefcase,
  Flame,
  InfinityIcon,
  Rocket,
  Volume2,
} from "lucide-react";
import { useViewerPlan } from "@/lib/use-viewer-plan";

const perks = [
  {
    icon: InfinityIcon,
    title: "Unlimited transcriptions",
    copy: "Transcribing hundreds of hours? We’ve got you covered — one human, no daily ceiling.",
    tone: "bg-[#2db87c] text-white",
  },
  {
    icon: Flame,
    title: "Ultra-fast",
    copy: "Priority lane + a speedy engine that turns audio and video into text while you’re still stretching.",
    tone: "bg-coral text-white",
  },
  {
    icon: Rocket,
    title: "5 hour uploads",
    copy: "Each file can be up to 5 hours long — long meetings, interviews, episode drafts, the whole saga.",
    tone: "bg-lemon text-ink",
  },
  {
    icon: Volume2,
    title: "Audio & video support",
    copy: "Upload everyday formats: MP3, MP4, M4A, MOV, WAV, AAC, OGG, WEBM, MKV, and friends.",
    tone: "bg-sea text-ink",
  },
  {
    icon: Briefcase,
    title: "Download transcripts",
    copy: "Export TXT, PDF, DOCX, and SRT captions — share, edit, or drop into your editor without drama.",
    tone: "bg-[#c4a484] text-ink",
  },
];

export function UnlimitedWelcome({
  showCta = true,
  /** When true (default on home), hide the whole section for signed-in users. */
  hideWhenLoggedIn = false,
}: {
  showCta?: boolean;
  hideWhenLoggedIn?: boolean;
}) {
  const { isLoggedIn, ready } = useViewerPlan();

  if (hideWhenLoggedIn && (!ready || isLoggedIn)) {
    return null;
  }

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_14px,rgba(18,61,58,0.035)_14px,rgba(18,61,58,0.035)_15px)]"
      />

      <div className="relative mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-coral shadow-[0_16px_36px_rgba(255,92,69,0.28)]">
          <InfinityIcon className="size-8 text-white" aria-hidden />
        </div>

        <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Welcome to <span className="text-coral">Unlimited</span>
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Free is a sunny start. Unlimited is the full glow — more hours, more
          exports, front-of-line speed.
        </p>

        <ul className="mt-10 space-y-7 text-left">
          {perks.map((perk) => (
            <li key={perk.title} className="flex gap-4">
              <span
                className={`mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl shadow-sm ${perk.tone}`}
              >
                <perk.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-ink">
                  {perk.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {perk.copy}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {showCta ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,92,69,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff6f5b]"
            >
              <InfinityIcon className="size-4" />
              Go Unlimited
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white/90 px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white"
            >
              Compare plans
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
