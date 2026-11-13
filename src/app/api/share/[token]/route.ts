import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("transcripts")
    .select(
      "id, title, transcript_text, duration_seconds, created_at, user_id, share_enabled, share_token",
    )
    .eq("share_token", token)
    .eq("share_enabled", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email, display_name")
    .eq("id", data.user_id)
    .maybeSingle();

  return NextResponse.json({
    transcript: {
      title: data.title,
      transcript_text: data.transcript_text,
      duration_seconds: data.duration_seconds,
      created_at: data.created_at,
    },
    owner: {
      email: profile?.email ?? null,
      display_name: profile?.display_name ?? null,
    },
  });
}
