import type { Metadata } from "next";
import Link from "next/link";
import { ReviewCard } from "@/components/review-card";
import { reviews } from "@/content/reviews";

export const metadata: Metadata = {
  title: "Talkotype Reviews",
  description:
    "Read Talkotype reviews from creators, founders, students, and researchers using AI transcription for meetings, podcasts, interviews, and captions.",
};

export default function ReviewsPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(-45deg,transparent,transparent_14px,rgba(18,61,58,0.03)_14px,rgba(18,61,58,0.03)_15px)]"
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
            Reviews
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Talkotype reviews
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Stories from people who upload the chaos and leave with clean text —
            meetings, podcasts, lectures, interviews, and everything in between.
          </p>
        </div>

        <div className="mt-14 columns-1 gap-5 md:columns-2 lg:columns-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              className="mb-5 break-inside-avoid"
            />
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-coral px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,92,69,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff6f5b]"
          >
            Try Talkotype free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-mist"
          >
            See pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
