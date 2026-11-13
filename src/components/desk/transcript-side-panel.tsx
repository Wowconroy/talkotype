"use client";

import type { ReactNode } from "react";
import {
  Captions,
  CloudDownload,
  FileText,
  FolderInput,
  Link2,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatBytes } from "./transcript-action-modals";

type Props = {
  mediaSizeBytes?: number | null;
  showTimestamps: boolean;
  editing: boolean;
  onToggleTimestamps: (value: boolean) => void;
  onExport: (format: "pdf" | "docx" | "txt" | "srt") => void;
  onAdvancedExport: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDownloadAudio: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
};

export function TranscriptSidePanel({
  mediaSizeBytes,
  showTimestamps,
  editing,
  onToggleTimestamps,
  onExport,
  onAdvancedExport,
  onShare,
  onEdit,
  onDownloadAudio,
  onRename,
  onMove,
  onDelete,
}: Props) {
  const sizeLabel = formatBytes(mediaSizeBytes);

  return (
    <aside className="flex w-full flex-col gap-5 lg:w-52 lg:shrink-0 xl:w-56">
      <section>
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Export
        </p>
        <ul className="mt-2 space-y-0.5">
          <SideItem
            icon={<span className="text-[10px] font-bold">PDF</span>}
            label="Download PDF"
            onClick={() => onExport("pdf")}
          />
          <SideItem
            icon={<span className="text-[10px] font-bold">DOCX</span>}
            label="Download DOCX"
            onClick={() => onExport("docx")}
          />
          <SideItem
            icon={<span className="text-[10px] font-bold">TXT</span>}
            label="Download TXT"
            onClick={() => onExport("txt")}
          />
          <SideItem
            icon={<Captions className="size-3.5" />}
            label="Download SRT"
            onClick={() => onExport("srt")}
          />
          <SideItem
            icon={<FileText className="size-3.5" />}
            label="Advanced export"
            hint="Timestamps and more formats"
            onClick={onAdvancedExport}
          />
        </ul>
      </section>

      <section>
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          More
        </p>
        <ul className="mt-2 space-y-0.5">
          <li>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-white/80">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-coral"
                checked={showTimestamps}
                onChange={(e) => onToggleTimestamps(e.target.checked)}
              />
              <span>Show timestamps</span>
            </label>
          </li>
          <SideItem
            icon={<Link2 className="size-3.5" />}
            label="Share transcript"
            onClick={onShare}
          />
          <SideItem
            icon={<Pencil className="size-3.5" />}
            label={editing ? "Done editing" : "Edit transcript"}
            onClick={onEdit}
          />
          <SideItem
            icon={<CloudDownload className="size-3.5" />}
            label="Download audio"
            hint={sizeLabel ?? undefined}
            onClick={onDownloadAudio}
          />
          <SideItem
            icon={<Pencil className="size-3.5" />}
            label="Rename file"
            onClick={onRename}
          />
          <SideItem
            icon={<FolderInput className="size-3.5" />}
            label="Move"
            onClick={onMove}
          />
          <SideItem
            icon={<Trash2 className="size-3.5 text-coral" />}
            label="Delete file"
            danger
            onClick={onDelete}
          />
        </ul>
      </section>
    </aside>
  );
}

function SideItem({
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
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-white/80 ${
          danger ? "text-coral" : "text-ink"
        }`}
      >
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-sea">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block">{label}</span>
          {hint ? (
            <span className="block text-xs font-normal text-muted-foreground">
              {hint}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}
