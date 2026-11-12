import type { Metadata } from "next";
import Link from "next/link";
import { allPosts } from "@/content/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "SEO guides and practical notes on video transcription, MP3 to text, meeting notes, captions, and cleaner Talkotype workflows.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
          Blog
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Guides for turning talk into text
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Practical articles for creators, researchers, and teams. Start with a
          specific file type or workflow, then branch into cleanup, captions,
          and exports.
        </p>
      </div>

      <div className="mt-12 space-y-4">
        {allPosts.map((post) => (
          <article
            key={post.slug}
            className="rounded-[1.6rem] border border-border/80 bg-white/85 p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(18,61,58,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              · {post.readingMinutes} min
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              <Link href={`/blog/${post.slug}`} className="hover:text-coral">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {post.description}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-4 inline-flex text-sm font-semibold text-coral"
            >
              Read the guide →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
