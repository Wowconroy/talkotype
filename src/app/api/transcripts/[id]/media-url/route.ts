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
  const kind =
    new URL(request.url).searchParams.get("kind") ?? "original";

  const admin = createAdminClient();
  const { data: media } = await admin
    .from("media_assets")
    .select("*")
    .eq("transcript_id", id)
    .eq("user_id", user.id)
    .eq("kind", kind)
    .is("deleted_at", null)
    .maybeSingle();

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
  return NextResponse.json({ url, expiresAt: media.expires_at });
}
