import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { ingestLinkTranscript } from "@/lib/ingest-link-transcript";

type Params = { params: Promise<{ id: string }> };

export const maxDuration = 300;

/** Retry / resume link ingest for a transcript that still lacks original media. */
export async function POST(request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const origin = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") ?? "";

  const result = await ingestLinkTranscript({
    transcriptId: id,
    userId: user.id,
    processKick: async (transcriptId) => {
      const processRes = await fetch(
        `${origin}/api/transcripts/${transcriptId}/process`,
        {
          method: "POST",
          headers: { cookie },
          signal: AbortSignal.timeout(290_000),
        },
      );
      if (!processRes.ok) {
        const body = await processRes.text().catch(() => "");
        throw new Error(
          `Process failed (${processRes.status}): ${body.slice(0, 180)}`,
        );
      }
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.code === "youtube_unsupported" ? 400 : 422 },
    );
  }

  return NextResponse.json({ ok: true });
}
