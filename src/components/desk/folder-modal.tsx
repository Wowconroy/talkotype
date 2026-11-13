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

        <path
          d="M200 100 C214 96, 224 102, 234 98"
          stroke="#ff5c45"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
        <g className="folder-yarn-ball">
          <circle cx="248" cy="90" r="15" fill="#ff5c45" />
          <path
            d="M236 86c7 2 12 7 18 5M238 94c6-1 11 3 16 1M240 80c5 5 10 9 15 12"
            stroke="#ffe8e3"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>

        {/* Sitting cat facing right: tail → haunch → body → legs → head */}
        <g className="folder-cat">
          {/* Tail starts INSIDE the haunch so it stays attached */}
          <path
            className="folder-cat-tail"
            d="M78 90 C58 92, 42 78, 36 58 C32 46, 40 38, 50 44"
            stroke="#123d3a"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="50" cy="44" r="5" fill="#123d3a" />

          {/* Haunch + body cover the tail root */}
          <ellipse cx="86" cy="88" rx="28" ry="22" fill="#123d3a" />
          <ellipse cx="124" cy="84" rx="44" ry="24" fill="#123d3a" />
          <ellipse cx="130" cy="78" rx="20" ry="9" fill="#1f524d" opacity="0.28" />

          {/* Two hind paws under haunch */}
          <ellipse cx="68" cy="102" rx="12" ry="7" fill="#0d2e2c" />
          <ellipse cx="90" cy="103" rx="11" ry="6.5" fill="#0d2e2c" />
          <circle cx="62" cy="103" r="1.4" fill="#ff5c45" opacity="0.5" />
          <circle cx="68" cy="105" r="1.3" fill="#ff5c45" opacity="0.5" />
          <circle cx="74" cy="103" r="1.3" fill="#ff5c45" opacity="0.5" />

          {/* Planted front paw under chest */}
          <ellipse cx="138" cy="103" rx="11" ry="6" fill="#0d2e2c" />
          <circle cx="132" cy="104" r="1.5" fill="#ff5c45" opacity="0.55" />
          <circle cx="138" cy="106" r="1.4" fill="#ff5c45" opacity="0.55" />
          <circle cx="144" cy="104" r="1.4" fill="#ff5c45" opacity="0.55" />

          {/* Front batting paw from CHEST/shoulder, not the head */}
          <g className="folder-cat-paw">
            <path
              d="M142 90 C158 86, 174 88, 188 94"
              stroke="#123d3a"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="194" cy="95" rx="10" ry="7" fill="#123d3a" />
            <circle cx="200" cy="92" r="1.8" fill="#ff5c45" opacity="0.75" />
            <circle cx="198" cy="98" r="1.6" fill="#ff5c45" opacity="0.75" />
            <circle cx="203" cy="97" r="1.5" fill="#ff5c45" opacity="0.75" />
          </g>

          {/* Neck bridge, then head on top */}
          <ellipse cx="156" cy="72" rx="14" ry="12" fill="#123d3a" />
          <g className="folder-cat-head">
            <circle cx="172" cy="54" r="26" fill="#123d3a" />
            <path d="M154 40 L150 20 L168 34 Z" fill="#123d3a" />
            <path d="M190 40 L194 20 L176 34 Z" fill="#123d3a" />
            <path d="M156 36 L153 25 L165 33 Z" fill="#ff5c45" opacity="0.6" />
            <path d="M188 36 L191 25 L179 33 Z" fill="#ff5c45" opacity="0.6" />

            <ellipse cx="162" cy="54" rx="4" ry="5" fill="#7ec8c3" />
            <ellipse cx="182" cy="54" rx="4" ry="5" fill="#7ec8c3" />
            <ellipse cx="163.2" cy="52.5" rx="1.3" ry="1.7" fill="#fff" />
            <ellipse cx="183.2" cy="52.5" rx="1.3" ry="1.7" fill="#fff" />

            <ellipse cx="172" cy="62" rx="3" ry="2" fill="#ff5c45" opacity="0.85" />
            <path
              d="M169 66c2 2.5 4 2.5 6 0"
              stroke="#7ec8c3"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M154 58 H144 M154 63 H142 M190 58 H200 M190 63 H202"
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
