import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common Talkotype questions — short, useful, lightly funny.",
};

const faqs = [
  {
    q: "What is Talkotype?",
    a: "Talkotype is a light, friendly transcription tool that turns audio and video into clean text. Think TurboScribe vibes — but sunnier.",
  },
  {
    q: "Is it really free to try?",
    a: "Yep. Three transcripts a day on the free plan. No credit card, no gotchas, no “gotcha but with a smile.”",
  },
  {
    q: "Which file types work?",
    a: "Common audio and video formats like MP3, M4A, WAV, MP4, MOV, and friends. If your phone recorded it, we’re probably cool with it.",
  },
  {
    q: "How accurate is it?",
    a: "Very good with clear speech. Accents, mild background noise, and meeting chaos are usually fine. Whisper-level accuracy energy.",
  },
  {
    q: "Can I label speakers?",
    a: "Yes on Unlimited. Talkotype tags who said what so your transcript doesn’t read like a mystery novel.",
  },
  {
    q: "Is my stuff private?",
    a: "Your files are yours. You can delete them anytime. We don’t sell your rambles to weird advertising goblins. See the privacy policy for the grown-up version.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
          FAQ
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Questions we get before coffee
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Still stuck?{" "}
          <Link href="/signup" className="font-semibold text-coral">
            Start free
          </Link>{" "}
          and poke around — the product is friendlier than this paragraph.
        </p>
      </div>

      <div className="mt-12 space-y-3">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="group rounded-[1.4rem] border border-border/80 bg-white/85 px-5 py-4 open:shadow-[0_16px_40px_rgba(18,61,58,0.06)]"
          >
            <summary className="cursor-pointer list-none font-display text-lg font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span className="text-sea transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
