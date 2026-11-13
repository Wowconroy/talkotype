import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Transcription, pricing, exports & privacy",
  description:
    "Answers about Talkotype audio and video transcription: free vs Unlimited, unclear audio, timed transcripts, speaker labels, exports (TXT, PDF, DOCX, SRT, VTT), languages, security, and canceling.",
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
      "Talkotype is an AI transcription service that turns audio and video into clean, editable, timed text. Upload common formats, pick a language or let Talkotype detect it, then read, click to listen, copy, or export your transcript.",
    a: (
      <>
        Talkotype is an AI transcription service that turns audio and video into
        clean, editable, timed text. Drop a meeting, voice note, podcast cut, or
        Zoom export — we type so you don&apos;t have to. Open a transcript,
        click a sentence to hear that moment, then copy or export. Start on{" "}
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
    q: "What technology powers Talkotype?",
    plain:
      "Talkotype uses advanced speech recognition built for real-world audio — not studio-perfect clips. It is designed to pull usable text even from unclear, quiet, accented, or messy recordings, then present a timed transcript you can read and play back.",
    a: (
      <>
        We run advanced speech recognition tuned for{" "}
        <em>real</em> recordings — not just studio-perfect takes. That means
        Talkotype can often pull usable text from mumbled lines, quiet mics,
        accents, overlapping chatter, and far-from-perfect phone video. You get
        a timed transcript you can skim, click to hear, and clean up where a
        human still knows best. We keep the model stack under the hood so you
        can focus on the words, not the wiring.
      </>
    ),
  },
  {
    q: "Can I upload large files?",
    plain:
      "Yes. Free transcribes the first 30 minutes of a file, one at a time, with 7-day media storage. Unlimited supports up to 3 hours / 5 GB per file, 20 uploads per batch, and forever storage.",
    a: (
      <>
        Free transcribes the <strong>first 30 minutes</strong> (longer files are
        clipped), one file at a time, and keeps originals for{" "}
        <strong>7 days</strong>.{" "}
        <Link href="/pricing" className="font-semibold text-coral hover:underline">
          Unlimited
        </Link>{" "}
        handles up to <strong>3 hours / 5 GB</strong> per file,{" "}
        <strong>20 uploads per batch</strong>, and keeps media{" "}
        <strong>forever</strong>.
      </>
    ),
  },
  {
    q: "Can I export my transcript?",
    plain:
      "Yes. Free plans export TXT. Unlimited adds PDF, DOCX, SRT, and VTT for captions and subtitles workflows.",
    a: (
      <>
        Yes. Free exports <strong>TXT</strong> for quick paste into notes apps.{" "}
        <Link href="/pricing" className="font-semibold text-coral hover:underline">
          Unlimited
        </Link>{" "}
        adds <strong>PDF</strong>, <strong>DOCX</strong>, <strong>SRT</strong>,
        and <strong>VTT</strong> for editors and caption workflows. More on
        formats in{" "}
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
      "Clear speech still works best, but Talkotype’s advanced recognition is built for messy reality: accents, cafe noise, quiet speakers, and imperfect meeting audio. Extremely unclear clips may still need a quick human polish after.",
    a: (
      <>
        Clear speech still wins — but our advanced recognition is built for the
        messy stuff: accents, cafe murmur, soft talkers, phone video, and
        meeting chaos. It often recovers lines that used to come back as
        gibberish. Extremely unclear or distant audio may still want a quick
        human polish. Tips live in{" "}
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
    q: "Can I play audio from inside the transcript?",
    plain:
      "Yes. Finished transcripts show inline timestamps. Click a sentence or timestamp to open the player and jump to that moment in the recording.",
    a: (
      <>
        Yes. When a transcript is ready, timestamps sit inline with the text —
        dense and readable, not one sentence per mile of scroll. Click a
        sentence or a <strong>(m:ss)</strong> stamp to open the player and jump
        straight to that moment. Handy for checking names, numbers, and
        anything the AI almost-but-not-quite nailed.
      </>
    ),
  },
  {
    q: "If I delete a file, is it really gone?",
    plain:
      "Yes. Deleting a transcript removes it from your desk, deletes related transcript data, and wipes the stored media for that file. Lifetime library stats may still count past uploads without keeping the files.",
    a: (
      <>
        Yes. Hitting <strong>Delete</strong> removes the transcript from your
        desk, clears related transcript data, and wipes the stored media for
        that file. It can&apos;t be undone. Your account stats may still
        remember that you transcribed something (all-time totals) without
        keeping the file itself.
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
      "Cancel anytime from Account Settings with Manage plan (Paddle customer portal). You keep Unlimited access until the end of the current billing period.",
    a: (
      <>
        Open{" "}
        <Link href="/account" className="font-semibold text-coral hover:underline">
          Account Settings
        </Link>
        , hit <strong>Manage plan</strong>, and cancel in the Paddle portal.
        You keep Unlimited until the end of the period you already paid for —
        no cliff mid-transcript. Details live in our{" "}
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
      "Unlimited can export SRT and VTT timed captions from your transcript for video editors and many players. Clean the text first for best results.",
    a: (
      <>
        Yes on Unlimited via <strong>SRT</strong> and <strong>VTT</strong>{" "}
        export — timed lines for editors and many video players. Clean names
        and numbers first, then export. More context in{" "}
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
      "Free: 3 transcripts per day, first 30 minutes transcribed, 7-day storage. Unlimited: no daily cap, 3 hours / 5 GB per file, 20 per batch, forever storage.",
    a: (
      <>
        <strong>Free:</strong> 3 transcripts per day, first 30 minutes
        transcribed, originals kept 7 days. <strong>Unlimited:</strong> no
        daily cap, up to 3 hours / 5 GB per file, 20 per batch, storage
        forever. Peek at{" "}
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
            Transcription, unclear audio, timed playback, pricing, exports,
            privacy, and the mildly chaotic realities of real-world recordings —
            answered without corporate fog.
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
