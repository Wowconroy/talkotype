import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteTranscriptStorage, isR2Configured } from "@/lib/r2";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("transcripts")
    .select("*, media_assets(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [{ data: segments }, { data: speakers }] = await Promise.all([
    admin
      .from("transcript_segments")
      .select("segment_index, start_ms, end_ms, text, speaker_id")
      .eq("transcript_id", id)
      .order("segment_index", { ascending: true }),
    admin
      .from("transcript_speakers")
      .select("id, speaker_index, label")
      .eq("transcript_id", id)
      .order("speaker_index", { ascending: true }),
  ]);

  return NextResponse.json({
    transcript: {
      ...data,
      segments: segments ?? [],
      speakers: speakers ?? [],
    },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { user, supabase } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    title?: string;
    transcript_text?: string;
    requested_language?: string;
    folder_id?: string | null;
  };

  const patch: Record<string, string | null> = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.transcript_text === "string") {
    patch.transcript_text = body.transcript_text;
  }
  if (typeof body.requested_language === "string") {
    patch.requested_language = body.requested_language;
  }
  if (body.folder_id === null) {
    patch.folder_id = null;
  } else if (typeof body.folder_id === "string") {
    patch.folder_id = body.folder_id;
  }

  const { data, error } = await supabase
    .from("transcripts")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ transcript: data });
}

/** Explicit child wipe when hard_delete_transcript RPC is missing / outdated. */
async function hardDeleteTranscriptFallback(
  admin: ReturnType<typeof createAdminClient>,
  params: { transcriptId: string; userId: string },
) {
  const { transcriptId, userId } = params;

  // Break circular FK: transcripts.active_job_id → transcription_jobs.
  await admin
    .from("transcripts")
    .update({ active_job_id: null })
    .eq("id", transcriptId)
    .eq("user_id", userId);

  await admin
    .from("transcription_chunks")
    .delete()
    .eq("transcript_id", transcriptId);
  await admin
    .from("transcription_jobs")
    .delete()
    .eq("transcript_id", transcriptId);
  await admin
    .from("transcript_segments")
    .delete()
    .eq("transcript_id", transcriptId);
  await admin
    .from("transcript_speakers")
    .delete()
    .eq("transcript_id", transcriptId);
  await admin.from("media_assets").delete().eq("transcript_id", transcriptId);

  const { error } = await admin
    .from("transcripts")
    .delete()
    .eq("id", transcriptId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: owned } = await admin
    .from("transcripts")
    .select("id, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [{ data: assets }, { data: chunks }] = await Promise.all([
    admin
      .from("media_assets")
      .select("object_key")
      .eq("transcript_id", id)
      .eq("user_id", user.id),
    admin
      .from("transcription_chunks")
      .select("output_object_key")
      .eq("transcript_id", id),
  ]);

  const objectKeys = [
    ...new Set(
      [
        ...(assets ?? []).map((a) => a.object_key as string),
        ...(chunks ?? []).map((c) => c.output_object_key as string | null),
        typeof owned.storage_path === "string" ? owned.storage_path : null,
      ].filter((k): k is string => Boolean(k)),
    ),
  ];

  // 1) Wipe object storage (R2) for this transcript prefix + known keys.
  if (isR2Configured()) {
    try {
      await deleteTranscriptStorage({
        userId: user.id,
        transcriptId: id,
        objectKeys,
      });
    } catch {
      // Still remove DB rows — stuck delete UX is worse than rare orphaned objects.
    }
  }

  // 2) Wipe all related Postgres rows (jobs, chunks, segments, speakers, media, transcript).
  const { data: deletedId, error } = await admin.rpc("hard_delete_transcript", {
    p_transcript_id: id,
  });

  if (error || !deletedId) {
    try {
      await hardDeleteTranscriptFallback(admin, {
        transcriptId: id,
        userId: user.id,
      });
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Could not delete transcript",
        },
        { status: 400 },
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: profile }, { data: usage }] = await Promise.all([
    admin.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    admin
      .from("daily_usage")
      .select("transcripts_used, usage_date")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    deleted: true,
    id,
    quota: {
      transcripts_used: usage?.transcripts_used ?? 0,
      usage_date: usage?.usage_date ?? today,
      limit: profile?.plan === "unlimited" ? null : 3,
    },
  });
}
