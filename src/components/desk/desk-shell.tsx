"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Upload } from "lucide-react";
import { DeskSidebar } from "./desk-sidebar";
import type { FolderModalMode } from "./folder-modal";
import type { TranscriptDialog } from "./transcript-action-modals";
import { TranscriptsTable } from "./transcripts-table";
import type {
  DeskFolder,
  DeskTranscript,
  DeskUsage,
  QuotaSnapshot,
} from "./types";

const FolderModal = dynamic(
  () => import("./folder-modal").then((m) => m.FolderModal),
  { ssr: false },
);
const ImportLinkModal = dynamic(
  () => import("./import-link-modal").then((m) => m.ImportLinkModal),
  { ssr: false },
);
const TranscribeModal = dynamic(
  () => import("./transcribe-modal").then((m) => m.TranscribeModal),
  { ssr: false },
);
const TranscriptActionModals = dynamic(
  () =>
    import("./transcript-action-modals").then((m) => m.TranscriptActionModals),
  { ssr: false },
);

type DeskInitial = {
  transcripts: DeskTranscript[];
  folders: DeskFolder[];
  usage: DeskUsage;
  plan: string;
  ownerEmail: string | null;
};

type Props = {
  displayName: string;
  initial: DeskInitial;
};

type FolderDialog =
  | { mode: "create" }
  | { mode: "rename"; folder: DeskFolder }
  | { mode: "delete"; folder: DeskFolder };

