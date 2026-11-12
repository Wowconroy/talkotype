import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-ink ${className}`}
    >
      <span
        aria-hidden
        className="relative grid size-9 place-items-center rounded-2xl bg-coral text-white shadow-[0_8px_20px_rgba(255,92,69,0.28)] transition-transform duration-300 group-hover:-rotate-6"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path
            d="M8 10.5c0-2.2 1.8-4 4-4s4 1.8 4 4v1.2c0 2.2-1.8 4-4 4s-4-1.8-4-4v-1.2Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M6.5 12.2c0 3 2.5 5.4 5.5 5.4s5.5-2.4 5.5-5.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M12 17.6v2.2M9.8 19.8h4.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>
        Talko<span className="text-coral">type</span>
      </span>
    </Link>
  );
}
