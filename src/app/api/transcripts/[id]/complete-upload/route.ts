import { after, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  dispatchTranscriptionJob,
  isTranscriptionWorkerConfigured,
} from "@/lib/transcription-worker";

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
        progress_pct: 0,
        started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcript.active_job_id);
  }

  await admin
    .from("transcripts")
    .update({ status: "queued", updated_at: new Date().toISOString() })
    .eq("id", id);

  const useWorker = isTranscriptionWorkerConfigured();

  if (useWorker) {
    after(async () => {
      try {
        const result = await dispatchTranscriptionJob(id);
        if (!result.ok) {
          console.error("[complete-upload] worker dispatch failed", result);
        }
      } catch (err) {
        console.error(
          "[complete-upload] worker dispatch error",
          err instanceof Error ? err.message : err,
        );
      }
    });

    return NextResponse.json({
      ok: true,
      status: "queued",
      processor: "worker",
    });
  }

  // Fallback: short-file path on Vercel when the Fly worker is not configured.
  const origin = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") ?? "";

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

  return NextResponse.json({
    ok: true,
    status: "queued",
    processor: "vercel",
  });
}
