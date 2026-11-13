import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractAudioFile,
  isFfmpegAvailable,
  looksLikeVideo,
} from "@/lib/ffmpeg-local";
import {
  buildObjectKey,
  createDownloadUrl,
  getObjectBytes,
  isR2Configured,
  putObjectBytes,
} from "@/lib/r2";

type Params = { params: Promise<{ id: string }> };

export const maxDuration = 300;

type MediaRow = {
  object_key: string;
  expires_at: string | null;
  kind: string;
  content_type?: string | null;
  size_bytes?: number | null;
};

export async function GET(request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
  }

  const { id } = await params;
  const kindParam =
    new URL(request.url).searchParams.get("kind") ?? "original";
  const admin = createAdminClient();

  const loadKind = async (kind: string) => {
    const { data } = await admin
      .from("media_assets")
      .select("object_key, expires_at, kind, content_type, size_bytes")
      .eq("transcript_id", id)
      .eq("user_id", user.id)
      .eq("kind", kind)
      .is("deleted_at", null)
      .maybeSingle();
    return (data as MediaRow | null) ?? null;
  };

  const assertFresh = (row: MediaRow) => {
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Original media has expired" },
        { status: 410 },
      );
    }
    return null;
  };

  async function signed(row: MediaRow, extra?: Record<string, unknown>) {
    const expired = assertFresh(row);
    if (expired) return expired;
    const url = await createDownloadUrl({ objectKey: row.object_key });
    return NextResponse.json({
      url,
      kind: row.kind,
      contentType: row.content_type ?? null,
      expiresAt: row.expires_at,
      ...extra,
    });
  }

  if (kindParam === "playback") {
    const extracted = await loadKind("extracted_audio");
    if (extracted) return signed(extracted);

    const original = await loadKind("original");
    if (!original) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    const expired = assertFresh(original);
    if (expired) return expired;

    const { data: transcript } = await admin
      .from("transcripts")
      .select("source_filename")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    const filename =
      (transcript?.source_filename as string | undefined) ||
      original.object_key.split("/").pop() ||
      "audio.bin";
    const videoLike = looksLikeVideo({
      filename,
      contentType: original.content_type,
    });

    // Never play raw MP4/MOV for click-to-seek — browsers snap to keyframes
    // (click at 5:09 can start audio near 5:30). Always prepare mono MP3.
    const alreadySeekable =
      typeof original.content_type === "string" &&
      /^(audio\/(mpeg|mp3|mp4|x-m4a|m4a|wav|x-wav|flac|ogg|opus))/.test(
        original.content_type,
      ) &&
      !videoLike;

    if (!alreadySeekable && (await isFfmpegAvailable())) {
      try {
        const { bytes } = await getObjectBytes(original.object_key);
        const extractedFile = await extractAudioFile({
          sourceBytes: bytes,
          sourceFilename: filename,
        });
        if (extractedFile) {
          const extractedKey = buildObjectKey({
            userId: user.id,
            transcriptId: id,
            kind: "extracted_audio",
            filename: extractedFile.filename,
          });
          await putObjectBytes({
            objectKey: extractedKey,
            bytes: extractedFile.bytes,
            contentType: extractedFile.contentType,
          });
          await admin
            .from("media_assets")
            .delete()
            .eq("transcript_id", id)
            .eq("kind", "extracted_audio");
          await admin.from("media_assets").insert({
            transcript_id: id,
            user_id: user.id,
            kind: "extracted_audio",
            object_key: extractedKey,
            content_type: extractedFile.contentType,
            size_bytes: extractedFile.bytes.byteLength,
            expires_at: original.expires_at,
            status: "active",
          });
          return signed(
            {
              object_key: extractedKey,
              expires_at: original.expires_at,
              kind: "extracted_audio",
              content_type: extractedFile.contentType,
            },
            { prepared: true },
          );
        }
      } catch (err) {
        console.error(
          "[media-url] playback extract failed",
          err instanceof Error ? err.message : err,
        );
      }
      if (videoLike) {
        return NextResponse.json(
          {
            error:
              "Could not prepare seekable audio for this video. Try again in a moment.",
          },
          { status: 503 },
        );
      }
    }

    return signed(original);
  }

  const media = await loadKind(kindParam);
  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }
  return signed(media);
}
