export function MicMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="8" y="1.4" width="8" height="13" rx="4" fill="currentColor" />
      <path
        d="M5.4 11.2c0 3.6 2.95 6.5 6.6 6.5s6.6-2.9 6.6-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 17.7v3.1M8.3 20.8h7.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
