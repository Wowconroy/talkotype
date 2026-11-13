"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";

type TranscriptRow = {
  id: string;
  title: string;
  status: string;
  source_filename: string | null;
  created_at: string;
  content_revision: number;
};

export function UploadDesk({ userLabel }: { userLabel: string }) {
  const [items, setItems] = useState<TranscriptRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/transcripts");
    if (!res.ok) return;
    const data = (await res.json()) as { transcripts: TranscriptRow[] };
    setItems(data.transcripts ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    let step = "start";
    try {
      step = "create";
      const createRes = await fetch("/api/transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        throw new Error(created.error || "Could not start upload");
      }

      step = "storage";
      const put = await fetch(created.upload.url as string, {
        method: "PUT",
        headers: created.upload.headers as HeadersInit,
        body: file,
      });
      if (!put.ok) {
        throw new Error(
          `Upload to storage failed (${put.status}). Check R2 CORS for talkotype.app.`,
        );
      }

      step = "queue";
      const complete = await fetch(
        `/api/transcripts/${created.transcript.id}/complete-upload`,
        { method: "POST" },
      );
      if (!complete.ok) {
        const body = await complete.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error || "Could not queue transcription",
        );
      }

      setMessage(
        `Uploaded “${file.name}”. Original media expires ${
          created.upload.expiresAt
            ? new Date(created.upload.expiresAt).toLocaleDateString()
            : "after retention"
        }.`,
      );
      await load();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Upload failed";
      const hint =
        raw === "Failed to fetch" || /network|cors/i.test(raw)
          ? step === "storage"
            ? "Browser blocked the upload to Cloudflare R2 (usually CORS)."
            : "Network request failed. Check connection and try again."
          : raw;
      setError(hint);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.6rem] border border-dashed border-sea/50 bg-secondary/50 px-6 py-10 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-white text-coral shadow-sm">
          <Upload className="size-6" />
        </div>
        <p className="font-display text-xl font-semibold text-ink">
          Drop audio or video
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {userLabel}. Files go to private Cloudflare R2; editable
          text stays in your Talkotype account.
        </p>
        <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Uploading…" : "Choose file"}
          <input
            type="file"
            className="hidden"
            accept="audio/*,video/*"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              void onFile(file);
            }}
          />
        </label>
        <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
          Only upload recordings you have the right to process. See the{" "}
          <Link href="/privacy" className="font-semibold text-ink underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="font-semibold text-ink underline">
            Terms of Service
          </Link>
          .
        </p>
      </div>

      {message ? (
        <p className="rounded-2xl bg-sea/10 px-4 py-3 text-sm text-ink">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-coral-soft px-4 py-3 text-sm text-coral">
          {error}
        </p>
      ) : null}

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Your transcripts
        </h2>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No transcripts yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.status}
                    {item.source_filename ? ` · ${item.source_filename}` : ""}
                  </p>
                </div>
                <a
                  href={`/api/transcripts/${item.id}/export`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mist"
                >
                  <Download className="size-3.5" />
                  TXT
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
