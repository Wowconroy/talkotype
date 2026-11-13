"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { AUDIO_LANGUAGES } from "./types";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function LanguageSelect({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();
  const selected =
    AUDIO_LANGUAGES.find((lang) => lang.value === value) ?? AUDIO_LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Audio language
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 flex w-full items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 text-left text-sm font-medium text-ink outline-none transition hover:border-sea focus:border-sea focus:ring-2 focus:ring-sea/30 disabled:opacity-60"
      >
        <span className="text-base leading-none" aria-hidden>
          {selected.flag}
        </span>
        <span className="min-w-0 flex-1 truncate">{selected.label}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-[0_16px_40px_rgba(18,61,58,0.14)]"
        >
          {AUDIO_LANGUAGES.map((lang) => {
            const active = lang.value === value;
            return (
              <li key={lang.value || "auto"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-mist ${
                    active ? "bg-sea/15 font-semibold text-ink" : "text-ink"
                  }`}
                  onClick={() => {
                    onChange(lang.value);
                    setOpen(false);
                  }}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {lang.flag}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{lang.label}</span>
                  {active ? <Check className="size-4 text-sea" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
