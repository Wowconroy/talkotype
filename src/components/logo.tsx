import Link from "next/link";
import { MicMark } from "@/components/mic-mark";

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
        <MicMark className="size-5" />
      </span>
      <span>
        Talko<span className="text-coral">type</span>
      </span>
    </Link>
  );
}
