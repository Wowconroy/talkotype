"use client";

import {
  initializePaddle,
  type Paddle,
  type Environments,
} from "@paddle/paddle-js";

let paddlePromise: Promise<Paddle | undefined> | null = null;

export function getBrowserPaddleEnv(): Environments {
  const raw = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox").toLowerCase();
  return raw === "production" ? "production" : "sandbox";
}

export function loadPaddle(): Promise<Paddle | undefined> {
  if (paddlePromise) return paddlePromise;

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
  if (!token) {
    return Promise.resolve(undefined);
  }

  paddlePromise = initializePaddle({
    environment: getBrowserPaddleEnv(),
    token,
  });

  return paddlePromise;
}
