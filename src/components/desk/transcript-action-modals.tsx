"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Captions,
  CloudDownload,
  Link2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { downloadBlob } from "@/lib/download-blob";
import type { ExportFormat } from "@/lib/export-formats";
import type { DeskTranscript, QuotaSnapshot } from "./types";

export type TranscriptDialog =
  | { type: "export"; row: DeskTranscript }
  | { type: "share"; row: DeskTranscript }
  | { type: "rename"; row: DeskTranscript }
  | { type: "delete"; row: DeskTranscript };

type Props = {
  dialog: TranscriptDialog | null;
  ownerEmail?: string | null;
  onClose: () => void;
  onRenamed: (row: DeskTranscript) => void;
  onDeleted: (id: string, quota?: QuotaSnapshot | null) => void;
};

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  hint: string;
}[] = [
  { id: "pdf", label: "Export as PDF", hint: "PDF" },
  { id: "docx", label: "Export as DOCX", hint: "DOCX" },
  { id: "txt", label: "Export as TXT", hint: "TXT" },
  { id: "csv", label: "Export as CSV", hint: "CSV" },
  { id: "srt", label: "Export as SRT", hint: "CC" },
  { id: "vtt", label: "Export as VTT", hint: "CC" },
];

export function TranscriptActionModals({
  dialog,
  ownerEmail,
  onClose,
  onRenamed,
  onDeleted,
}: Props) {
  if (!dialog) return null;

  if (dialog.type === "export") {
    return <ExportModal row={dialog.row} onClose={onClose} />;
  }
  if (dialog.type === "share") {
    return (
      <ShareModal row={dialog.row} ownerEmail={ownerEmail} onClose={onClose} />
    );
  }
  if (dialog.type === "rename") {
    return (
      <RenameModal row={dialog.row} onClose={onClose} onRenamed={onRenamed} />
    );
  }
  return (
    <DeleteModal row={dialog.row} onClose={onClose} onDeleted={onDeleted} />
  );
}