export function DeskShell({ displayName, initial }: Props) {
  const [transcripts, setTranscripts] = useState(initial.transcripts);
  const [folders, setFolders] = useState(initial.folders);
  const [usage, setUsage] = useState<DeskUsage>(initial.usage);
  const [plan, setPlan] = useState(initial.plan);
  const [activeView, setActiveView] = useState<"recent" | string>(() => {
    if (typeof window === "undefined") return "recent";
    const folder = new URLSearchParams(window.location.search).get("folder");
    return folder || "recent";
  });
  const [query, setQuery] = useState("");
  const [transcribeOpen, setTranscribeOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [folderDialog, setFolderDialog] = useState<FolderDialog | null>(null);
  const [folderBusy, setFolderBusy] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [transcriptDialog, setTranscriptDialog] =
    useState<TranscriptDialog | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(
    initial.ownerEmail,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/desk", { credentials: "same-origin" });
      if (!res.ok) {
        throw new Error("Could not refresh your desk.");
      }
      const data = (await res.json()) as DeskInitial & {
        displayName?: string;
      };
      setTranscripts(data.transcripts ?? []);
      setFolders(data.folders ?? []);
      setUsage(data.usage);
      setPlan(data.plan ?? "free");
      setOwnerEmail(data.ownerEmail ?? null);
    } catch {
      setLoadError("Could not refresh your desk. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  function applyQuota(quota?: QuotaSnapshot | null) {
    if (!quota || typeof quota.transcripts_used !== "number") return;
    setUsage((prev) => ({
      transcripts_used: quota.transcripts_used,
      usage_date:
        quota.usage_date ??
        prev.usage_date ??
        new Date().toISOString().slice(0, 10),
      limit:
        quota.limit === undefined
          ? (prev.limit ?? (plan === "unlimited" ? null : 3))
          : quota.limit,
    }));
  }

  useEffect(() => {
    if (!transcribeOpen && !importOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTranscribeOpen(false);
        setImportOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [transcribeOpen, importOpen]);

  const activeFolder = folders.find((f) => f.id === activeView) ?? null;

  const filtered = useMemo(() => {
    let rows = transcripts;
    if (activeView !== "recent") {
      rows = rows.filter((r) => r.folder_id === activeView);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const hay = [
          r.title,
          r.source_filename ?? "",
          r.source_url ?? "",
          r.status,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return rows;
  }, [transcripts, activeView, query]);

  function openCreateFolder() {
    setFolderError(null);
    setFolderDialog({ mode: "create" });
  }

  function openRenameFolder(id: string) {
    const folder = folders.find((item) => item.id === id);
    if (!folder) return;
    setFolderError(null);
    setFolderDialog({ mode: "rename", folder });
  }

  function openDeleteFolder(id: string) {
    const folder = folders.find((item) => item.id === id);
    if (!folder) return;
    setFolderError(null);
    setFolderDialog({ mode: "delete", folder });
  }

  function closeFolderDialog() {
    if (folderBusy) return;
    setFolderDialog(null);
    setFolderError(null);
  }

  async function submitFolderName(name: string) {
    if (!folderDialog || folderDialog.mode === "delete") return;
    setFolderBusy(true);
    setFolderError(null);
    try {
      if (folderDialog.mode === "create") {
        const res = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFolderError(data.error || "Could not create folder");
          return;
        }
        setFolders((prev) => [...prev, data.folder as DeskFolder]);
        setActiveView(data.folder.id);
        setFolderDialog(null);
        return;
      }

      if (name === folderDialog.folder.name) {
        setFolderDialog(null);
        return;
      }

      const res = await fetch(`/api/folders/${folderDialog.folder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFolderError(data.error || "Could not rename folder");
        return;
      }
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderDialog.folder.id
            ? (data.folder as DeskFolder)
            : folder,
        ),
      );
      setFolderDialog(null);
    } finally {
      setFolderBusy(false);
    }
  }

  async function confirmDeleteFolder() {
    if (!folderDialog || folderDialog.mode !== "delete") return;
    setFolderBusy(true);
    setFolderError(null);
    try {
      const id = folderDialog.folder.id;
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFolderError(
          (data as { error?: string }).error || "Could not delete folder",
        );
        return;
      }
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      if (activeView === id) setActiveView("recent");
      setFolderDialog(null);
      await loadAll({ silent: true });
    } finally {
      setFolderBusy(false);
    }
  }

  const heading =
    activeView === "recent"
      ? "Recent files"
      : (activeFolder?.name ?? "Folder");

  const folderIdForUpload =
    activeView === "recent" ? null : activeView;

  const folderMode: FolderModalMode = folderDialog?.mode ?? "create";
  const folderInitialName =
    folderDialog && folderDialog.mode !== "create"
      ? folderDialog.folder.name
      : "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
            Your desk
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Hey {displayName} — ready to talk it out?
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Organize transcripts, stay under your daily limit, and kick off new
            jobs from one place.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <DeskSidebar
          usage={usage}
          plan={plan}
          folders={folders}
          activeView={activeView}
          onSelectRecent={() => setActiveView("recent")}
          onSelectFolder={setActiveView}
          onCreateFolder={openCreateFolder}
          onRenameFolder={openRenameFolder}
          onDeleteFolder={openDeleteFolder}
          creatingFolder={folderBusy && folderDialog?.mode === "create"}
        />

        <section className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">
              {heading}
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search files…"
                  className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-sea focus:ring-2 focus:ring-sea/30"
                />
              </label>
              <button
                type="button"
                onClick={() => setTranscribeOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                <Upload className="size-4" />
                Transcribe files
              </button>
            </div>
          </div>

          {loadError ? (
            <p className="mb-3 rounded-xl bg-coral-soft px-3 py-2 text-sm text-coral">
              {loadError}
            </p>
          ) : null}

          <TranscriptsTable
            items={filtered}
            loading={loading}
            emptyHint={
              activeView === "recent"
                ? "Hit Transcribe files to upload audio or import a link."
                : "This folder is empty. Upload while it’s selected to file new jobs here."
            }
            onOpenDialog={setTranscriptDialog}
          />
        </section>
      </div>

      <TranscribeModal
        open={transcribeOpen}
        onClose={() => setTranscribeOpen(false)}
        folderId={folderIdForUpload}
        isUnlimited={plan === "unlimited"}
        limitReached={
          plan !== "unlimited" &&
          (usage.limit ?? 3) > 0 &&
          usage.transcripts_used >= (usage.limit ?? 3)
        }
        onUploaded={(quota) => {
          applyQuota(quota);
          void loadAll({ silent: true });
        }}
        onOpenImportLink={() => {
          setTranscribeOpen(false);
          setImportOpen(true);
        }}
      />

      <ImportLinkModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        folderId={folderIdForUpload}
        isUnlimited={plan === "unlimited"}
        limitReached={
          plan !== "unlimited" &&
          (usage.limit ?? 3) > 0 &&
          usage.transcripts_used >= (usage.limit ?? 3)
        }
        onImported={(quota) => {
          applyQuota(quota);
          void loadAll({ silent: true });
        }}
      />

      <FolderModal
        open={Boolean(folderDialog)}
        mode={folderMode}
        initialName={folderInitialName}
        busy={folderBusy}
        error={folderError}
        onClose={closeFolderDialog}
        onSubmit={(name) => void submitFolderName(name)}
        onConfirmDelete={() => void confirmDeleteFolder()}
      />

      <TranscriptActionModals
        dialog={transcriptDialog}
        ownerEmail={ownerEmail}
        onClose={() => setTranscriptDialog(null)}
        onRenamed={(updated) => {
          setTranscripts((prev) =>
            prev.map((item) =>
              item.id === updated.id ? { ...item, ...updated } : item,
            ),
          );
        }}
        onDeleted={(id, quota) => {
          setTranscripts((prev) => prev.filter((item) => item.id !== id));
          // Deleting never restores free daily attempts — trust API quota.
          applyQuota(quota);
          if (!quota) void loadAll({ silent: true });
        }}
      />
    </div>
  );
}
