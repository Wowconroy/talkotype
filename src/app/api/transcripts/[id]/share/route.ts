import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

function siteOrigin(request: Request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  return new URL(request.url).origin;
}

export async function GET(request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("transcripts")
    .select("id, title, share_token, share_enabled, share_created_at")
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

  const shareUrl =
    data.share_enabled && data.share_token
      ? `${siteOrigin(request)}/share/${data.share_token}`
      : null;

  return NextResponse.json({
    share: {
      enabled: Boolean(data.share_enabled && data.share_token),
      token: data.share_token,
      url: shareUrl,
      createdAt: data.share_created_at,
    },
  });
}

/** Enable (or re-enable) a public share link. */
export async function POST(request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("transcripts")
    .select("id, share_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token =
    existing.share_token || randomBytes(18).toString("base64url");

  const { data, error } = await admin
    .from("transcripts")
    .update({
      share_token: token,
      share_enabled: true,
      share_created_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, share_token, share_enabled, share_created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not enable sharing" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    share: {
      enabled: true,
      token: data.share_token,
      url: `${siteOrigin(request)}/share/${data.share_token}`,
      createdAt: data.share_created_at,
    },
  });
}

/** Disable public access (token kept for stable re-enable). */
export async function DELETE(_request: Request, { params }: Params) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("transcripts")
    .update({ share_enabled: false })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
