"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DeskSidebar } from "@/components/desk/desk-sidebar";
import {
  FolderModal,
  type FolderModalMode,
} from "@/components/desk/folder-modal";
import { TranscriptAudioPlayer } from "@/components/desk/transcript-audio-player";
import {
  TranscriptActionModals,
  type TranscriptDialog,
} from "@/components/desk/transcript-action-modals";
import { TranscriptSidePanel } from "@/components/desk/transcript-side-panel";
import {
  formatDuration,
  formatUploaded,
  type DeskFolder,
  type DeskTranscript,
  type DeskUsage,
} from "@/components/desk/types";
import {
  clockFromMs,
  groupSegmentsIntoParagraphs,
  isJunkDisplayText,
  syntheticSegmentsFromText,
  type DisplaySegment,
} from "@/lib/transcript-display";

type Segment = {
  segment_index: number;
  start_ms: number | null;
  end_ms: number | null;
  text: string;
  speaker_id?: string | null;
};

type Speaker = {
  id: string;
  speaker_index: number;
  label: string;
};

type TranscriptDetail = DeskTranscript & {
  transcript_text: string | null;
  segments?: Segment[];
  speakers?: Speaker[];
  media_assets?: { size_bytes?: number | null; kind?: string }[];
};

export function TranscriptViewer({ id }: { id: string }) {
  const router = useRouter();
  const [row, setRow] = useState<TranscriptDetail | null>(null);
  const [folders, setFolders] = useState<DeskFolder[]>([]);
  const [usage, setUsage] = useState<DeskUsage | null>({
    transcripts_used: 0,
    usage_date: new Date().toISOString().slice(0, 10),
    limit: 3,
  });
  const [plan, setPlan] = useState("free");
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<TranscriptDialog | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [folderDialog, setFolderDialog] = useState<{
    mode: FolderModalMode;
  } | null>(null);
  const [folderBusy, setFolderBusy] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerSrc, setPlayerSrc] = useState<string | null>(null);
  const [seekMs, setSeekMs] = useState<number | null>(null);
  const [seekToken, setSeekToken] = useState(0);
  const [activeSeg, setActiveSeg] = useState<number | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const playerSrcRef = useRef<string | null>(null);
  const mediaUrlPromiseRef = useRef<Promise<string> | null>(null);
  const playRequestRef = useRef(0);

  const loadMeta = useCallback(async () => {
    const res = await fetch("/api/desk", { credentials: "same-origin" });
    if (!res.ok) return;
    const data = await res.json();
    setFolders(data.folders ?? []);
    if (data.usage) setUsage(data.usage);
    setPlan(data.plan ?? "free");
    setOwnerEmail(data.ownerEmail ?? null);
  }, []);

  const loadTranscript = useCallback(async () => {
    const res = await fetch(`/api/transcripts/${id}`, {
      credentials: "same-origin",
    });
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load transcript");
      return;
    }
    const t = data.transcript as TranscriptDetail;
    setRow(t);
    setTitle(t.title ?? "");
    setText(t.transcript_text ?? "");
    setError(null);
  }, [id, router]);

  useEffect(() => {
    void loadTranscript();
    void loadMeta();
  }, [loadTranscript, loadMeta]);

  const mediaSize = useMemo(() => {
    if (row?.media_size_bytes != null) return row.media_size_bytes;
    const media = row?.media_assets ?? [];
    const original =
      media.find((m) => m.kind === "original") ?? media[0] ?? null;
    return original?.size_bytes ?? null;
  }, [row]);

  const deskRow: DeskTranscript | null = row
    ? {
        id: row.id,
        title: title || row.title,
        status: row.status,
        duration_seconds: row.duration_seconds,
        requested_language: row.requested_language,
        source_filename: row.source_filename,
        folder_id: row.folder_id,
        source_url: row.source_url,
        source_kind: row.source_kind,
        created_at: row.created_at,
        updated_at: row.updated_at,
        content_revision: row.content_revision,
        model: row.model ?? null,
        media_size_bytes: mediaSize,
      }
    : null;

  const speakerLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const sp of row?.speakers ?? []) {
      map.set(sp.id, sp.label);
    }
    return map;
  }, [row?.speakers]);

  const displaySegments = useMemo((): DisplaySegment[] => {
    const segments = row?.segments ?? [];
    if (segments.length > 0) {
      return segments
        .filter((seg) => !isJunkDisplayText(seg.text || ""))
        .map((seg) => ({
          segment_index: seg.segment_index,
          start_ms: seg.start_ms,
          end_ms: seg.end_ms,
          text: (seg.text || "").trim(),
          speaker_id: seg.speaker_id,
          speaker_label: seg.speaker_id
            ? (speakerLabelById.get(seg.speaker_id) ?? null)
            : null,
        }));
    }
    // Older / broken rows: rebuild clickable sentences from plain text.
    if ((text || "").trim()) {
      return syntheticSegmentsFromText(text, row?.duration_seconds);
    }
    return [];
  }, [row?.segments, row?.duration_seconds, speakerLabelById, text]);

  const paragraphs = useMemo(
    () => groupSegmentsIntoParagraphs(displaySegments),
    [displaySegments],
  );

  const usingSyntheticSegments = (row?.segments?.length ?? 0) === 0;

  const ensureMediaUrl = useCallback(async () => {
    if (playerSrcRef.current) return playerSrcRef.current;
    if (mediaUrlPromiseRef.current) return mediaUrlPromiseRef.current;

    setMediaLoading(true);
    const promise = (async () => {
      const res = await fetch(
        `/api/transcripts/${id}/media-url?kind=playback`,
        { credentials: "same-origin" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Audio not available");
      }
      const url = data.url as string;
      playerSrcRef.current = url;
      setPlayerSrc(url);
      return url;
    })();

    mediaUrlPromiseRef.current = promise;
    try {
      return await promise;
    } catch (err) {
      mediaUrlPromiseRef.current = null;
      throw err;
    } finally {
      setMediaLoading(false);
    }
  }, [id]);

  async function playFromSegment(seg: DisplaySegment) {
    if (seg.start_ms == null) return;
    // Capture synchronously so a slower earlier click cannot overwrite this seek.
    const requestId = ++playRequestRef.current;
    const targetMs = seg.start_ms;
    setError(null);
    setActiveSeg(seg.segment_index);
    setPlayerOpen(true);
    setSeekMs(targetMs);
    setSeekToken((n) => n + 1);
    try {
      await ensureMediaUrl();
      if (playRequestRef.current !== requestId) return;
      // Re-assert after await — defeats stale in-flight clicks.
      setSeekMs(targetMs);
      setSeekToken((n) => n + 1);
    } catch (err) {
      if (playRequestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Could not open audio");
    }
  }

  async function saveEdits() {
    if (!row) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/transcripts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, transcript_text: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save");
        return;
      }
      setRow((prev) =>
        prev
          ? {
              ...prev,
              ...data.transcript,
              segments: prev.segments,
            }
          : prev,
      );
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function downloadFormat(format: string, timestamps = showTimestamps) {
    if (row?.status !== "ready" || !(text || "").trim()) {
      setError(
        "Transcript is still processing. Wait until status is Completed, then export.",
      );
      return;
    }
    const qs = new URLSearchParams({
      format,
      timestamps: timestamps ? "1" : "0",
    });
    const res = await fetch(`/api/transcripts/${id}/export?${qs}`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error || "Export failed");
      return;
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const match = /filename="([^"]+)"/.exec(cd);
    const { downloadBlob } = await import("@/lib/download-blob");
    downloadBlob(blob, match?.[1] || `transcript.${format}`);
  }

  async function retryProcess() {
    setError(null);
    const res = await fetch(`/api/transcripts/${id}/process`, {
      method: "POST",
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        (data as { error?: string }).error || "Could not start transcription",
      );
      return;
    }
    await loadTranscript();
  }

  async function downloadAudio() {
    const res = await fetch(`/api/transcripts/${id}/media-url?kind=original`, {
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Audio not available");
      return;
    }
    window.open(data.url as string, "_blank", "noopener,noreferrer");
  }

  async function moveToFolder(folderId: string | null) {
    if (!row) return;
    const res = await fetch(`/api/transcripts/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id: folderId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not move");
      return;
    }
    setRow((prev) =>
      prev ? { ...prev, folder_id: folderId, ...data.transcript } : prev,
    );
    setMoveOpen(false);
  }

  async function createFolder(name: string) {
    setFolderBusy(true);
    setFolderError(null);
    try {
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
      setFolderDialog(null);
    } finally {
      setFolderBusy(false);
    }
  }

  if (error && !row) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-coral">
        {error}
      </div>
    );
  }

  if (!row || !deskRow) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
        Opening transcript…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        <DeskSidebar
          usage={usage}
          plan={plan}
          folders={folders}
          activeView={row.folder_id ?? "recent"}
          onSelectRecent={() => router.push("/app")}
          onSelectFolder={(folderId) =>
            router.push(`/app?folder=${folderId}`)
          }
          onCreateFolder={() => {
            setFolderError(null);
            setFolderDialog({ mode: "create" });
          }}
          onRenameFolder={() => router.push("/app")}
          onDeleteFolder={() => router.push("/app")}
          creatingFolder={folderBusy}
        />

        <section className="min-w-0 flex-1">
          <div className="rounded-[1.6rem] border border-border/80 bg-white p-5 shadow-[0_12px_30px_rgba(18,61,58,0.04)] sm:p-8 lg:min-h-[28rem]">
            {editing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-0 bg-transparent font-display text-3xl font-semibold tracking-tight text-ink outline-none"
              />
            ) : (
              <h1
                className="truncate font-display text-3xl font-semibold tracking-tight text-ink"
                title={title || "Untitled"}
              >
                {title || "Untitled"}
              </h1>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {formatUploaded(row.created_at)}
              {row.duration_seconds != null
                ? ` · ${formatDuration(row.duration_seconds)}`
                : ""}
              {row.status === "ready"
                ? " · Completed"
                : row.status
                  ? ` · ${row.status}`
                  : ""}
            </p>

            {editing ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={18}
                className="mt-6 w-full resize-y rounded-2xl border border-border bg-mist/40 px-4 py-4 text-sm leading-relaxed text-ink outline-none focus:border-sea focus:ring-2 focus:ring-sea/30"
              />
            ) : (
              <div
                className={`mt-6 text-sm leading-[1.75] text-ink sm:text-[15px] ${
                  playerOpen ? "pb-24" : ""
                }`}
              >
                {paragraphs.length === 0 ? (
                  <p className="text-muted-foreground">
                    This transcript does not have text yet.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {paragraphs.map((para, pi) => (
                      <p key={`p-${pi}`} className="text-pretty">
                        {para.map((seg, si) => {
                          const active = activeSeg === seg.segment_index;
                          return (
                            <span key={`${seg.segment_index}-${si}`}>
                              {showTimestamps && seg.start_ms != null ? (
                                <button
                                  type="button"
                                  onClick={() => void playFromSegment(seg)}
                                  className="mr-1 inline align-baseline font-mono text-[0.78em] text-muted-foreground transition hover:text-sea"
                                  title="Play from here"
                                >
                                  ({clockFromMs(seg.start_ms)})
                                </button>
                              ) : null}
                              {si === 0 && seg.speaker_label ? (
                                <span className="mr-1 font-semibold text-sea">
                                  {seg.speaker_label}:
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void playFromSegment(seg)}
                                disabled={mediaLoading}
                                className={`inline rounded-sm px-0.5 text-left transition hover:bg-sea/10 ${
                                  active ? "bg-coral/20" : ""
                                }`}
                                title={
                                  seg.start_ms != null
                                    ? `Play at ${clockFromMs(seg.start_ms)}`
                                    : "Play"
                                }
                              >
                                {seg.text}
                              </button>{" "}
                            </span>
                          );
                        })}
                      </p>
                    ))}
                  </div>
                )}
                {displaySegments.length > 0 ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Click a sentence or timestamp to play audio from that moment.
                    {usingSyntheticSegments
                      ? " Timestamps are approximate for this file — re-run transcription for exact sync."
                      : ""}
                  </p>
                ) : null}
              </div>
            )}

            {error ? (
              <p className="mt-4 rounded-xl bg-coral-soft px-3 py-2 text-sm text-coral">
                {error}
              </p>
            ) : null}

            {row.status !== "ready" ? (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-mist/50 px-4 py-3">
                <p className="flex-1 text-sm text-muted-foreground">
                  Status: <strong className="text-ink">{row.status}</strong>.
                  {row.status === "queued" || row.status === "failed"
                    ? " Transcription may not have finished — run it now."
                    : " Refresh in a moment."}
                </p>
                <button
                  type="button"
                  onClick={() => void retryProcess()}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
                >
                  {row.status === "processing"
                    ? "Check again"
                    : "Run transcription"}
                </button>
              </div>
            ) : null}

            {editing ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveEdits()}
                  className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setEditing(false);
                    setTitle(row.title ?? "");
                    setText(row.transcript_text ?? "");
                  }}
                  className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <TranscriptSidePanel
          mediaSizeBytes={mediaSize}
          showTimestamps={showTimestamps}
          editing={editing}
          onToggleTimestamps={setShowTimestamps}
          onExport={(format) => void downloadFormat(format)}
          onAdvancedExport={() => setDialog({ type: "export", row: deskRow })}
          onShare={() => setDialog({ type: "share", row: deskRow })}
          onEdit={() => setEditing((v) => !v)}
          onDownloadAudio={() => void downloadAudio()}
          onRename={() => setDialog({ type: "rename", row: deskRow })}
          onMove={() => setMoveOpen(true)}
          onDelete={() => setDialog({ type: "delete", row: deskRow })}
        />
      </div>

      <TranscriptActionModals
        dialog={dialog}
        ownerEmail={ownerEmail}
        onClose={() => setDialog(null)}
        onRenamed={(updated) => {
          setTitle(updated.title);
          setRow((prev) => (prev ? { ...prev, title: updated.title } : prev));
        }}
        onDeleted={() => router.push("/app")}
      />

      <FolderModal
        open={Boolean(folderDialog)}
        mode={folderDialog?.mode ?? "create"}
        busy={folderBusy}
        error={folderError}
        onClose={() => !folderBusy && setFolderDialog(null)}
        onSubmit={(name) => void createFolder(name)}
      />

      {moveOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setMoveOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-white p-5 shadow-[0_30px_60px_rgba(18,61,58,0.18)]">
            <h2 className="font-display text-xl font-semibold text-ink">
              Move to folder
            </h2>
            <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto">
              <li>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-mist"
                  onClick={() => void moveToFolder(null)}
                >
                  Recent files (no folder)
                </button>
              </li>
              {folders.map((folder) => (
                <li key={folder.id}>
                  <button
                    type="button"
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-mist ${
                      row.folder_id === folder.id ? "bg-sea/20" : ""
                    }`}
                    onClick={() => void moveToFolder(folder.id)}
                  >
                    {folder.name}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink"
              onClick={() => setMoveOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <TranscriptAudioPlayer
        open={playerOpen}
        title={title || row.source_filename || "Audio"}
        src={playerSrc}
        seekMs={seekMs}
        seekToken={seekToken}
        durationSeconds={row.duration_seconds}
        onClose={() => {
          setPlayerOpen(false);
          setActiveSeg(null);
        }}
      />
    </div>
  );
}
