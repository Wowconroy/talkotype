import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { loadAccountBootstrap } from "@/lib/account-data";
import { ensureProfile } from "@/lib/ensure-profile";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await loadAccountBootstrap(user.id, user);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load account.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { display_name?: string };
  const displayName = (body.display_name ?? "").trim().replace(/\s+/g, " ");
  if (displayName.length < 1 || displayName.length > 80) {
    return NextResponse.json(
      { error: "Display name must be 1–80 characters." },
      { status: 400 },
    );
  }

  try {
    await ensureProfile(user);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not sync profile.",
      },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile });
}
