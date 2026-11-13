"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HardDrive,
  InfinityIcon,
  Mic,
  Rocket,
  Sparkles,
  Zap,
} from "lucide-react";
import { PaddleCheckoutButton } from "@/components/paddle-checkout-button";

type Billing = "monthly" | "yearly";

const MONTHLY_PRICE = 20;
const YEARLY_DISCOUNT = 0.3;
const yearlyPerMonth = MONTHLY_PRICE * (1 - YEARLY_DISCOUNT);
const yearlyBilled = yearlyPerMonth * 12;
const yearlySaved = MONTHLY_PRICE * 12 - yearlyBilled;

type Feature = {
  icon: typeof Mic;
  title: string;
  /** Compact one-liner for mobile. */
  short: string;
  copy: string;
  tone: "muted" | "sea" | "coral" | "lemon";
};

const freeFeatures: Feature[] = [
  {
    icon: Mic,
    title: "3 transcripts daily",
    short: "3 free runs every day.",
    copy: "Three free runs every day — enough for notes, class clips, and quick voice dumps.",
    tone: "muted",
  },
  {
    icon: Rocket,
    title: "30 minute transcripts",
    short: "First 30 minutes · 1 file at a time.",
    copy: "Longer files are fine — we transcribe the first 30 minutes. One upload at a time.",
    tone: "muted",
  },
  {
    icon: HardDrive,
    title: "File storage — 7 days",
    short: "Originals kept for 7 days.",
    copy: "Original audio and video stay available for a week, then clear out automatically.",
    tone: "muted",
  },
  {
    icon: Zap,
    title: "Chill priority",
    short: "Standard queue speed.",
    copy: "We still get you there — just after Unlimited folks clear the express lane.",
    tone: "muted",
  },
];

