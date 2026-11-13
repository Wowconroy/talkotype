import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeExpiredMedia } from "@/lib/purge-expired-media";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Vercel Cron: wipe free-tier (and cancelled-plan) media past expires_at.
 * Transcript text remains exportable.
 */
export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await purgeExpiredMedia(admin);
    const status = result.errors.length > 0 ? 207 : 200;
    return NextResponse.json({ ok: result.errors.length === 0, ...result }, { status });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Purge failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
