import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildFormat,
  filenameFor,
  mimeFor,
  zipStore,
  type ExportFormat,
} from "@/lib/export-formats";

type Params = { params: Promise<{ id: string }> };

const ALLOWED = new Set<ExportFormat>([
  "txt",
  "pdf",
  "docx",
  "csv",
  "srt",
  "vtt",
]);

export async function GET(request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const formatsParam =
    url.searchParams.get("formats") ||
    url.searchParams.get("format") ||
    "txt";
  const includeTimestamps = ["1", "true", "yes"].includes(
    (url.searchParams.get("timestamps") || "").toLowerCase(),
  );

  const formats = formatsParam
    .split(",")
    .map((f) => f.trim().toLowerCase() as ExportFormat)
    .filter((f) => ALLOWED.has(f));

  if (formats.length === 0) {
    return NextResponse.json(
      { error: "No valid formats. Use txt,pdf,docx,csv,srt,vtt." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("transcripts")
    .select("id, title, transcript_text, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const text = (data.transcript_text ?? "").trim();
  if (!text) {
    return NextResponse.json(
      {
        error:
          data.status === "ready"
            ? "This transcript has no text to export."
            : "Transcript is still processing. Wait until status is Ready, then export.",
        status: data.status,
      },
      { status: 409 },
    );
  }

  const [{ data: segments }, { data: speakers }] = await Promise.all([
    admin
      .from("transcript_segments")
      .select("segment_index, start_ms, end_ms, text, speaker_id")
      .eq("transcript_id", id)
      .order("segment_index", { ascending: true }),
    admin
      .from("transcript_speakers")
      .select("id, label")
      .eq("transcript_id", id),
  ]);

  const labelById = new Map(
    (speakers ?? []).map((s) => [s.id as string, s.label as string]),
  );

  const input = {
    title: data.title || "Transcript",
    text,
    segments: (segments ?? []).map((s) => ({
      start_ms: s.start_ms as number | null,
      end_ms: s.end_ms as number | null,
      text: (s.text as string) || "",
      speaker: s.speaker_id
        ? (labelById.get(s.speaker_id as string) ?? null)
        : null,
    })),
    includeTimestamps,
  };

  if (formats.length === 1) {
    const format = formats[0];
    const body = await buildFormat(format, input);
    const bytes =
      typeof body === "string" ? new TextEncoder().encode(body) : body;
    const filename = filenameFor(data.title || "transcript", format);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": mimeFor(format),
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const files = await Promise.all(
    formats.map(async (format) => {
      const body = await buildFormat(format, input);
      return {
        name: filenameFor(data.title || "transcript", format),
        data: body,
      };
    }),
  );
  const zip = zipStore(files);
  const zipName = `${(data.title || "transcript").replace(/[^\w.-]+/g, "_")}_export.zip`;
  return new NextResponse(Buffer.from(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
    },
  });
}
