import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDownloadUrl, isR2Configured } from "@/lib/r2";

type Params = { params: Promise<{ id: string }> };

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
  // playback: prefer extracted mono audio, fall back to original (mp4/mp3).
  const kinds =
    kindParam === "playback"
      ? ["extracted_audio", "original"]
      : [kindParam];

  const admin = createAdminClient();
  let media: {
    object_key: string;
    expires_at: string | null;
    kind: string;
  } | null = null;

  for (const kind of kinds) {
    const { data } = await admin
      .from("media_assets")
      .select("object_key, expires_at, kind")
      .eq("transcript_id", id)
      .eq("user_id", user.id)
      .eq("kind", kind)
      .is("deleted_at", null)
      .maybeSingle();
    if (data) {
      media = data;
      break;
    }
  }

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  if (media.expires_at && new Date(media.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Original media has expired" },
      { status: 410 },
    );
  }

  const url = await createDownloadUrl({ objectKey: media.object_key });
  return NextResponse.json({
    url,
    kind: media.kind,
    expiresAt: media.expires_at,
  });
}
