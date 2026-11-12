import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        Terms of use
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: Nov 12, 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink/85">
        <p>
          By using Talkotype, you agree to play nice: don&apos;t abuse the
          service, don&apos;t share accounts like candy, and don&apos;t upload
          content you have no right to process.
        </p>
        <p>
          Free plans have fair-use limits. Paid plans are billed as described on
          the pricing page. Cancel anytime from account settings once billing is
          live.
        </p>
        <p>
          Talkotype is provided as-is. We work hard to keep things accurate and
          available, but we can&apos;t promise perfection from every mumbled
          microphone in a wind tunnel.
        </p>
        <p>
          Questions? Email hello@talkotype.app and we&apos;ll get back to you
          without the corporate fog machine.
        </p>
      </div>
    </div>
  );
}
