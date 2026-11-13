"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FolderPlus,
  Folders,
  Clock3,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { DeskFolder, DeskUsage } from "./types";

type Props = {
  usage: DeskUsage | null;
  plan: string;
  usageLoading?: boolean;
  folders: DeskFolder[];
  activeView: "recent" | string;
  onSelectRecent: () => void;
  onSelectFolder: (id: string) => void;
  onCreateFolder: () => void;
  onRenameFolder: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  creatingFolder: boolean;
};

export function DeskSidebar({
  usage,
  plan,
  usageLoading = false,
  folders,
  activeView,
  onSelectRecent,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  creatingFolder,
}: Props) {
  const used = usage?.transcripts_used ?? 0;
  const limit = usage?.limit ?? (plan === "unlimited" ? null : 3);
  // Never flash "Unlimited" while free-plan usage is still hydrating.
  const isFree =
    plan !== "unlimited" && (limit != null || usage == null || usageLoading);
  const showUsagePending = isFree && usage == null;
  const pct =
    isFree && !showUsagePending && limit != null && limit > 0
      ? Math.min(100, (used / limit) * 100)
      : isFree
        ? 0
        : 100;
  const [menuFolderId, setMenuFolderId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuFolderId) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuFolderId(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuFolderId(null);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuFolderId]);

  return (
    <aside className="flex w-full flex-col gap-5 lg:w-64 lg:shrink-0">
      <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-[0_12px_30px_rgba(18,61,58,0.04)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
              Daily limit
            </p>
            <p className="mt-1.5 font-display text-lg font-semibold text-ink">
              {isFree ? (
                showUsagePending ? (
                  <span className="text-muted-foreground">… of {limit ?? 3}</span>
                ) : (
                  <>
                    {used} of {limit ?? 3}{" "}
                    <span className="text-sm font-medium text-muted-foreground">
                      transcriptions
                    </span>
                  </>
                )
              ) : (
                <>Unlimited</>
              )}
            </p>
          </div>
          <span className="grid size-9 place-items-center rounded-xl bg-coral-soft text-coral">
            <Sparkles className="size-4" />
          </span>
        </div>
        {isFree ? (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-coral transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <Link
              href="/pricing"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Go Unlimited
            </Link>
          </>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            No daily cap on your plan.
          </p>
        )}
      </div>

      <div>
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Shortcuts
        </p>
        <button
          type="button"
          onClick={onSelectRecent}
          className={`mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
            activeView === "recent"
              ? "bg-sea/20 text-ink"
              : "text-ink/80 hover:bg-white/80"
          }`}
        >
          <Clock3 className="size-4 shrink-0 text-sea" />
          Recent Files
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Folders
          </p>
          <button
            type="button"
            onClick={onCreateFolder}
            disabled={creatingFolder}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-coral hover:bg-coral-soft disabled:opacity-50"
          >
            <FolderPlus className="size-3.5" />
            New
          </button>
        </div>
        <ul className="mt-2 space-y-0.5">
          {folders.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              No folders yet
            </li>
          ) : (
            folders.map((folder) => {
              const active = activeView === folder.id;
              const menuOpen = menuFolderId === folder.id;
              return (
                <li key={folder.id} className="relative">
                  <div
                    className={`group flex items-center gap-1 rounded-xl pr-1 transition ${
                      active
                        ? "bg-sea/20 text-ink"
                        : "text-ink/80 hover:bg-white/80"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectFolder(folder.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium"
                    >
                      <Folders className="size-4 shrink-0 text-sea" />
                      <span className="truncate">{folder.name}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Folder actions for ${folder.name}`}
                      aria-expanded={menuOpen}
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuFolderId(menuOpen ? null : folder.id);
                      }}
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-white hover:text-ink ${
                        menuOpen || active
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      }`}
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>

                  {menuOpen ? (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-[0_12px_30px_rgba(18,61,58,0.12)]"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-ink hover:bg-mist"
                        onClick={() => {
                          setMenuFolderId(null);
                          onRenameFolder(folder.id);
                        }}
                      >
                        <Pencil className="size-3.5 text-sea" />
                        Rename
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-coral hover:bg-coral-soft"
                        onClick={() => {
                          setMenuFolderId(null);
                          onDeleteFolder(folder.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </aside>
  );
}
