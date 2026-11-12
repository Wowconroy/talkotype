import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Transcription, pricing, exports & privacy",
  description:
    "Answers about Talkotype audio and video transcription: free vs Unlimited, file formats, speaker labels, exports (TXT, PDF, DOCX, SRT), languages, security, and canceling.",
};

type FaqItem = {
  q: string;
  a: ReactNode;
  plain: string;
};

const faqs: FaqItem[] = [
  {
    q: "What is Talkotype?",
    plain:
      "Talkotype is an AI transcription service that turns audio and video into clean, editable text. Upload common formats, pick a language or let Talkotype detect it, then copy or export your transcript.",
    a: (
      <>
        Talkotype is an AI transcription service that turns audio and video into
        clean, editable text. Drop a meeting, voice note, podcast cut, or Zoom
        export — we type so you don&apos;t have to. Start on{" "}
        <Link href="/signup" className="font-semibold text-coral hover:underline">
          Free
        </Link>{" "}
        or go{" "}
        <Link href="/pricing" className="font-semibold text-coral hover:underline">
          Unlimited
        </Link>{" "}
        when your rambles get serious.
      </>
    ),
  },
  {
    q: "Can I upload large files?",
    plain:
      "Yes. Free plans support uploads up to 30 minutes, one file at a time. Talkotype Unlimited supports files up to 5 hours long for long meetings, interviews, and episode drafts.",
    a: (
      <>
        Yes. Free covers uploads up to <strong>30 minutes</strong>, one file at
        a time.{" "}
        <Link href="/pricing" className="font-semibold text-coral hover:underline">
          Unlimited
        </Link>{" "}
        handles files up to <strong>5 hours</strong> — long meetings,
        interviews, lecture dumps, episode drafts. Trim dead air if you only
        need one chapter.
      </>
    ),
  },
  {
    q: "Can I export my transcript?",
    plain:
      "Yes. Free plans export TXT. Unlimited adds PDF, DOCX, and SRT for captions and subtitles workflows.",
    a: (
      <>
        Yes. Free exports <strong>TXT</strong> for quick paste into notes apps.{" "}
        <Link href="/pricing" className="font-semibold text-coral hover:underline">
          Unlimited
        </Link>{" "}
        adds <strong>PDF</strong>, <strong>DOCX</strong>, and{" "}
        <strong>SRT</strong> for editors and caption workflows. More on formats
        in{" "}
        <Link
          href="/blog/transcripts-vs-captions-vs-subtitles"
          className="font-semibold text-coral hover:underline"
        >
          transcripts vs captions vs subtitles
        </Link>
        .
      </>
    ),
  },
  {
    q: "How much does Talkotype cost?",
    plain:
      "Talkotype Free is $0 with 3 transcripts per day. Unlimited is $20 per month billed monthly, or $14 per month when billed yearly ($168/year) — save 30% versus paying monthly.",
    a: (
      <>
        <Link href="/pricing" className="font-semibold text-coral hover:underline">
          Free
        </Link>{" "}
        is $0 — 3 transcripts a day, no card required.{" "}
        <strong>Unlimited</strong> is <strong>$20/month</strong> billed monthly,
        or <strong>$14/month</strong> when you pay yearly (
        <strong>$168</strong> billed once a year) — that&apos;s{" "}
        <strong>30% less</strong> than twelve monthly payments. Same features
        either way; yearly just softens the bill.
      </>
    ),
  },
  {
    q: "Is Talkotype secure?",
    plain:
      "Your uploads, transcripts, and account details are for your account. You can delete files anytime. Talkotype does not sell your content. See the privacy policy for details.",
    a: (
      <>
        Your uploads, transcripts, and account details stay with your account.
        You can delete files anytime. We don&apos;t sell your rambles. Payments
        (when billing is live) go through a standard processor — we don&apos;t
        stash raw card numbers. Read the grown-up version in our{" "}
        <Link href="/privacy" className="font-semibold text-coral hover:underline">
          privacy policy
        </Link>
        .
      </>
    ),
  },
  {
    q: "Which languages do you support?",
    plain:
      "Talkotype transcribes speech in many languages. You can pick a language on upload or let the app detect it. English and Ukrainian workflows are well supported; try Free to test your accent and domain vocabulary.",
    a: (
      <>
        Talkotype turns speech into text across many languages. Pick the spoken
        language on upload when you know it, or let the app take a guess.
        English is rock-solid; we also care a lot about{" "}
        <Link
          href="/blog/how-to-transcribe-ukrainian-audio-video"
          className="font-semibold text-coral hover:underline"
        >
          Ukrainian audio and video
        </Link>{" "}
        (including mixed EN/UA sentences). Use Free to experiment with your
        accent and vocabulary before you go Unlimited.
      </>
    ),
  },
  {
    q: "Is Talkotype really unlimited?",
    plain:
      "Yes on Unlimited: no daily transcript cap for one person. Do not share your login. Free remains limited to 3 transcripts per day.",
    a: (
      <>
        On <strong>Unlimited</strong>, yes — no daily transcript ceiling for{" "}
        <em>one person</em>. People use it for meetings, podcasts, research
        interviews, and piles of voice notes. The only hard rule: don&apos;t
        share your login like a group playlist. Free stays at 3/day so the
        sunny servers stay sunny.
      </>
    ),
  },
  {
    q: "Which audio and video formats do you support?",
    plain:
      "Talkotype supports common audio and video formats including MP3, M4A, WAV, AAC, OGG, FLAC, MP4, MOV, WEBM, MKV, and similar phone or camera exports.",
    a: (
      <>
        Most everyday formats: <strong>MP3, M4A, WAV, AAC, OGG, FLAC</strong> for
        audio; <strong>MP4, MOV, WEBM, MKV</strong> and similar for video. If
        your phone, Zoom, or camera exported it, we&apos;re usually fine. Need
        a walkthrough? See{" "}
        <Link
          href="/blog/how-to-transcribe-video-to-text"
          className="font-semibold text-coral hover:underline"
        >
          how to transcribe video to text
        </Link>
        .
      </>
    ),
  },
  {
    q: "What about accents, background noise, and poor audio?",
    plain:
      "Clear speech works best, but Talkotype generally handles accents, mild background noise, and imperfect meeting audio. Very noisy files may need a cleanup pass after transcription.",
    a: (
      <>
        Clear speech wins, but accents, cafe murmur, and meeting chaos are
        usually okay. Very noisy or distant mics may need a human polish pass
        after. Tips live in{" "}
        <Link
          href="/blog/transcribe-audio-with-background-noise"
          className="font-semibold text-coral hover:underline"
        >
          transcribing audio with background noise
        </Link>{" "}
        and{" "}
        <Link
          href="/blog/how-to-fix-ai-transcript"
          className="font-semibold text-coral hover:underline"
        >
          how to fix an AI transcript
        </Link>
        .
      </>
    ),
  },
  {
    q: "How do I label speakers in my transcript?",
    plain:
      "Speaker labels are included on Talkotype Unlimited. After transcription, rename speakers so the transcript reads as a clear conversation.",
    a: (
      <>
        Speaker labels ship with{" "}
        <Link href="/pricing" className="font-semibold text-coral hover:underline">
          Unlimited
        </Link>
        . After the first pass, rename speakers (Host, Guest, Alex…) so the
        page reads like a conversation, not a mystery novel. Deep dive:{" "}
        <Link
          href="/blog/how-to-label-speakers-in-transcript"
          className="font-semibold text-coral hover:underline"
        >
          how to label speakers
        </Link>
        .
      </>
    ),
  },
  {
    q: "How do I cancel my subscription?",
    plain:
      "Cancel anytime from account settings once billing is live. You keep Unlimited access until the end of the current billing period.",
    a: (
      <>
        Cancel anytime from account settings once billing is live. You keep
        Unlimited until the end of the period you already paid for — no cliff
        mid-transcript. Details live in our{" "}
        <Link href="/terms" className="font-semibold text-coral hover:underline">
          terms
        </Link>
        .
      </>
    ),
  },
  {
    q: "Can I get captions or subtitles from my transcript?",
    plain:
      "Unlimited can export SRT timed captions from your transcript for video editors and many players. Clean the text first for best results.",
    a: (
      <>
        Yes on Unlimited via <strong>SRT</strong> export — timed lines for
        editors and many video players. Clean names and numbers first, then
        export. More context in{" "}
        <Link
          href="/blog/transcripts-vs-captions-vs-subtitles"
          className="font-semibold text-coral hover:underline"
        >
          transcripts vs captions vs subtitles
        </Link>
        .
      </>
    ),
  },
  {
    q: "How much can I transcribe?",
    plain:
      "Free: 3 transcripts per day, files up to 30 minutes. Unlimited: no daily cap for one person, files up to 5 hours each.",
    a: (
      <>
        <strong>Free:</strong> 3 transcripts per day, files up to 30 minutes.{" "}
        <strong>Unlimited:</strong> no daily cap for one human, files up to 5
        hours each — built for people who talk for a living (or never stop).
        Peek at{" "}
        <Link href="/pricing" className="font-semibold text-coral hover:underline">
          pricing
        </Link>{" "}
        if you&apos;re choosing a lane.
      </>
    ),
  },
  {
    q: "Who is behind Talkotype?",
    plain:
      "Talkotype is built for people who think out loud — creators, students, founders, researchers. Friendly product, serious transcription accuracy.",
    a: (
      <>
        Talkotype is built for people who think out loud: creators, students,
        founders, researchers, and anyone whose brain outruns a keyboard. Light
        mood, serious accuracy — bring the rambles, we&apos;ll bring the words.
      </>
    ),
  },
  {
    q: "I have more questions.",
    plain:
      "Email hello@talkotype.app or start a free account and try a short clip. Privacy questions: privacy@talkotype.app.",
    a: (
      <>
        Email{" "}
        <a
          href="mailto:hello@talkotype.app"
          className="font-semibold text-coral hover:underline"
        >
          hello@talkotype.app
        </a>{" "}
        — we answer without the fog machine. Privacy notes go to{" "}
        <a
          href="mailto:privacy@talkotype.app"
          className="font-semibold text-coral hover:underline"
        >
          privacy@talkotype.app
        </a>
        . Or{" "}
        <Link href="/signup" className="font-semibold text-coral hover:underline">
          start free
        </Link>{" "}
        and try a 30‑second clip; the product is friendlier than this
        paragraph.
      </>
    ),
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.plain,
      },
    })),
  };

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(-45deg,transparent,transparent_14px,rgba(18,61,58,0.03)_14px,rgba(18,61,58,0.03)_15px)]"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
            FAQ
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Transcription, pricing, exports, privacy, and the mildly chaotic
            realities of real-world audio — answered without corporate fog.
          </p>
        </div>

        <div className="mt-14 columns-1 gap-x-10 gap-y-0 md:columns-2 lg:columns-3">
          {faqs.map((item) => (
            <section
              key={item.q}
              className="mb-10 break-inside-avoid"
              itemScope
              itemType="https://schema.org/Question"
            >
              <h2
                className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
                itemProp="name"
              >
                {item.q}
              </h2>
              <div
                className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
                itemProp="acceptedAnswer"
                itemScope
                itemType="https://schema.org/Answer"
              >
                <div itemProp="text">{item.a}</div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
