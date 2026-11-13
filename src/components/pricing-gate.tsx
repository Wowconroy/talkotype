"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useViewerPlan } from "@/lib/use-viewer-plan";

/** Sends Unlimited subscribers away from /pricing to manage their plan. */
export function PricingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, isPaid } = useViewerPlan();

  useEffect(() => {
    if (ready && isPaid) {
      router.replace("/account");
    }
  }, [ready, isPaid, router]);

  if (ready && isPaid) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center text-sm text-muted-foreground">
        Taking you to your plan…
      </div>
    );
  }

  return <>{children}</>;
}
