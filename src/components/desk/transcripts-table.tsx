"use client";

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  CloudDownload,
  Download,
  FileAudio,
  FileText,
  Link2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  formatDuration,
  formatUploaded,
  isActiveDeskStatus,
  modeLabel,
  statusLabel,
  type DeskTranscript,
} from "./types";
import {
  formatBytes,
  type TranscriptDialog,
} from "./transcript-action-modals";

type Props = {
  items: DeskTranscript[];
  emptyHint: string;
  loading?: boolean;
  onOpenDialog: (dialog: TranscriptDialog) => void;
};

export function TranscriptsTable({
  items,
  emptyHint,
  loading = false,
  onOpenDialog,
}: Props) {
  const router = useRouter();
  const [menuId, setMenuId] = useState<string | null>(null);

  function openTranscript(id: string) {
    router.push(`/app/transcripts/${id}`);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-[0_12px_30px_rgba(18,61,58,0.04)]">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-3 rounded-xl bg-mist/70 px-3 py-3"
            >
              <div className="size-8 rounded-lg bg-secondary" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-secondary" />
                <div className="h-3 w-1/4 rounded bg-secondary/70" />
              </div>
              <div className="hidden h-3 w-16 rounded bg-secondary sm:block" />
              <div className="hidden h-3 w-12 rounded bg-secondary md:block" />
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Loading your files…
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-14 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          Nothing here yet
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-white shadow-[0_12px_30px_rgba(18,61,58,0.04)]">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-mist/60 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="w-[38%] px-4 py-3 font-semibold">Name</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Uploaded</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Duration</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Mode</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Status</th>
              <th className="w-[8%] px-4 py-3 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const active = isActiveDeskStatus(row);
              const pct =
                typeof row.progress_pct === "number"
                  ? Math.max(1, Math.min(99, Math.round(row.progress_pct)))
                  : active
                    ? 1
                    : 0;
              return (
                <Fragment key={row.id}>
                  <tr
                    tabIndex={0}
                    role="link"
                    aria-label={`Open transcript ${row.title}`}
                    onClick={() => openTranscript(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openTranscript(row.id);
                      }
                    }}
                    className={`cursor-pointer border-b border-border/50 last:border-0 hover:bg-mist/40 focus-visible:bg-mist/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sea/50 ${
                      active ? "!border-b-0" : ""
                    }`}
                  >
                    <td className="max-w-0 px-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-sea">
                          {row.source_kind === "link" ? (
                            <Link2 className="size-3.5" />
                          ) : (
                            <FileAudio className="size-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p
                            className="truncate font-medium text-ink"
                            title={row.title || undefined}
                          >
                            {row.title}
                          </p>
                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={
                              (row.source_kind === "link"
                                ? row.source_url
                                : row.source_filename) || undefined
                            }
                          >
                            {row.source_kind === "link"
                              ? row.source_url
                              : row.source_filename}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {formatUploaded(row.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {formatDuration(row.duration_seconds)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {modeLabel(row.model, row.requested_mode)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill row={row} />
                    </td>
                    <td
                      className="px-4 py-3.5 text-right"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <RowMenu
                        row={row}
                        open={menuId === row.id}
                        onToggle={() =>
                          setMenuId((id) => (id === row.id ? null : row.id))
                        }
                        onClose={() => setMenuId(null)}
                        onOpenDialog={(dialog) => {
                          setMenuId(null);
                          onOpenDialog(dialog);
                        }}
                      />
                    </td>
                  </tr>
                  {active ? (
                    <tr
                      className="border-b border-border/50 last:border-0"
                      aria-hidden
                    >
                      <td colSpan={6} className="!p-0">
                        <div className="h-1 w-full bg-mist">
                          <div
                            className="h-full bg-sea transition-[width] duration-700 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowMenu({
  row,
  open,
  onToggle,
  onClose,
  onOpenDialog,
}: {
  row: DeskTranscript;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenDialog: (dialog: TranscriptDialog) => void;
}) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const sizeLabel = formatBytes(row.media_size_bytes);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setCoords(null);
      return;
    }
    const place = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const menuWidth = 224;
      const menuHeight = 300;
      const gap = 4;
      let top = rect.bottom + gap;
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (top + menuHeight > window.innerHeight - 8) {
        top = Math.max(8, rect.top - menuHeight - gap);
      }
      setCoords({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function downloadAudio() {
    setDownloadError(null);
    try {
      const res = await fetch(
        `/api/transcripts/${row.id}/media-url?kind=original`,
        { credentials: "same-origin" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Audio not available");
      }
      // Fetch + save — do not window.open the media URL (browsers autoplay it).
      const mediaRes = await fetch(data.url as string);
      if (!mediaRes.ok) {
        throw new Error("Could not download audio");
      }
      const blob = await mediaRes.blob();
      const { downloadBlob } = await import("@/lib/download-blob");
      const name =
        row.source_filename ||
        `audio-${row.id}.${blob.type.includes("video") ? "mp4" : "mp3"}`;
      downloadBlob(blob, name);
      onClose();
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Could not download audio",
      );
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${row.title}`}
        aria-expanded={open}
        onClick={onToggle}
        className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-mist hover:text-ink"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && coords
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: coords.top, left: coords.left }}
              className="fixed z-[80] w-56 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-[0_16px_40px_rgba(18,61,58,0.14)]"
            >
              <MenuItem
                icon={<FileText className="size-4" />}
                label="Open Transcript"
                onClick={() => {
                  // Navigate first; close the portal on the next frame so the
                  // click cannot fall through onto the desk (or the new page).
                  router.push(`/app/transcripts/${row.id}`);
                  window.setTimeout(() => onClose(), 0);
                }}
              />
              <MenuItem
                icon={<Download className="size-4" />}
                label="Export Transcript"
                onClick={() => onOpenDialog({ type: "export", row })}
              />
              <MenuItem
                icon={<Link2 className="size-4" />}
                label="Share Transcript"
                onClick={() => onOpenDialog({ type: "share", row })}
              />
              <MenuItem
                icon={<CloudDownload className="size-4" />}
                label="Download Audio"
                hint={sizeLabel ?? undefined}
                onClick={() => void downloadAudio()}
              />
              <MenuItem
                icon={<Pencil className="size-4" />}
                label="Rename File"
                onClick={() => onOpenDialog({ type: "rename", row })}
              />
              <MenuItem
                icon={<Trash2 className="size-4 text-coral" />}
                label="Delete File"
                danger
                onClick={() => onOpenDialog({ type: "delete", row })}
              />
              {downloadError ? (
                <p className="border-t border-border/60 px-3 py-2 text-xs text-coral">
                  {downloadError}
                </p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  danger,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-mist ${
        danger ? "text-coral" : "text-ink"
      }`}
    >
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {hint ? (
          <span className="block text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function StatusPill({ row }: { row: DeskTranscript }) {
  const label = statusLabel(row);
  const tone =
    row.status === "ready"
      ? "bg-emerald-100 text-emerald-800"
      : row.status === "failed"
        ? "bg-coral-soft text-coral"
        : row.source_kind === "link" && row.status === "queued"
          ? "bg-lemon/60 text-ink"
          : "bg-secondary text-ink";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}
