import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaddleServer } from "@/lib/paddle/server";

/** Authenticated Paddle Customer Portal session (invoices, payment method, cancel). */
export async function POST() {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("plan, paddle_customer_id, paddle_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const customerId = profile?.paddle_customer_id?.trim();
  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "Billing portal unlocks after your first Paddle payment. Complete checkout first.",
      },
      { status: 400 },
    );
  }

  try {
    const paddle = getPaddleServer();
    const subscriptionId = profile?.paddle_subscription_id?.trim();
    const session = await paddle.customerPortalSessions.create(
      customerId,
      subscriptionId ? [subscriptionId] : undefined,
    );

    const overview = session.urls?.general?.overview;
    if (!overview) {
      return NextResponse.json(
        { error: "Paddle did not return a portal URL." },
        { status: 502 },
      );
    }

    const subscriptionUrls = session.urls?.subscriptions?.[0];

    return NextResponse.json({
      url: overview,
      cancelUrl: subscriptionUrls?.cancelSubscription ?? null,
      updatePaymentUrl:
        subscriptionUrls?.updateSubscriptionPaymentMethod ?? null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not open billing portal.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