function ModalShell({
  title,
  icon,
  children,
  onClose,
  busy,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

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
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white shadow-[0_30px_60px_rgba(18,61,58,0.18)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-secondary text-sea">
              {icon}
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl p-2 text-muted-foreground hover:bg-mist hover:text-ink disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function ExportModal({
  row,
  onClose,
}: {
  row: DeskTranscript;
  onClose: () => void;
}) {
  const [formats, setFormats] = useState<ExportFormat[]>(["txt"]);
  const [timestamps, setTimestamps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(format: ExportFormat) {
    setFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format],
    );
  }

  async function download() {
    if (formats.length === 0) {
      setError("Select at least one format.");
      return;
    }
    if (row.status !== "ready") {
      setError(
        "Transcript is still processing. Wait until status is Ready, then download.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        formats: formats.join(","),
        timestamps: timestamps ? "1" : "0",
      });
      const res = await fetch(
        `/api/transcripts/${row.id}/export?${qs.toString()}`,
        { credentials: "same-origin" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Export failed",
        );
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const match = /filename="([^"]+)"/.exec(cd);
      const name =
        match?.[1] ||
        (formats.length > 1
          ? "export.zip"
          : `${row.title || "transcript"}.${formats[0]}`);
      downloadBlob(blob, name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      title={`Export 1 Transcript`}
      icon={<CloudDownload className="size-4" />}
      onClose={onClose}
      busy={busy}
    >
      <p className="text-sm text-muted-foreground">
        Select one or more formats.
        {row.status !== "ready"
          ? " This file is still processing — export works after status is Ready."
          : null}
      </p>
      <ul className="mt-4 space-y-1.5">
        {FORMAT_OPTIONS.map((opt) => (
          <li key={opt.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-mist/70">
              <input
                type="checkbox"
                className="size-4 accent-coral"
                checked={formats.includes(opt.id)}
                onChange={() => toggle(opt.id)}
              />
              <span className="grid size-8 place-items-center rounded-lg bg-secondary text-[10px] font-bold text-ink">
                {opt.hint === "CC" ? (
                  <Captions className="size-3.5 text-sea" />
                ) : (
                  opt.hint
                )}
              </span>
              <span className="text-sm font-medium text-ink">{opt.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-border/60 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Settings
        </p>
        <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-mist/70">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-coral"
            checked={timestamps}
            onChange={(e) => setTimestamps(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-ink">
              Section timestamps
            </span>
            <span className="block text-xs text-muted-foreground">
              Add timestamps before each section in PDF, DOCX, and TXT.
            </span>
          </span>
        </label>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-sm text-coral">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void download()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-60"
      >
        <CloudDownload className="size-4" />
        {busy ? "Preparing…" : "Download"}
      </button>
    </ModalShell>
  );
}

function ShareModal({
  row,
  ownerEmail,
  onClose,
}: {
  row: DeskTranscript;
  ownerEmail?: string | null;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/transcripts/${row.id}/share`, {
          method: "POST",
          credentials: "same-origin",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Could not create share link");
        }
        if (!cancelled) setUrl(data.share?.url ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Share failed");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row.id]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      inputRef.current?.select();
    }
  }

  return (
    <ModalShell
      title="Share Transcript"
      icon={<Link2 className="size-4" />}
      onClose={onClose}
      busy={busy}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        Anyone with the following secure link can{" "}
        <strong className="font-semibold text-ink">view</strong> this
        transcript
        {ownerEmail ? (
          <>
            {" "}
            and your email address (
            <span className="text-ink">{ownerEmail}</span>)
          </>
        ) : (
          "."
        )}
        {ownerEmail ? "." : null}
      </p>

      <label className="mt-5 block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Secure link
        </span>
        <input
          ref={inputRef}
          readOnly
          value={busy ? "Creating link…" : url || ""}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-1.5 w-full rounded-xl border border-sea bg-mist/40 px-3 py-2.5 text-sm text-ink outline-none"
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-sm text-coral">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || !url}
        onClick={() => void copy()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-60"
      >
        <Link2 className="size-4" />
        {copied ? "Copied!" : "Copy secure link"}
      </button>
    </ModalShell>
  );
}

function RenameModal({
  row,
  onClose,
  onRenamed,
}: {
  row: DeskTranscript;
  onClose: () => void;
  onRenamed: (row: DeskTranscript) => void;
}) {
  const [name, setName] = useState(row.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(t);
  }, []);

  async function save() {
    const title = name.trim().replace(/\s+/g, " ");
    if (!title) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/transcripts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not rename");
      onRenamed({ ...row, ...data.transcript, title });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      title="Rename File"
      icon={<Pencil className="size-4" />}
      onClose={onClose}
      busy={busy}
    >
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Name
        </span>
        <input
          ref={inputRef}
          value={name}
          maxLength={120}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void save();
            }
          }}
          className="mt-1.5 w-full rounded-xl border border-border bg-mist/40 px-3 py-2.5 text-sm text-ink outline-none focus:border-sea focus:ring-2 focus:ring-sea/30"
        />
      </label>
      {error ? (
        <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-sm text-coral">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="mt-5 w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-60"
      >
        {busy ? "Saving…" : "Rename file"}
      </button>
    </ModalShell>
  );
}

function DeleteModal({
  row,
  onClose,
  onDeleted,
}: {
  row: DeskTranscript;
  onClose: () => void;
  onDeleted: (id: string, quota?: QuotaSnapshot | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/transcripts/${row.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error || "Could not delete",
        );
      }
      onDeleted(
        row.id,
        (data as { quota?: QuotaSnapshot | null }).quota ?? null,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      title="Delete File"
      icon={<Trash2 className="size-4" />}
      onClose={onClose}
      busy={busy}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        Are you sure you want to delete{" "}
        <strong className="font-semibold text-ink">{row.title}</strong>? This
        can&apos;t be undone.
      </p>
      {error ? (
        <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-sm text-coral">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void remove()}
        className="mt-5 w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-60"
      >
        {busy ? "Deleting…" : "Delete file"}
      </button>
    </ModalShell>
  );
}

export function formatBytes(bytes: number | null | undefined) {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2).replace(".", ",")} MB`;
}
