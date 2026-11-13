import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteTranscriptStorage, isR2Configured } from "@/lib/r2";

export type ExpiredMediaRow = {
  id: string;
  transcript_id: string;
  user_id: string;
  object_key: string;
  expires_at: string;
};

export type PurgeExpiredMediaResult = {
  scanned: number;
  transcripts: number;
  r2Deleted: number;
  mediaMarked: number;
  errors: Array<{ transcriptId: string; message: string }>;
};

const DEFAULT_BATCH = 100;

/**
 * Delete R2 objects + mark media_assets expired for rows past expires_at.
 * Transcript text stays; only original/extracted media is wiped.
 */
export async function purgeExpiredMedia(
  admin: SupabaseClient,
  options?: { limit?: number; now?: Date },
): Promise<PurgeExpiredMediaResult> {
  const limit = Math.min(Math.max(options?.limit ?? DEFAULT_BATCH, 1), 500);
  const nowIso = (options?.now ?? new Date()).toISOString();

  const { data: expired, error } = await admin
    .from("media_assets")
    .select("id, transcript_id, user_id, object_key, expires_at")
    .is("deleted_at", null)
    .not("expires_at", "is", null)
    .lte("expires_at", nowIso)
    .order("expires_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (expired ?? []) as ExpiredMediaRow[];
  const byTranscript = new Map<
    string,
    { userId: string; keys: string[] }
  >();

  for (const row of rows) {
    const current = byTranscript.get(row.transcript_id) ?? {
      userId: row.user_id,
      keys: [],
    };
    if (row.object_key) current.keys.push(row.object_key);
    byTranscript.set(row.transcript_id, current);
  }

  let r2Deleted = 0;
  let mediaMarked = 0;
  const errors: PurgeExpiredMediaResult["errors"] = [];

  for (const [transcriptId, { userId, keys }] of byTranscript) {
    try {
      // Pull sibling assets (e.g. extracted_audio without its own expires_at).
      const { data: siblings } = await admin
        .from("media_assets")
        .select("object_key")
        .eq("transcript_id", transcriptId)
        .is("deleted_at", null);

      const objectKeys = [
        ...new Set(
          [
            ...keys,
            ...(siblings ?? []).map((s) => s.object_key as string),
          ].filter(Boolean),
        ),
      ];

      if (isR2Configured()) {
        const wiped = await deleteTranscriptStorage({
          userId,
          transcriptId,
          objectKeys,
        });
        r2Deleted += wiped.deleted;
      }

      const { data: marked, error: markError } = await admin
        .from("media_assets")
        .update({
          deleted_at: nowIso,
          status: "expired",
        })
        .eq("transcript_id", transcriptId)
        .is("deleted_at", null)
        .select("id");

      if (markError) {
        throw new Error(markError.message);
      }
      mediaMarked += marked?.length ?? 0;

      // Clear legacy path so desk doesn't point at a missing object.
      await admin
        .from("transcripts")
        .update({ storage_path: null })
        .eq("id", transcriptId)
        .eq("user_id", userId);
    } catch (err) {
      errors.push({
        transcriptId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    scanned: rows.length,
    transcripts: byTranscript.size,
    r2Deleted,
    mediaMarked,
    errors,
  };
}
