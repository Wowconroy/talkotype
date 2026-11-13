import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { getPaddleEnv } from "./config";

let paddle: Paddle | null = null;

export function getPaddleServer() {
  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("PADDLE_API_KEY is not configured.");
  }
  if (!paddle) {
    paddle = new Paddle(apiKey, {
      environment:
        getPaddleEnv() === "production"
          ? Environment.production
          : Environment.sandbox,
    });
  }
  return paddle;
}

export function getPaddleWebhookSecret() {
  return (
    process.env.PADDLE_WEBHOOK_SECRET?.trim() ||
    process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET?.trim() ||
    ""
  );
}
