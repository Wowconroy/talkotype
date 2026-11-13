import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { reconcileFreeQuotaForUser } from "@/lib/desk-data";
import { ensureProfile } from "@/lib/ensure-profile";
import { createAdminClient } from "@/lib/supabase/admin";

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = utcToday();

  const [
    { data: existingProfile },
    { data: notifications },
    { data: invoices },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin
      .from("notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  let profile = existingProfile;
  if (!profile) {
    try {
      profile = await ensureProfile(user);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Could not sync profile.",
        },
        { status: 500 },
      );
    }
  }

  const plan = profile?.plan ?? "free";
  const dailyUsage =
    plan === "free"
      ? await reconcileFreeQuotaForUser(user.id)
      : {
          transcripts_used: 0,
          usage_date: today,
          limit: null as number | null,
        };

  return NextResponse.json({
    profile,
    notifications: notifications ?? {
      completed_transcripts: true,
      free_quota_resets: true,
      product_updates: true,
    },
    dailyUsage,
    invoices: invoices ?? [],
  });
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
