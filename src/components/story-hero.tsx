"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Crosshair,
  Globe2,
  InfinityIcon,
  Lock,
  Rocket,
  TrendingUp,
  Users,
} from "lucide-react";
import { useViewerPlan } from "@/lib/use-viewer-plan";
import { cn } from "@/lib/utils";

const slides = [
  {
    src: "/story/story-01-chaos.jpg",
    title: "The meeting spiral",
    line: "Everyone talks. Nobody catches it all.",
  },
  {
    src: "/story/story-02-notes.jpg",
    title: "Notes go feral",
    line: "Sticky notes, scribbles, and mild existential dread.",
  },
  {
    src: "/story/story-03-idea.jpg",
    title: "Plot twist",
    line: "What if talking was enough?",
  },
  {
    src: "/story/story-04-upload.jpg",
    title: "Drop the recording",
    line: "One file. Zero drama.",
  },
  {
    src: "/story/story-05-magic.jpg",
    title: "Words show up",
    line: "Sound becomes a clean transcript in seconds.",
  },
  {
    src: "/story/story-06-done.jpg",
    title: "Team wins",
    line: "Share it. Move on. Keep the vibes.",
  },
];

const featureStrip = [
  { icon: Crosshair, label: "High accuracy", tone: "bg-coral text-white" },
  { icon: Globe2, label: "98+ languages", tone: "bg-sea text-ink" },
  { icon: Rocket, label: "10 hour uploads", tone: "bg-lemon text-ink" },
  { icon: InfinityIcon, label: "Unlimited minutes", tone: "bg-[#2db87c] text-white" },
  { icon: Users, label: "Speaker labels", tone: "bg-ink text-white" },
  { icon: Lock, label: "Private & secure", tone: "bg-[#f0b429] text-ink" },
];

const HOURS_BASE = 1_284_620;
const HOURS_PER_SECOND = 0.09;

function formatHours(value: number) {
  return Math.floor(value).toLocaleString("en-US");
}

export function StoryHero() {
  const { isPaid, isLoggedIn } = useViewerPlan();
  const [active, setActive] = useState(0);
  const [hours, setHours] = useState(HOURS_BASE);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const started = Date.now();
    setHours(HOURS_BASE);
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      setHours(HOURS_BASE + elapsed * HOURS_PER_SECOND);
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  const current = slides[active];

  return (
    <section className="relative overflow-hidden pb-10 pt-10 sm:pb-14 sm:pt-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(126,200,195,0.28),_transparent_55%),radial-gradient(ellipse_at_80%_20%,_rgba(255,92,69,0.14),_transparent_45%),radial-gradient(ellipse_at_50%_100%,_rgba(255,243,163,0.35),_transparent_50%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-rise mb-6 flex justify-center">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-coral/35 bg-white/95 px-4 py-2 text-sm font-semibold text-ink shadow-[0_12px_28px_rgba(255,92,69,0.12)]">
              <span className="grid size-7 place-items-center rounded-lg bg-coral text-white">
                <TrendingUp className="size-3.5" aria-hidden />
              </span>
              <span>
                <span className="tabular-nums text-coral">
                  {formatHours(hours)}
                </span>{" "}
                <span className="text-ink/80">hours transcribed</span>
              </span>
            </p>
          </div>

          <p className="animate-rise font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
            Talko<span className="text-coral">type</span>
          </p>
          <h1 className="animate-rise-delay mt-4 text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
            Talk it out. We&apos;ll type it up.
          </h1>
          <p className="animate-rise-delay-2 mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A tiny comic about messy meetings, magic transcripts, and never
            typing notes again.
          </p>
          <div className="animate-rise-delay-2 mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isPaid ? (
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(255,92,69,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff6f5b]"
              >
                <InfinityIcon className="size-4" />
                Hurray — you’re Unlimited
                <ArrowRight className="size-4" />
              </Link>
            ) : isLoggedIn ? (
              <>
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(255,92,69,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff6f5b]"
                >
                  Open your desk
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Peek at pricing
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(255,92,69,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff6f5b]"
                >
                  Try Talkotype free
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Peek at pricing
                </Link>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {isPaid
              ? "No daily cap. Drop files anytime — your desk is waiting."
              : isLoggedIn
                ? "Your desk is ready. Upgrade anytime for Unlimited."
                : "3 free transcripts daily. No credit card. No judgment for umms."}
          </p>
        </div>

        <div className="animate-rise-delay-2 mt-10">
          <div className="relative overflow-hidden rounded-[1.8rem] border border-border/70 bg-white/70 shadow-[0_28px_70px_rgba(18,61,58,0.1)]">
            <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
              {slides.map((slide, index) => (
                <Image
                  key={slide.src}
                  src={slide.src}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className={cn(
                    "object-cover transition-opacity duration-700",
                    index === active ? "opacity-100" : "opacity-0",
                  )}
                  sizes="(max-width: 1152px) 100vw, 1152px"
                />
              ))}
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-border/70 bg-mist/90 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sea">
                  Scene {active + 1} / {slides.length}
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-ink">
                  {current.title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {current.line}
                </p>
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                {slides.map((slide, index) => (
                  <button
                    key={slide.src}
                    type="button"
                    aria-label={`Show scene ${index + 1}: ${slide.title}`}
                    onClick={() => setActive(index)}
                    className={cn(
                      "h-2.5 rounded-full transition-all",
                      index === active
                        ? "w-8 bg-coral"
                        : "w-2.5 bg-ink/20 hover:bg-ink/35",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-2xl border transition",
                  index === active
                    ? "border-coral shadow-[0_10px_24px_rgba(255,92,69,0.2)]"
                    : "border-border/70 opacity-80 hover:opacity-100",
                )}
              >
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="120px"
                />
                <span className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-white/90 text-[10px] font-bold text-ink">
                  {index + 1}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto rounded-[1.4rem] border border-border/70 bg-ink px-3 py-3.5 shadow-[0_18px_40px_rgba(18,61,58,0.16)] sm:px-4">
            <ul className="flex min-w-max items-center justify-between gap-4 sm:min-w-0 sm:gap-2 md:gap-3">
              {featureStrip.map((feature) => (
                <li
                  key={feature.label}
                  className="flex items-center gap-2 whitespace-nowrap px-1 text-sm font-semibold text-white/95"
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      feature.tone,
                    )}
                  >
                    <feature.icon className="size-4" aria-hidden />
                  </span>
                  {feature.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
