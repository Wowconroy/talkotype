"use client";

import Link from "next/link";
import { InfinityIcon } from "lucide-react";

type Props = {
  className?: string;
  compact?: boolean;
};

/** Friendly free-plan cap state — shown instead of a thin error strip. */
export function QuotaLimitNotice({ className = "", compact = false }: Props) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-coral/35 bg-gradient-to-b from-coral-soft to-white ${
        compact ? "px-4 py-4" : "px-5 py-6"
      } text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <SadCat />
      <p
        className={`mt-3 font-display font-semibold text-ink ${
          compact ? "text-lg" : "text-xl"
        }`}
      >
        Daily free limit reached
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        You’ve used all 3 free transcriptions for today. Come back tomorrow, or
        go Unlimited and keep talking.
      </p>
      <Link
        href="/pricing"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_22px_rgba(255,92,69,0.28)] transition hover:-translate-y-0.5 hover:bg-coral/90"
      >
        <InfinityIcon className="size-4" />
        Go Unlimited
      </Link>
    </div>
  );
}

function SadCat() {
  return (
    <svg
      viewBox="0 0 160 120"
      className="mx-auto h-24 w-36"
      aria-hidden
    >
      <ellipse cx="80" cy="108" rx="42" ry="6" fill="#ff5c45" opacity="0.12" />
      {/* body */}
      <ellipse cx="80" cy="78" rx="36" ry="26" fill="#ffd6cf" />
      <ellipse cx="80" cy="82" rx="22" ry="14" fill="#fff7f5" />
      {/* head */}
      <circle cx="80" cy="48" r="28" fill="#ffb5aa" />
      {/* ears */}
      <path
        d="M54 36 L48 12 L68 30 Z"
        fill="#ffb5aa"
        stroke="#ff5c45"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M106 36 L112 12 L92 30 Z"
        fill="#ffb5aa"
        stroke="#ff5c45"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M56 32 L52 18 L64 28 Z" fill="#ff5c45" opacity="0.35" />
      <path d="M104 32 L108 18 L96 28 Z" fill="#ff5c45" opacity="0.35" />
      {/* sad eyes */}
      <path
        d="M64 46 q6 7 12 0"
        fill="none"
        stroke="#123d3a"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M84 46 q6 7 12 0"
        fill="none"
        stroke="#123d3a"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* tear */}
      <ellipse cx="98" cy="58" rx="3" ry="5" fill="#7ec8c3" opacity="0.9" />
      {/* mouth */}
      <path
        d="M72 62 q8 -6 16 0"
        fill="none"
        stroke="#123d3a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* nose */}
      <path d="M80 54 l-3 3 h6 z" fill="#ff5c45" />
      {/* whiskers */}
      <path
        d="M48 52 h14 M48 58 h12 M98 52 h14 M100 58 h12"
        stroke="#123d3a"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* paws */}
      <ellipse cx="62" cy="98" rx="10" ry="6" fill="#ffb5aa" />
      <ellipse cx="98" cy="98" rx="10" ry="6" fill="#ffb5aa" />
    </svg>
  );
}

export function isQuotaLimitError(message: string | null | undefined) {
  if (!message) return false;
  return /daily free transcript limit reached/i.test(message);
}
