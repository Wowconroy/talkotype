import type { Metadata } from "next";
import { PricingGate } from "@/components/pricing-gate";
import { PricingPlans } from "@/components/pricing-plans";
import { UnlimitedWelcome } from "@/components/unlimited-welcome";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Talkotype Free forever, or Unlimited with monthly and yearly billing. Save 30% when you pay yearly.",
};

export default function PricingPage() {
  return (
    <PricingGate>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
            Pricing
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Clear prices. Zero mystery fees.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Start free. Flip to yearly when you want Unlimited for less — same
            features, 30% softer on the wallet.
          </p>
        </div>

        <div className="mt-12">
          <PricingPlans />
        </div>
      </div>

      <div className="border-t border-border/70 bg-white/50">
        <UnlimitedWelcome showCta={false} />
      </div>
    </PricingGate>
  );
}
