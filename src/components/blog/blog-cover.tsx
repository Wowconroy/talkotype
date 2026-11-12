import { cn } from "@/lib/utils";

const themes = {
  coral: "from-[#ff5c45]/25 via-[#ffe8e3] to-[#f4fbf9]",
  mint: "from-[#7ec8c3]/35 via-[#dff4ef] to-[#f4fbf9]",
  lemon: "from-[#fff3a3]/70 via-[#fff8d6] to-[#f4fbf9]",
  ink: "from-[#123d3a]/15 via-[#dff4ef] to-[#f4fbf9]",
  blush: "from-[#ffb4a8]/35 via-[#fff5f0] to-[#f4fbf9]",
} as const;

const icons = {
  video: (
    <path
      d="M4 8.5A2.5 2.5 0 0 1 6.5 6h7A2.5 2.5 0 0 1 16 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 15.5v-7Zm14.2 1.1 3.3-1.9a1 1 0 0 1 1.5.9v7.8a1 1 0 0 1-1.5.9l-3.3-1.9V9.6Z"
      fill="currentColor"
    />
  ),
  audio: (
    <path
      d="M8 10.5a4 4 0 1 1 8 0v1a4 4 0 1 1-8 0v-1Zm4 8.2a6.2 6.2 0 0 0 6.2-6.2h-1.7a4.5 4.5 0 0 1-9 0H5.8A6.2 6.2 0 0 0 12 18.7Zm-.8 1.5h1.6v2.2h-1.6v-2.2Z"
      fill="currentColor"
    />
  ),
  doc: (
    <path
      d="M7 4.5A2.5 2.5 0 0 1 9.5 2h5.2L19 6.3V19.5A2.5 2.5 0 0 1 16.5 22h-7A2.5 2.5 0 0 1 7 19.5v-15ZM14.5 2.8V6h3.1L14.5 2.8ZM9.5 10h7v1.5h-7V10Zm0 3.5h7V15h-7v-1.5Zm0 3.5h5V18.5h-5V17Z"
      fill="currentColor"
    />
  ),
  users: (
    <path
      d="M9 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm8.5-1a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6ZM3.2 19.5c0-3 2.8-5.2 5.8-5.2s5.8 2.2 5.8 5.2V21H3.2v-1.5Zm11.3-.2c.4-1.7 1.6-3.1 3.3-3.8 1.4.7 2.4 2.1 2.4 3.8V21h-5.7v-1.7Z"
      fill="currentColor"
    />
  ),
  shield: (
    <path
      d="M12 2.5 4.5 5.4v6.3c0 4.5 3.1 8.6 7.5 9.8 4.4-1.2 7.5-5.3 7.5-9.8V5.4L12 2.5Zm0 2.1 5.5 2.1v5c0 3.4-2.3 6.5-5.5 7.5-3.2-1-5.5-4.1-5.5-7.5v-5L12 4.6Zm-1.1 9.7 4.7-4.7-1.2-1.2-3.5 3.5-1.6-1.6-1.2 1.2 2.8 2.8Z"
      fill="currentColor"
    />
  ),
  wave: (
    <path
      d="M3 12h1.8c.8-3.2 1.7-5 2.7-5s2 2.3 2.8 5 1.8 5 2.8 5 2-2.3 2.8-5 1.8-5 2.8-5 1.9 1.8 2.7 5H23v2h-1.8c-.8 3.2-1.7 5-2.7 5s-2-2.3-2.8-5-1.8-5-2.8-5-2 2.3-2.8 5-1.8 5-2.8 5-1.9-1.8-2.7-5H3v-2Z"
      fill="currentColor"
    />
  ),
  fix: (
    <path
      d="m14.7 4.2 5.1 5.1-1.4 1.4-5.1-5.1 1.4-1.4ZM4.8 16.3l7.4-7.4 1.4 1.4-5.8 5.8H6.2v-1.6l-1.4 1.8Zm-.6 3.2h15.6V21H4.2v-1.5Z"
      fill="currentColor"
    />
  ),
  clock: (
    <path
      d="M12 3.2a8.8 8.8 0 1 1 0 17.6 8.8 8.8 0 0 1 0-17.6Zm0 1.7a7.1 7.1 0 1 0 0 14.2 7.1 7.1 0 0 0 0-14.2Zm-.8 2.4h1.6v4.3l3 1.8-.8 1.3-3.8-2.3V7.3Z"
      fill="currentColor"
    />
  ),
} as const;

export function BlogCover({
  title,
  theme,
  icon,
  className,
}: {
  title: string;
  theme: keyof typeof themes;
  icon: keyof typeof icons;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.6rem] border border-border/70 bg-gradient-to-br p-6 sm:p-8",
        themes[theme],
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute -right-6 -top-8 size-40 rounded-full bg-white/40 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-10 left-10 size-36 rounded-full bg-coral/10 blur-2xl"
      />
      <div className="relative flex items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sea">
            Talkotype guide
          </p>
          <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {title}
          </p>
        </div>
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/80 text-coral shadow-sm sm:size-16">
          <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
            {icons[icon]}
          </svg>
        </div>
      </div>
    </div>
  );
}
