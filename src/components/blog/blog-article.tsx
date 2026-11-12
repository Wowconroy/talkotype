import Link from "next/link";
import type { BlogBlock, BlogPost } from "@/content/blog/types";
import { BlogCover } from "@/components/blog/blog-cover";
import { BlogDemo } from "@/components/blog/blog-demos";
import { getPostBySlug } from "@/content/blog";

function richText(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`)/g);
  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2];
      const external = href.startsWith("http");
      return (
        <Link
          key={`${part}-${index}`}
          href={href}
          className="font-semibold text-coral underline decoration-coral/30 underline-offset-2 hover:decoration-coral"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {link[1]}
        </Link>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.9em] text-ink"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-base leading-relaxed text-ink/85">{richText(block.text)}</p>
      );
    case "h2":
      return (
        <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-6 font-display text-xl font-semibold text-ink">
          {block.text}
        </h3>
      );
    case "ul":
      return (
        <ul className="space-y-2 pl-5 text-base leading-relaxed text-ink/85">
          {block.items.map((item) => (
            <li key={item} className="list-disc">
              {richText(item)}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="space-y-2 pl-5 text-base leading-relaxed text-ink/85">
          {block.items.map((item) => (
            <li key={item} className="list-decimal">
              {richText(item)}
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <aside className="rounded-[1.3rem] border border-border/80 bg-secondary/60 px-5 py-4">
          {block.title ? (
            <p className="text-sm font-semibold text-ink">{block.title}</p>
          ) : null}
          <p className="mt-1 text-sm leading-relaxed text-ink/80">
            {richText(block.text)}
          </p>
        </aside>
      );
    case "sample":
      return (
        <figure className="overflow-hidden rounded-[1.4rem] border border-border/80 bg-white/90">
          <figcaption className="border-b border-border/70 bg-mist px-4 py-3 text-sm font-semibold text-ink">
            {block.label}
            {block.note ? (
              <span className="mt-1 block text-xs font-medium text-muted-foreground">
                {block.note}
              </span>
            ) : null}
          </figcaption>
          <div className="space-y-3 px-4 py-4">
            {block.lines.map((line, index) => (
              <div
                key={`${line.text}-${index}`}
                className={
                  line.mark === "bad"
                    ? "rounded-xl bg-coral-soft/70 px-3 py-2"
                    : line.mark === "good"
                      ? "rounded-xl bg-secondary px-3 py-2"
                      : line.mark === "note"
                        ? "rounded-xl bg-lemon/60 px-3 py-2"
                        : ""
                }
              >
                {(line.time || line.speaker) && (
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sea">
                    {[line.time, line.speaker].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-ink/90">
                  {line.text}
                </p>
              </div>
            ))}
          </div>
        </figure>
      );
    case "checklist":
      return (
        <ul className="space-y-2">
          {block.items.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm leading-relaxed text-ink/85"
            >
              <span className="mt-0.5 text-sea" aria-hidden>
                ✓
              </span>
              <span>{richText(item)}</span>
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-[1.3rem] border border-border/80">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-mist">
              <tr>
                {block.headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 font-semibold text-ink"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("-")} className="border-t border-border/70">
                  {row.map((cell) => (
                    <td key={cell} className="px-4 py-3 text-ink/85">
                      {richText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "demo":
      return <BlogDemo variant={block.variant} />;
    case "cta":
      return (
        <div className="rounded-[1.4rem] bg-[linear-gradient(135deg,#123d3a_0%,#1f6f68_55%,#7ec8c3_100%)] px-5 py-6 text-white">
          <p className="text-sm leading-relaxed text-white/85">{block.text}</p>
          <Link
            href={block.href}
            className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink"
          >
            {block.label}
          </Link>
        </div>
      );
    default:
      return null;
  }
}

export function BlogArticle({ post }: { post: BlogPost }) {
  const related = post.related
    .map((slug) => getPostBySlug(slug))
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: {
      "@type": "Organization",
      name: "Talkotype",
    },
    publisher: {
      "@type": "Organization",
      name: "Talkotype",
    },
    mainEntityOfPage: `https://talkotype.app/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/blog" className="text-sm font-semibold text-coral">
        ← All guides
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {new Date(post.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}{" "}
        · {post.readingMinutes} min read
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {post.title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
        {post.description}
      </p>

      <div className="mt-8">
        <BlogCover
          title={post.title}
          theme={post.coverTheme}
          icon={post.coverIcon}
        />
      </div>

      <div className="mt-10 space-y-5">
        {post.blocks.map((block, index) => (
          <Block key={`${block.type}-${index}`} block={block} />
        ))}
      </div>

      {post.sources.length > 0 ? (
        <section className="mt-12 border-t border-border/80 pt-8">
          <h2 className="font-display text-xl font-semibold text-ink">
            Sources
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {post.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-coral underline decoration-coral/30 underline-offset-2"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-10 border-t border-border/80 pt-8">
          <h2 className="font-display text-xl font-semibold text-ink">
            Keep reading
          </h2>
          <ul className="mt-4 space-y-3">
            {related.map((item) =>
              item ? (
                <li key={item.slug}>
                  <Link
                    href={`/blog/${item.slug}`}
                    className="font-semibold text-ink hover:text-coral"
                  >
                    {item.title}
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
