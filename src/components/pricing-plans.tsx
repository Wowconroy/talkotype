"use client";

import Link from "next/link";
import { useState } from "react";
import { InfinityIcon, Mic, Rocket, Sparkles, Zap } from "lucide-react";

type Billing = "monthly" | "yearly";

const MONTHLY_PRICE = 20;
const YEARLY_DISCOUNT = 0.3;
const yearlyPerMonth = MONTHLY_PRICE * (1 - YEARLY_DISCOUNT);
const yearlyBilled = yearlyPerMonth * 12;
const yearlySaved = MONTHLY_PRICE * 12 - yearlyBilled;

const freeFeatures = [
  {
    icon: Mic,
    title: "3 transcripts daily",
    copy: "Three free runs every day — enough for notes, class clips, and quick voice dumps.",
    tone: "muted" as const,
  },
  {
    icon: Rocket,
    title: "30 minute uploads",
    copy: "Each file can be up to 30 minutes. One upload at a time, nice and simple.",
    tone: "muted" as const,
  },
  {
    icon: Zap,
    title: "Chill priority",
    copy: "We still get you there — just after Unlimited folks clear the express lane.",
    tone: "muted" as const,
  },
];

const unlimitedFeatures = [
  {
    icon: InfinityIcon,
    title: "Unlimited transcriptions",
    copy: "Talk as much as you want. One human, endless transcripts — no daily ceiling.",
    tone: "sea" as const,
  },
  {
    icon: Rocket,
    title: "5 hour uploads",
    copy: "Drop long meetings, interviews, or episode drafts — up to 5 hours per file.",
    tone: "coral" as const,
  },
  {
    icon: Sparkles,
    title: "The whole glow kit",
    copy: "Speaker labels, PDF / DOCX / SRT exports, and storage that doesn’t pinch.",
    tone: "lemon" as const,
  },
  {
    icon: Zap,
    title: "Front-of-line speed",
    copy: "Your files jump the queue. We start typing while you’re still sipping coffee.",
    tone: "coral" as const,
  },
];

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function PricingPlans() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const isYearly = billing === "yearly";

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2rem]"
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_12px,rgba(18,61,58,0.035)_12px,rgba(18,61,58,0.035)_13px)]" />
      </div>

      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Billing period"
          className="inline-flex items-center rounded-full border border-border/80 bg-white/90 p-1.5 shadow-[0_12px_30px_rgba(18,61,58,0.06)]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isYearly}
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              !isYearly
                ? "bg-coral text-white shadow-[0_10px_22px_rgba(255,92,69,0.28)]"
                : "text-ink/70 hover:text-ink"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isYearly}
            onClick={() => setBilling("yearly")}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              isYearly
                ? "bg-coral text-white shadow-[0_10px_22px_rgba(255,92,69,0.28)]"
                : "text-ink/70 hover:text-ink"
            }`}
          >
            Yearly
            <span className="rounded-md bg-[#2db87c] px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
              SAVE 30%
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl items-stretch gap-5 md:grid-cols-2">
        <article className="flex h-full min-h-[36.5rem] flex-col rounded-[1.75rem] bg-[#2a3634] p-7 text-white shadow-[0_22px_50px_rgba(18,61,58,0.16)]">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Talkotype Free
          </h2>
          <div className="mt-3 h-px w-full bg-white/15" />
          <div className="mt-6 min-h-[7.5rem]">
            <p className="font-display text-5xl font-semibold tracking-tight">
              Free
            </p>
            <p className="mt-1 text-sm text-white/65">100% Free</p>
          </div>

          <ul className="mt-8 flex-1 space-y-5">
            {freeFeatures.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white/80">
                  <feature.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold leading-tight">{feature.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">
                    {feature.copy}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-[#4a5754] px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white/90 transition hover:bg-[#556360]"
          >
            Start free
          </Link>
        </article>

        <article className="relative flex h-full min-h-[36.5rem] flex-col overflow-hidden rounded-[1.75rem] bg-coral p-7 text-white shadow-[0_28px_60px_rgba(255,92,69,0.28)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-lemon/25 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-8 size-44 rounded-full bg-sea/30 blur-2xl"
          />

          <h2 className="relative font-display text-lg font-semibold tracking-tight">
            Talkotype Unlimited
          </h2>
          <div className="relative mt-3 h-px w-full bg-white/25" />

          <div className="relative mt-6 min-h-[7.5rem]">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                {money(isYearly ? yearlyPerMonth : MONTHLY_PRICE)}
              </span>
              <span className="text-lg font-medium text-white/85">/ month</span>
            </p>

            <div className="mt-3 space-y-1.5" aria-live="polite">
              {isYearly ? (
                <>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-white/90">
                    <span>{money(yearlyBilled)} billed yearly</span>
                    <span className="rounded-md bg-[#2db87c] px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                      SAVE 30%
                    </span>
                  </p>
                  <p className="text-sm text-white/80">
                    That’s {money(yearlySaved)} less than paying monthly —
                    same Unlimited glow, quieter bill.
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/80">
                  {money(MONTHLY_PRICE)} billed monthly
                </p>
              )}
            </div>
          </div>

          <ul className="relative mt-8 flex-1 space-y-5">
            {unlimitedFeatures.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <span
                  className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl shadow-sm ${
                    feature.tone === "sea"
                      ? "bg-sea text-ink"
                      : feature.tone === "lemon"
                        ? "bg-lemon text-ink"
                        : "bg-white text-coral"
                  }`}
                >
                  <feature.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold leading-tight">{feature.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/85">
                    {feature.copy}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="relative mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-coral shadow-[0_14px_28px_rgba(18,61,58,0.12)] transition hover:-translate-y-0.5 hover:bg-blush"
          >
            <InfinityIcon className="size-4" />
            Go Unlimited
          </Link>
        </article>
      </div>
    </div>
  );
}