const unlimitedFeatures: Feature[] = [
  {
    icon: InfinityIcon,
    title: "Unlimited transcriptions",
    short: "No daily ceiling.",
    copy: "Talk as much as you want. One human, endless transcripts — no daily ceiling.",
    tone: "sea",
  },
  {
    icon: Rocket,
    title: "3 hour / 5 GB uploads",
    short: "Up to 3h or 5 GB · 20 per batch.",
    copy: "Each file can be up to 3 hours or 5 GB. Upload up to 20 files in one batch.",
    tone: "coral",
  },
  {
    icon: HardDrive,
    title: "File storage — forever",
    short: "Keep originals while plan is active.",
    copy: "Keep originals on your desk as long as your Unlimited plan is active.",
    tone: "lemon",
  },
  {
    icon: Sparkles,
    title: "The whole glow kit",
    short: "Speakers · PDF / DOCX / SRT · priority.",
    copy: "Speaker labels, PDF / DOCX / SRT exports, and priority processing.",
    tone: "lemon",
  },
  {
    icon: Zap,
    title: "Front-of-line speed",
    short: "Priority processing queue.",
    copy: "Your files jump the queue. We start typing while you’re still sipping coffee.",
    tone: "coral",
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

function FeatureRow({
  feature,
  muted,
}: {
  feature: Feature;
  muted?: boolean;
}) {
  const iconWrap = muted
    ? "bg-white/10 text-white/80"
    : feature.tone === "sea"
      ? "bg-sea text-ink"
      : feature.tone === "lemon"
        ? "bg-lemon text-ink"
        : "bg-white text-coral";

  return (
    <li className="flex items-start gap-2.5 md:gap-3">
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg md:size-10 md:rounded-xl ${
          muted ? "" : "shadow-sm"
        } ${iconWrap}`}
      >
        <feature.icon className="size-4 md:size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug md:text-base md:leading-tight">
          {feature.title}
        </p>
        <p
          className={`mt-0.5 text-xs leading-snug md:mt-1 md:text-sm md:leading-relaxed ${
            muted ? "text-white/65" : "text-white/85"
          }`}
        >
          <span className="md:hidden">{feature.short}</span>
          <span className="hidden md:inline">{feature.copy}</span>
        </p>
      </div>
    </li>
  );
}

export function PricingPlans() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const isYearly = billing === "yearly";

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden rounded-[2rem] md:block"
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_12px,rgba(18,61,58,0.035)_12px,rgba(18,61,58,0.035)_13px)]" />
      </div>

      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Billing period"
          className="inline-flex items-center rounded-full border border-border/80 bg-white/90 p-1 shadow-[0_12px_30px_rgba(18,61,58,0.06)] md:p-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isYearly}
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition md:px-5 md:py-2.5 md:text-sm ${
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
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition md:gap-2 md:px-5 md:py-2.5 md:text-sm ${
              isYearly
                ? "bg-coral text-white shadow-[0_10px_22px_rgba(255,92,69,0.28)]"
                : "text-ink/70 hover:text-ink"
            }`}
          >
            Yearly
            <span className="rounded-md bg-[#2db87c] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white md:px-2 md:text-[11px]">
              −30%
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-5xl gap-3 md:mt-10 md:grid-cols-2 md:items-stretch md:gap-5">
        {/* Unlimited first on mobile so the main offer + CTA are above the fold */}
        <article className="relative order-1 flex h-full flex-col overflow-hidden rounded-2xl bg-coral p-4 text-white shadow-[0_20px_44px_rgba(255,92,69,0.24)] md:order-2 md:rounded-[1.75rem] md:p-7 md:shadow-[0_28px_60px_rgba(255,92,69,0.28)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 hidden size-40 rounded-full bg-lemon/25 blur-2xl md:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-8 hidden size-44 rounded-full bg-sea/30 blur-2xl md:block"
          />

          {/* Mobile: title + price on one row */}
          <div className="relative flex items-baseline justify-between gap-3 md:hidden">
            <h2 className="font-display text-base font-semibold tracking-tight">
              Unlimited
            </h2>
            <p className="flex shrink-0 items-baseline gap-1">
              <span className="font-display text-3xl font-semibold tracking-tight">
                {money(isYearly ? yearlyPerMonth : MONTHLY_PRICE)}
              </span>
              <span className="text-sm font-medium text-white/85">/ mo</span>
            </p>
          </div>

          {/* Desktop header */}
          <div className="relative hidden md:block">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Talkotype Unlimited
            </h2>
            <div className="mt-3 h-px w-full bg-white/25" />
            <div className="mt-6 flex min-h-[10.5rem] flex-col">
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-display text-5xl font-semibold tracking-tight lg:text-6xl">
                  {money(isYearly ? yearlyPerMonth : MONTHLY_PRICE)}
                </span>
                <span className="text-lg font-medium text-white/85">
                  / month
                </span>
              </p>
              <div className="mt-3 min-h-[4.75rem] space-y-1.5" aria-live="polite">
                {isYearly ? (
                  <>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-white/90">
                      <span>{money(yearlyBilled)} billed yearly + tax</span>
                      <span className="rounded-md bg-[#2db87c] px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                        SAVE 30%
                      </span>
                    </p>
                    <p className="text-sm leading-snug text-white/80">
                      That’s {money(yearlySaved)} less than paying monthly —
                      same Unlimited glow, quieter bill.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-white/80">
                    {money(MONTHLY_PRICE)} billed monthly + tax
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile billing note under the title/price row */}
          <div className="relative mt-2 space-y-1 md:hidden" aria-live="polite">
            {isYearly ? (
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-white/90">
                <span>{money(yearlyBilled)} / year + tax</span>
                <span className="rounded-md bg-[#2db87c] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                  SAVE 30%
                </span>
              </p>
            ) : (
              <p className="text-xs text-white/80">
                {money(MONTHLY_PRICE)} billed monthly + tax
              </p>
            )}
          </div>

          <ul className="relative mt-4 space-y-2.5 md:mt-8 md:flex-1 md:space-y-5">
            {unlimitedFeatures.map((feature) => (
              <FeatureRow key={feature.title} feature={feature} />
            ))}
          </ul>

          <PaddleCheckoutButton
            interval={billing}
            loginNext="/pricing"
            className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold uppercase tracking-wide text-coral shadow-[0_14px_28px_rgba(18,61,58,0.12)] transition hover:-translate-y-0.5 hover:bg-blush disabled:opacity-70 md:mt-8 md:px-5 md:py-3.5"
          >
            <InfinityIcon className="size-4" />
            Go Unlimited
          </PaddleCheckoutButton>
          {(process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox") !==
          "production" ? (
            <p className="relative mt-2 text-center text-[11px] text-white/75">
              Sandbox checkout — use Paddle test cards, no real charge.
            </p>
          ) : null}
        </article>

        <article className="order-2 flex h-full flex-col rounded-2xl bg-[#2a3634] p-4 text-white shadow-[0_16px_36px_rgba(18,61,58,0.14)] md:order-1 md:rounded-[1.75rem] md:p-7 md:shadow-[0_22px_50px_rgba(18,61,58,0.16)]">
          <div className="flex items-baseline justify-between gap-3 md:hidden">
            <h2 className="font-display text-base font-semibold tracking-tight">
              Free
            </h2>
            <p className="font-display text-3xl font-semibold tracking-tight">
              $0
            </p>
          </div>

          <div className="hidden md:block">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Talkotype Free
            </h2>
            <div className="mt-3 h-px w-full bg-white/15" />
            <div className="mt-6 flex min-h-[10.5rem] flex-col">
              <p className="font-display text-5xl font-semibold tracking-tight lg:text-6xl">
                Free
              </p>
              <div className="mt-3 min-h-[4.75rem]">
                <p className="text-sm text-white/65">100% Free</p>
              </div>
            </div>
          </div>

          <p className="mt-1.5 text-xs text-white/65 md:hidden">
            100% free · forever
          </p>

          <ul className="mt-4 space-y-2.5 md:mt-8 md:flex-1 md:space-y-5">
            {freeFeatures.map((feature) => (
              <FeatureRow key={feature.title} feature={feature} muted />
            ))}
          </ul>

          <Link
            href="/signup"
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#4a5754] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white/90 transition hover:bg-[#556360] md:mt-8 md:px-5 md:py-3.5"
          >
            Start free
          </Link>
        </article>
      </div>
    </div>
  );
}
