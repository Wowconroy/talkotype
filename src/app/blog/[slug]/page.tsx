import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const posts: Record<
  string,
  { title: string; date: string; body: string[] }
> = {
  "stop-typing-start-talking": {
    title: "Stop typing. Start talking. (Your wrists will throw a party.)",
    date: "Nov 4, 2026",
    body: [
      "Most of us think faster than we type. That’s not a character flaw — it’s a keyboard problem.",
      "Talkotype is built for the messy middle: rambling voice notes, half-formed ideas, and meetings that refuse to stay on agenda. Capture first. Clean later.",
      "Try this today: record a two-minute voice memo about your next task, drop it into Talkotype, and paste the transcript into your doc. You’ll wonder why you ever started with a blank page.",
    ],
  },
  "meeting-notes-without-the-dread": {
    title: "Meeting notes without the dread",
    date: "Oct 22, 2026",
    body: [
      "Someone always gets volunteered to take notes. That someone can be software.",
      "Record the call (with consent, obviously), transcribe with speaker labels, then highlight decisions and next steps. Your teammates get clarity. You get your afternoon back.",
      "Pro move: export to DOCX and leave the “who said what” intact so nobody can rewrite history in the #general channel.",
    ],
  },
  "podcast-to-newsletter": {
    title: "From podcast episode to newsletter in one afternoon",
    date: "Oct 9, 2026",
    body: [
      "Your episode already has the content. Transcription is the bridge to clips, quotes, show notes, and a newsletter that doesn’t take all weekend.",
      "Workflow: upload → transcript → pull three quotable moments → draft the email. Talkotype handles the heavy lifting; you handle the personality.",
      "Bonus: captions (SRT) make your video clips nicer for social without a separate subtitle saga.",
    ],
  },
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: "Post" };
  return { title: post.title };
}

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) notFound();

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <Link href="/blog" className="text-sm font-semibold text-coral">
        ← Back to blog
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {post.date}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">
        {post.title}
      </h1>
      <div className="mt-8 space-y-4 text-base leading-relaxed text-ink/85">
        {post.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
