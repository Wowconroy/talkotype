export type PaddleEnv = "sandbox" | "production";

export function getPaddleEnv(): PaddleEnv {
  const raw = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox").toLowerCase();
  return raw === "production" ? "production" : "sandbox";
}

export function isPaddleConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() &&
      process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY?.trim() &&
      process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY?.trim(),
  );
}

export function getPaddlePriceId(interval: "monthly" | "yearly") {
  const id =
    interval === "yearly"
      ? process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY
      : process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY;
  return id?.trim() || null;
}
