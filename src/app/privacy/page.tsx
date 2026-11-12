import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
        Privacy policy
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: Nov 12, 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink/85">
        <p>
          We collect the basics needed to run Talkotype: account email, auth
          details, and the files you choose to upload for transcription.
        </p>
        <p>
          Your audio, video, and transcripts are for your account. We don&apos;t
          sell personal content. You can delete uploads and transcripts when you
          want them gone.
        </p>
        <p>
          We use cookies/local storage for session continuity (so you don&apos;t
          have to log in every time you blink). Analytics, when enabled, stay as
          privacy-respectful as we can make them.
        </p>
        <p>
          For privacy questions: privacy@talkotype.app. We read those. Slowly, if
          the coffee is strong — but we read them.
        </p>
      </div>
    </div>
  );
}
