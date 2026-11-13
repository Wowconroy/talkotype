import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    completed_transcripts?: boolean;
    free_quota_resets?: boolean;
    product_updates?: boolean;
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notification_settings")
    .upsert(
      {
        user_id: user.id,
        completed_transcripts: body.completed_transcripts ?? true,
        free_quota_resets: body.free_quota_resets ?? true,
        product_updates: body.product_updates ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ notifications: data });
}
