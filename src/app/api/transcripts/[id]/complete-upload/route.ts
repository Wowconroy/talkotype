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

  // Mark "starting" immediately so the desk isn't stuck at 0% while
  // Vercel `after()` / worker dispatch warms up.
  if (transcript.active_job_id) {
    await admin
      .from("transcription_jobs")
      .update({
        status: "queued",
        stage: "starting",
        progress_pct: 3,
        started_at: null,
        updated_at: new Date().toISOString(),
        error_message: null,
        error_code: null,
      })
      .eq("id", transcript.active_job_id);
  }

  await admin
    .from("transcripts")
    .update({ status: "queued", updated_at: new Date().toISOString() })
    .eq("id", id);

  const origin = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") ?? "";

  async function kickVercelProcess() {
    const processRes = await fetch(`${origin}/api/transcripts/${id}/process`, {
      method: "POST",
      headers: { cookie },
      signal: AbortSignal.timeout(290_000),
    });
    if (!processRes.ok) {
      const body = await processRes.text().catch(() => "");
      console.error(
        "[complete-upload] process failed",
        processRes.status,
        body.slice(0, 300),
      );
    }
  }

  const useWorker = isTranscriptionWorkerConfigured();

  if (useWorker) {
    after(async () => {
      try {
        const result = await dispatchTranscriptionJob(id);
        if (!result.ok) {
          console.error(
            "[complete-upload] worker dispatch failed — falling back to Vercel",
            result,
          );
          await kickVercelProcess();
        }
      } catch (err) {
        console.error(
          "[complete-upload] worker dispatch error — falling back to Vercel",
          err instanceof Error ? err.message : err,
        );
        try {
          await kickVercelProcess();
        } catch (fallbackErr) {
          console.error(
            "[complete-upload] Vercel fallback failed",
            fallbackErr instanceof Error ? fallbackErr.message : fallbackErr,
          );
        }
      }
    });

    return NextResponse.json({
      ok: true,
      status: "queued",
      processor: "worker",
    });
  }

  // Fallback: process on Vercel when the Fly worker is not configured.
  after(async () => {
    try {
      await kickVercelProcess();
    } catch (err) {
      console.error(
        "[complete-upload] process kickoff error",
        err instanceof Error ? err.message : err,
      );
    }
  });

  return NextResponse.json({
    ok: true,
    status: "queued",
    processor: "vercel",
  });
}
