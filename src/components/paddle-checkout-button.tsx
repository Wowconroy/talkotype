"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { loadPaddle } from "@/lib/paddle/browser";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Props = {
  interval: "monthly" | "yearly";
  className?: string;
  children: ReactNode;
  /** Where to send logged-out users before checkout. */
  loginNext?: string;
};

export function PaddleCheckoutButton({
  interval,
  className,
  children,
  loginNext = "/pricing",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const user = await getSessionUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(loginNext)}`);
        return;
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.plan === "unlimited") {
          router.push("/account");
          return;
        }
      }

      const priceId =
        interval === "yearly"
          ? process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY?.trim()
          : process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY?.trim();

      if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() || !priceId) {
        throw new Error(
          "Paddle sandbox is not configured yet. Add client token + price ids.",
        );
      }

      const paddle = await loadPaddle();
      if (!paddle) {
        throw new Error("Could not load Paddle.js");
      }

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: user.email },
        customData: { user_id: user.id },
        settings: {
          successUrl: `${window.location.origin}/account?upgraded=1`,
          allowLogout: false,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={busy}
        onClick={() => void startCheckout()}
        className={className}
      >
        {busy ? "Opening checkout…" : children}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs text-coral">{error}</p>
      ) : null}
    </div>
  );
}
