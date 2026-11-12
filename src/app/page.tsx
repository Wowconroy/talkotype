import Link from "next/link";
import { Headphones, Sparkles, Timer, Waves } from "lucide-react";
import { ReviewsSlider } from "@/components/reviews-slider";
import { StoryHero } from "@/components/story-hero";
import { UnlimitedWelcome } from "@/components/unlimited-welcome";

const perks = [
  {
    icon: Timer,
    title: "Seconds, not coffee breaks",
    copy: "Drop a file, stretch once, and your transcript is already waiting.",
  },
  {
    icon: Waves,
    title: "Audio & video welcome",
    copy: "Meetings, voice notes, podcasts, that chaotic Zoom — we speak fluent ramble.",
  },
  {
    icon: Headphones,
    title: "Speaker labels that make sense",
    copy: "Know who said what without playing detective with timestamps.",
  },
];

export default function Home() {
  return (
    <>
      <StoryHero />

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
              Why Talkotype
            </p>
            <h2 className="mt-2 max-w-xl text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Transcription that feels like a sunny afternoon
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Built for creators, students, founders, and anyone whose brain works
            better out loud.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {perks.map((perk, index) => (
            <div
              key={perk.title}
              className={`rounded-[1.6rem] border border-border/80 bg-white/80 p-6 shadow-[0_18px_40px_rgba(18,61,58,0.04)] ${
                index === 1 ? "animate-float" : ""
              }`}
            >
              <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-secondary text-ink">
                <perk.icon className="size-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-ink">
                {perk.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {perk.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-white/55">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
              How it works
            </p>
            <h2 className="mt-2 text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Three steps. Zero spreadsheet energy.
            </h2>
            <ol className="mt-8 space-y-5">
              {[
                "Upload audio or video — MP3, MP4, voice memos, the works.",
                "Pick your language (or let us guess) and hit go.",
                "Copy, download, or share a clean transcript that actually makes sense.",
              ].map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-lemon font-display text-sm font-semibold text-ink">
                    {index + 1}
                  </span>
                  <p className="text-base leading-relaxed text-ink/85">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative">
            <div className="animate-wiggle absolute -right-2 -top-3 rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white shadow-lg sm:-right-4">
              words appear here →
            </div>
            <div className="rounded-[1.8rem] border border-border bg-mist p-5 shadow-[0_24px_50px_rgba(18,61,58,0.08)] sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="size-4 text-coral" />
                Live transcript preview
              </div>
              <div className="space-y-4 rounded-[1.3rem] bg-white p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
                    Speaker 1 · 00:12
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink">
                    Okay so the plan is simple: we ship the landing page, keep
                    the colors fun, and let people talk instead of type.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-coral">
                    Speaker 2 · 00:21
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink">
                    Love it. Also please never make me manually timestamp this
                    again. My wrists filed a complaint.
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary/80 px-4 py-3 text-sm text-ink/80">
                  Tip: Talkotype keeps the umms optional. Your brilliance is not.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <UnlimitedWelcome />

      <ReviewsSlider />

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#123d3a_0%,#1f6f68_48%,#7ec8c3_100%)] px-6 py-12 text-white shadow-[0_30px_60px_rgba(18,61,58,0.18)] sm:px-10 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready when your next idea starts mid-sentence
            </h2>
            <p className="mt-3 text-base text-white/80">
              Jump in free. Upgrade later if you fall in love with never typing
              meeting notes again.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
              >
                Start for free with Google
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full border border-white/35 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Or use email like a classic
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
