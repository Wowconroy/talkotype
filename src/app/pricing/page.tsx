import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple Talkotype plans — free to try, unlimited when you’re ready.",
};

const plans = [
  {
    name: "Playful Free",
    price: "$0",
    cadence: "forever-ish",
    blurb: "Dip a toe. Transcribe a little. Smile a lot.",
    features: [
      "3 transcripts per day",
      "Audio & video uploads",
      "Export to TXT",
      "No credit card required",
    ],
    cta: "Try for free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Unlimited Glow",
    price: "$12",
    cadence: "per month",
    blurb: "For people who talk for a living (or just never stop).",
    features: [
      "Unlimited transcripts",
      "Files up to 5 hours",
      "Speaker labels",
      "PDF, DOCX, SRT exports",
      "Priority speed lane",
    ],
    cta: "Go unlimited",
    href: "/signup",
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
          Pricing
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Clear prices. Zero mystery fees.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Start free. Upgrade when your voice notes start forming a queue.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-[1.8rem] border p-7 ${
              plan.highlight
                ? "border-coral/40 bg-white shadow-[0_24px_50px_rgba(255,92,69,0.12)]"
                : "border-border/80 bg-white/80"
            }`}
          >
            {plan.highlight ? (
              <p className="mb-3 inline-flex rounded-full bg-lemon px-3 py-1 text-xs font-semibold text-ink">
                Most loved
              </p>
            ) : null}
            <h2 className="font-display text-2xl font-semibold text-ink">
              {plan.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{plan.blurb}</p>
            <p className="mt-6 flex items-end gap-2">
              <span className="font-display text-5xl font-semibold text-ink">
                {plan.price}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">
                {plan.cadence}
              </span>
            </p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-ink/85">
                  <Check className="mt-0.5 size-4 shrink-0 text-sea" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-8 flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                plan.highlight
                  ? "bg-coral text-white shadow-[0_14px_30px_rgba(255,92,69,0.28)]"
                  : "border border-border bg-mist text-ink"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
