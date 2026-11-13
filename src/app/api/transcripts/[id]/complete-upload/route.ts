import { after, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: transcript } = await admin
    .from("transcripts")
    .select("id, active_job_id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!transcript) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (transcript.active_job_id) {
    await admin
      .from("transcription_jobs")
      .update({
        status: "queued",
        stage: "queued",
        started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcript.active_job_id);
  }

  await admin
    .from("transcripts")
    .update({ status: "queued", updated_at: new Date().toISOString() })
    .eq("id", id);

  const origin = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") ?? "";

  // Run transcription after the response so upload UX stays snappy.
  after(async () => {
    try {
      await fetch(`${origin}/api/transcripts/${id}/process`, {
        method: "POST",
        headers: { cookie },
      });
    } catch {
      // Job stays queued; user can retry from the desk.
    }
  });

  return NextResponse.json({ ok: true, status: "queued" });
}
