import { Headphones, Timer, Waves } from "lucide-react";
import { ReviewsSlider } from "@/components/reviews-slider";
import { StoryHero } from "@/components/story-hero";
import { TranscriptionFlow } from "@/components/transcription-flow";
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

          <TranscriptionFlow />
        </div>
      </section>

      <UnlimitedWelcome />

      <ReviewsSlider />
    </>
  );
}
