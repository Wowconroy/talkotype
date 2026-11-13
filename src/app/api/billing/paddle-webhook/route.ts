import { NextResponse } from "next/server";
import { processPaddleEvent } from "@/lib/paddle/process-webhook";
import { getPaddleServer, getPaddleWebhookSecret } from "@/lib/paddle/server";

/**
 * Paddle Billing webhook (sandbox + live).
 * Destination URL: https://talkotype.app/api/billing/paddle-webhook
 */
export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();
  const secret = getPaddleWebhookSecret();

  if (!secret) {
    return NextResponse.json(
      { error: "Paddle webhook secret not configured" },
      { status: 503 },
    );
  }

  if (!signature || !rawBody) {
    return NextResponse.json(
      { error: "Missing signature or body" },
      { status: 400 },
    );
  }

  try {
    const paddle = getPaddleServer();
    const event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
    if (!event) {
      return NextResponse.json({ error: "Empty event" }, { status: 400 });
    }

    const result = await processPaddleEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("[paddle-webhook]", error);
    // Non-2xx so Paddle retries (bad secret deploy / transient DB).
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
