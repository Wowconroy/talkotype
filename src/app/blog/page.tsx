import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "Talkotype notes on transcription, voice workflows, and lighter ways to work.",
};

const posts = [
  {
    slug: "stop-typing-start-talking",
    title: "Stop typing. Start talking. (Your wrists will throw a party.)",
    excerpt:
      "A tiny guide to turning voice notes into docs you’ll actually reread.",
    date: "Nov 4, 2026",
  },
  {
    slug: "meeting-notes-without-the-dread",
    title: "Meeting notes without the dread",
    excerpt:
      "How to capture every decision without becoming the designated stenographer.",
    date: "Oct 22, 2026",
  },
  {
    slug: "podcast-to-newsletter",
    title: "From podcast episode to newsletter in one afternoon",
    excerpt:
      "Transcribe once, remix forever — with a workflow that stays fun.",
    date: "Oct 9, 2026",
  },
];

export default function BlogPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
          Blog
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Notes from the talk desk
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Short reads on transcription, voice-first workflows, and keeping work
          a little lighter.
        </p>
      </div>

      <div className="mt-12 space-y-4">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-[1.6rem] border border-border/80 bg-white/85 p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(18,61,58,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {post.date}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              <Link href={`/blog/${post.slug}`} className="hover:text-coral">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-4 inline-flex text-sm font-semibold text-coral"
            >
              Read the bit →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
