"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

export type FolderModalMode = "create" | "rename" | "delete";

type Props = {
  open: boolean;
  mode: FolderModalMode;
  initialName?: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
  onConfirmDelete?: () => void;
};

export function FolderModal({
  open,
  mode,
  initialName = "",
  busy = false,
  error = null,
  onClose,
  onSubmit,
  onConfirmDelete,
}: Props) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    const t = window.setTimeout(() => {
      if (mode === "delete") return;
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(t);
  }, [open, initialName, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const isDelete = mode === "delete";
  const title =
    mode === "create"
      ? "New folder"
      : mode === "rename"
        ? "Rename folder"
        : "Delete folder?";
  const subtitle =
    mode === "create"
      ? "Give it a name — the yarn cat will keep it tidy."
      : mode === "rename"
        ? "Pick a fresher label for this pile of talks."
        : `“${initialName}” goes away. Files inside stay on Recent files.`;

  function submit() {
    if (isDelete) {
      onConfirmDelete?.();
      return;
    }
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        disabled={busy}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white shadow-[0_30px_60px_rgba(18,61,58,0.18)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-secondary via-white to-coral-soft/60 px-6 pb-2 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="absolute right-3 top-3 rounded-xl p-2 text-muted-foreground hover:bg-white/80 hover:text-ink disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
          <CatWithYarn />
        </div>

        <div className="px-6 pb-6 pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
            Folders
          </p>
          <h2
            id={titleId}
            className="mt-1 font-display text-2xl font-semibold text-ink"
          >
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

          {!isDelete ? (
            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Folder name
              </span>
              <input
                ref={inputRef}
                value={name}
                maxLength={80}
                disabled={busy}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="e.g. Client calls"
                className="mt-1.5 w-full rounded-xl border border-border bg-mist/40 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-sea focus:bg-white focus:ring-2 focus:ring-sea/30 disabled:opacity-60"
              />
            </label>
          ) : null}

          {error ? (
            <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-sm text-coral">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || (!isDelete && !name.trim())}
              onClick={submit}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                isDelete
                  ? "bg-coral hover:brightness-105"
                  : "bg-ink hover:bg-ink/90"
              }`}
            >
              {busy
                ? isDelete
                  ? "Deleting…"
                  : mode === "rename"
                    ? "Saving…"
                    : "Creating…"
                : isDelete
                  ? "Delete folder"
                  : mode === "rename"
                    ? "Save name"
                    : "Create folder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatWithYarn() {
  return (
    <div
      className="mx-auto flex h-28 w-full max-w-[280px] items-end justify-center"
      aria-hidden
    >
      <svg
        viewBox="0 0 280 120"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="140" cy="108" rx="90" ry="7" fill="#cfe6e0" opacity="0.75" />

        {/* yarn trail + ball in front of the cat (right side) */}
        <path
          d="M188 100 C202 96, 214 102, 226 97"
          stroke="#ff5c45"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
        <g className="folder-yarn-ball">
          <circle cx="242" cy="90" r="16" fill="#ff5c45" />
          <path
            d="M230 86c7 2 12 7 18 5M232 94c6-1 11 3 16 1M234 80c5 5 10 9 15 12"
            stroke="#ffe8e3"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="248" cy="84" r="2" fill="#ffe8e3" opacity="0.7" />
        </g>

        {/* Cat faces RIGHT toward the yarn: 2 hind + 2 front paws */}
        <g className="folder-cat">
          {/* tail up behind (left / rear) */}
          <path
            className="folder-cat-tail"
            d="M52 86 C34 72, 24 58, 28 44 C30 36, 40 34, 46 42"
            stroke="#123d3a"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="46" cy="42" r="5" fill="#123d3a" />

          {/* hind paws under the haunch */}
          <ellipse cx="64" cy="100" rx="12" ry="7" fill="#0d2e2c" />
          <ellipse cx="84" cy="101" rx="11" ry="6.5" fill="#0d2e2c" />
          <circle cx="58" cy="101" r="1.4" fill="#ff5c45" opacity="0.5" />
          <circle cx="64" cy="103" r="1.3" fill="#ff5c45" opacity="0.5" />
          <circle cx="70" cy="101" r="1.3" fill="#ff5c45" opacity="0.5" />

          {/* body + haunch */}
          <ellipse cx="110" cy="82" rx="48" ry="26" fill="#123d3a" />
          <ellipse cx="78" cy="88" rx="22" ry="18" fill="#123d3a" />
          <ellipse cx="118" cy="78" rx="22" ry="10" fill="#1f524d" opacity="0.28" />

          {/* planted front paw under the chest */}
          <ellipse cx="132" cy="101" rx="11" ry="6" fill="#0d2e2c" />
          <circle cx="126" cy="102" r="1.5" fill="#ff5c45" opacity="0.55" />
          <circle cx="132" cy="104" r="1.4" fill="#ff5c45" opacity="0.55" />
          <circle cx="138" cy="102" r="1.4" fill="#ff5c45" opacity="0.55" />

          {/* other front paw batting the yarn */}
          <g className="folder-cat-paw">
            <path
              d="M148 86 C162 78, 176 80, 190 88"
              stroke="#123d3a"
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="196" cy="90" rx="10" ry="7" fill="#123d3a" />
            <circle cx="202" cy="87" r="1.8" fill="#ff5c45" opacity="0.75" />
            <circle cx="200" cy="93" r="1.6" fill="#ff5c45" opacity="0.75" />
            <circle cx="205" cy="92" r="1.5" fill="#ff5c45" opacity="0.75" />
          </g>

          {/* head facing the yarn */}
          <g className="folder-cat-head">
            <circle cx="168" cy="58" r="28" fill="#123d3a" />
            <path d="M148 42 L144 20 L164 36 Z" fill="#123d3a" />
            <path d="M188 42 L192 20 L172 36 Z" fill="#123d3a" />
            <path d="M150 38 L147 26 L160 35 Z" fill="#ff5c45" opacity="0.6" />
            <path d="M186 38 L189 26 L176 35 Z" fill="#ff5c45" opacity="0.6" />

            <ellipse cx="158" cy="58" rx="4" ry="5" fill="#7ec8c3" />
            <ellipse cx="178" cy="58" rx="4" ry="5" fill="#7ec8c3" />
            <ellipse cx="159.2" cy="56.5" rx="1.3" ry="1.7" fill="#fff" />
            <ellipse cx="179.2" cy="56.5" rx="1.3" ry="1.7" fill="#fff" />

            <ellipse cx="168" cy="66" rx="3" ry="2" fill="#ff5c45" opacity="0.85" />
            <path
              d="M165 70c2 2.5 4 2.5 6 0"
              stroke="#7ec8c3"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M150 62 H140 M150 67 H138 M186 62 H196 M186 67 H198"
              stroke="#7ec8c3"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.75"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
