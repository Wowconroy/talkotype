"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReviewCard } from "@/components/review-card";
import { featuredReviews } from "@/content/reviews";

export function ReviewsSlider() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const node = scrollerRef.current;
    if (!node) return;

    const timer = window.setInterval(() => {
      const card = node.querySelector<HTMLElement>("[data-review-slide]");
      if (!card) return;
      const step = card.offsetWidth + 20;
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 8;
      node.scrollTo({
        left: atEnd ? 0 : node.scrollLeft + step,
        behavior: "smooth",
      });
    }, 4200);

    return () => window.clearInterval(timer);
  }, [paused]);

  function scrollByCard(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-review-slide]");
    const step = (card?.offsetWidth ?? 320) + 20;
    node.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <section className="relative overflow-hidden border-y border-border/70 bg-white/55 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_14px,rgba(18,61,58,0.03)_14px,rgba(18,61,58,0.03)_15px)]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
              Reviews
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              People who talk faster than they type
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Real-world vibes from creators, founders, students, and researchers
              who let Talkotype catch the words.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous reviews"
              onClick={() => scrollByCard(-1)}
              className="grid size-10 place-items-center rounded-full border border-border bg-white text-ink transition hover:bg-secondary"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next reviews"
              onClick={() => scrollByCard(1)}
              className="grid size-10 place-items-center rounded-full border border-border bg-white text-ink transition hover:bg-secondary"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {featuredReviews.map((review) => (
            <div
              key={review.id}
              data-review-slide
              className="w-[min(100%,22rem)] shrink-0 snap-start sm:w-[24rem]"
            >
              <ReviewCard review={review} className="h-full" />
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/reviews"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink/80 shadow-[0_10px_24px_rgba(18,61,58,0.05)] transition hover:-translate-y-0.5 hover:bg-mist"
          >
            Read more reviews
          </Link>
        </div>
      </div>
    </section>
  );
}
