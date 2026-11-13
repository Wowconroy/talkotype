import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lightweight desk poll while jobs are active.
 * Avoids reloading folders/profile/usage + exact counts every 2s.
 */
export async function GET() {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from("transcripts")
    .select(
      "id, status, updated_at, active_job_id, active_job:transcription_jobs!active_job_id(stage, progress_pct, status)",
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .in("status", ["queued", "processing"])
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    // Fallback without embed if the FK alias is unavailable.
    const { data: plain, error: plainError } = await admin
      .from("transcripts")
      .select("id, status, updated_at, active_job_id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .in("status", ["queued", "processing"])
      .order("updated_at", { ascending: false })
      .limit(40);

    if (plainError) {
      return NextResponse.json(
        { error: plainError.message || error.message },
        { status: 500 },
      );
    }

    const jobIds = (plain ?? [])
      .map((row) => row.active_job_id as string | null)
      .filter((id): id is string => Boolean(id));

    let jobById = new Map<
      string,
      { stage: string | null; progress_pct: number | null; status: string | null }
    >();
    if (jobIds.length > 0) {
      const { data: jobs } = await admin
        .from("transcription_jobs")
        .select("id, stage, progress_pct, status")
        .in("id", jobIds);
      jobById = new Map(
        (jobs ?? []).map((job) => [
          job.id as string,
          {
            stage: (job.stage as string | null) ?? null,
            progress_pct:
              typeof job.progress_pct === "number" ? job.progress_pct : null,
            status: (job.status as string | null) ?? null,
          },
        ]),
      );
    }

    return NextResponse.json({
      items: (plain ?? []).map((row) => {
        const meta = row.active_job_id
          ? jobById.get(row.active_job_id as string)
          : null;
        return {
          id: row.id as string,
          status: row.status as string,
          updated_at: row.updated_at as string,
          job_stage: meta?.stage ?? null,
          progress_pct: meta?.progress_pct ?? null,
        };
      }),
    });
  }

  const items = (rows ?? []).map((row) => {
    const jobRaw = row.active_job as
      | { stage?: string | null; progress_pct?: number | null }
      | { stage?: string | null; progress_pct?: number | null }[]
      | null;
    const job = Array.isArray(jobRaw) ? jobRaw[0] : jobRaw;
    return {
      id: row.id as string,
      status: row.status as string,
      updated_at: row.updated_at as string,
      job_stage: job?.stage ?? null,
      progress_pct:
        typeof job?.progress_pct === "number" ? job.progress_pct : null,
    };
  });

  return NextResponse.json({ items });
}
