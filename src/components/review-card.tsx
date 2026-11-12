import type { Review } from "@/content/reviews";

const accentClass = {
  sea: "bg-sea text-ink",
  coral: "bg-coral text-white",
  lemon: "bg-lemon text-ink",
  ink: "bg-ink text-white",
} as const;

function emphasize(text: string, bold: string[] = []) {
  if (!bold.length) return text;

  const escaped = bold
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isBold = bold.some(
      (phrase) => phrase.toLowerCase() === part.toLowerCase(),
    );
    if (isBold) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-ink">
          {part}
        </strong>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function ReviewCard({
  review,
  className = "",
}: {
  review: Review;
  className?: string;
}) {
  const initials = review.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article
      className={`rounded-[1.4rem] border border-border/70 bg-white p-5 shadow-[0_14px_36px_rgba(18,61,58,0.06)] ${className}`}
    >
      <header className="flex items-center gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-full font-display text-sm font-semibold ${accentClass[review.accent ?? "coral"]}`}
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{review.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            <span aria-hidden>{review.flag}</span> {review.place}
            {review.role ? ` · ${review.role}` : ""}
          </p>
        </div>
      </header>

      <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink/80">
        {review.paragraphs.map((paragraph, index) => (
          <p key={index}>{emphasize(paragraph.text, paragraph.bold)}</p>
        ))}
      </div>
    </article>
  );
}
