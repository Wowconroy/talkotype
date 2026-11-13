import { createAdminClient } from "@/lib/supabase/admin";

type PaddleWebhookEvent = {
  eventId: string;
  eventType: string;
  data: object;
};

type CustomData = { user_id?: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function readCustomData(data: Record<string, unknown> | null): CustomData {
  const custom = asRecord(data?.custom_data) ?? asRecord(data?.customData);
  if (!custom) return {};
  const userId = custom.user_id ?? custom.userId;
  return {
    user_id: typeof userId === "string" ? userId : undefined,
  };
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function priceIntervalFromItems(data: Record<string, unknown> | null) {
  const items = Array.isArray(data?.items) ? data?.items : [];
  const monthly = process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY?.trim();
  const yearly = process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY?.trim();
  for (const item of items) {
    const row = asRecord(item);
    const price = asRecord(row?.price);
    const priceId =
      readString(row?.price_id) ||
      readString(row?.priceId) ||
      readString(price?.id);
    if (priceId && yearly && priceId === yearly) return "yearly" as const;
    if (priceId && monthly && priceId === monthly) return "monthly" as const;
  }
  return null;
}

function amountCentsFromData(data: Record<string, unknown> | null) {
  const details = asRecord(data?.details);
  const totals = asRecord(details?.totals) ?? asRecord(data?.details);
  const total =
    readString(totals?.total) ??
    readString(asRecord(data?.details)?.total) ??
    null;
  if (!total) return 0;
  const n = Number(total);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function currencyFromData(data: Record<string, unknown> | null) {
  const details = asRecord(data?.details);
  const totals = asRecord(details?.totals);
  return (
    readString(totals?.currency_code) ||
    readString(data?.currency_code) ||
    "USD"
  ).toLowerCase();
}

export async function processPaddleEvent(event: PaddleWebhookEvent) {
  const admin = createAdminClient();
  const eventType = event.eventType;
  const eventId = event.eventId;
  const data = asRecord(event.data) ?? {};

  if (eventId) {
    const { error: ledgerError } = await admin
      .from("billing_webhook_events")
      .insert({
        provider: "paddle",
        event_id: eventId,
        event_type: eventType,
        payload: event,
      });
    if (ledgerError?.code === "23505") {
      return { duplicate: true as const };
    }
  }

  const custom = readCustomData(data);
  let userId = custom.user_id ?? null;
  const customerId =
    readString(data.customer_id) || readString(data.customerId);
  const subscriptionId =
    readString(data.subscription_id) ||
    readString(data.subscriptionId) ||
    (eventType.startsWith("subscription.") ? readString(data.id) : null);
  const transactionId = eventType.startsWith("transaction.")
    ? readString(data.id)
    : readString(data.transaction_id) || readString(data.transactionId);

  if (!userId && customerId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("paddle_customer_id", customerId)
      .maybeSingle();
    userId = profile?.id ?? null;
  }

  const activates =
    eventType === "subscription.activated" ||
    eventType === "subscription.created" ||
    eventType === "subscription.updated" ||
    eventType === "transaction.completed" ||
    eventType === "transaction.paid";

  const cancels =
    eventType === "subscription.canceled" ||
    eventType === "subscription.cancelled";

  if (userId && (activates || cancels || customerId || subscriptionId)) {
    const patch: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };
    if (customerId) patch.paddle_customer_id = customerId;
    if (subscriptionId) patch.paddle_subscription_id = subscriptionId;

    if (cancels) {
      patch.plan = "free";
      patch.billing_interval = "none";
    } else if (activates) {
      patch.plan = "unlimited";
      const interval = priceIntervalFromItems(data);
      if (interval) patch.billing_interval = interval;
    }

    await admin.from("profiles").update(patch).eq("id", userId);
  }

  if (
    userId &&
    transactionId &&
    (eventType === "transaction.completed" ||
      eventType === "transaction.paid" ||
      eventType.startsWith("transaction."))
  ) {
    const externalId = eventId ?? transactionId;
    const { data: existing } = await admin
      .from("invoices")
      .select("id")
      .eq("external_id", externalId)
      .maybeSingle();

    if (!existing) {
      await admin.from("invoices").insert({
        user_id: userId,
        amount_cents: amountCentsFromData(data),
        currency: currencyFromData(data),
        status: "paid",
        paddle_transaction_id: transactionId,
        paddle_subscription_id: subscriptionId,
        external_id: externalId,
        label: eventType,
        invoice_url: readString(data.invoice_url) || readString(data.invoiceUrl),
      });
    }
  }

  return { duplicate: false as const };
}
