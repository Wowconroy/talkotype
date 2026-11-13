"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, InfinityIcon } from "lucide-react";
import { clearSession, getSessionUser, type TalkotypeUser } from "@/lib/auth";
import {
  resolveDisplayName,
  setCachedDisplayName,
} from "@/lib/display-name";
import { createClient } from "@/lib/supabase/client";
import type { AccountBootstrapPayload } from "@/lib/account-data";
import { FREE_DAILY_TRANSCRIPTS } from "@/lib/plan-limits";

const PaddleCheckoutButton = dynamic(
  () =>
    import("@/components/paddle-checkout-button").then(
      (m) => m.PaddleCheckoutButton,
    ),
  { ssr: false },
);

const FREE_DAILY_LIMIT = FREE_DAILY_TRANSCRIPTS;

type AccountView = {
  email: string;
  name: string;
  provider: TalkotypeUser["provider"];
  plan: "free" | "unlimited";
  billingInterval: "monthly" | "yearly" | "none";
  dailyUsed: number;
  notifications: {
    completedTranscripts: boolean;
    freeQuotaResets: boolean;
    productUpdates: boolean;
  };
  invoices: Array<{
    id: string;
    label: string;
    amountLabel: string;
    url?: string | null;
  }>;
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? "bg-coral" : "bg-ink/20"
      }`}
    >
      <span
        className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition ${
          checked ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

function mapAccountPayload(payload: AccountBootstrapPayload): AccountView {
  const profile = payload.profile as {
    email: string;
    display_name?: string | null;
    provider?: string;
    plan?: string;
    billing_interval?: string;
  };
  const invoices = payload.invoices as Array<{
    id: string;
    label?: string | null;
    amount_cents: number;
    currency: string;
    invoice_url?: string | null;
  }>;

  return {
    email: profile.email,
    name: profile.display_name || profile.email.split("@")[0],
    provider: profile.provider === "google" ? "google" : "email",
    plan: profile.plan === "unlimited" ? "unlimited" : "free",
    billingInterval:
      profile.billing_interval === "yearly" ||
      profile.billing_interval === "monthly"
        ? profile.billing_interval
        : "none",
    dailyUsed: payload.dailyUsage.transcripts_used ?? 0,
    notifications: {
      completedTranscripts: payload.notifications.completed_transcripts,
      freeQuotaResets: payload.notifications.free_quota_resets,
      productUpdates: payload.notifications.product_updates,
    },
    invoices: (invoices ?? []).map((invoice) => ({
      id: invoice.id,
      label: invoice.label || "Invoice",
      amountLabel: `${(invoice.amount_cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: (invoice.currency || "usd").toUpperCase(),
      })}`,
      url: invoice.invoice_url,
    })),
  };
}

export function AccountSettings({
  initial,
}: {
  initial?: AccountBootstrapPayload;
}) {
  const router = useRouter();
  const initialMapped = initial ? mapAccountPayload(initial) : null;
  const initialUserId =
    typeof initial?.profile?.id === "string" ? initial.profile.id : null;
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [account, setAccount] = useState<AccountView | null>(initialMapped);
  const [ready, setReady] = useState(Boolean(initialMapped));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState(initialMapped?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  async function load() {
    const session = await getSessionUser();
    if (!session) {
      router.replace("/login?next=/account");
      return;
    }
    setUserId(session.id);
    setAccount((prev) => {
      if (prev) return prev;
      const cachedName = resolveDisplayName(session.id, session.name);
      const shell: AccountView = {
        email: session.email,
        name: cachedName,
        provider: session.provider,
        plan: "free",
        billingInterval: "none",
        dailyUsed: 0,
        notifications: {
          completedTranscripts: true,
          freeQuotaResets: true,
          productUpdates: true,
        },
        invoices: [],
      };
      setNameDraft(shell.name);
      return shell;
    });
    setReady(true);

    const res = await fetch("/api/account", { credentials: "same-origin" });
    if (!res.ok) {
      setError("Could not load account.");
      return;
    }
    const payload = (await res.json()) as AccountBootstrapPayload;
    const mapped = mapAccountPayload(payload);
    setCachedDisplayName(session.id, mapped.name);
    setAccount(mapped);
    setNameDraft(mapped.name);
  }

  useEffect(() => {
    const checkUpgradeBanner = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (params.get("upgraded") !== "1") return;
      setMessage(
        "Thanks — if Paddle confirms the payment, Unlimited unlocks within a few seconds. Refresh if the plan hasn’t flipped yet.",
      );
      window.history.replaceState({}, "", "/account");
      window.setTimeout(() => void load(), 2500);
    };

    if (initialMapped) {
      void getSessionUser().then((session) => {
        if (!session) {
          router.replace("/login?next=/account");
          return;
        }
        setUserId(session.id);
        setCachedDisplayName(session.id, initialMapped.name);
      });
      checkUpgradeBanner();
      return;
    }

    void load().then(checkUpgradeBanner);
    // SSR initial paint — only client-fetch when no server bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!ready || !account) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-20 text-sm text-muted-foreground">
        Loading your settings…
      </div>
    );
  }

  const used = account.plan === "free" ? account.dailyUsed : 0;
  const limit = account.plan === "free" ? FREE_DAILY_LIMIT : null;
  const progress =
    limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const avatarLetter = (account.name || account.email || "T")
    .slice(0, 1)
    .toUpperCase();

  async function openBillingPortal() {
    setPortalBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not open billing portal.");
      }
      // Paddle hosts the portal (no return-to-app button). Keep Talkotype open.
      // Do NOT use window.open(..., "noopener") + null-check: browsers return null
      // even when the tab opens, which used to also navigate this page to Paddle.
      const tab = window.open("about:blank", "_blank");
      if (tab) {
        tab.opener = null;
        tab.location.href = data.url;
        setMessage("Billing portal opened in a new tab. This page stays here.");
      } else {
        setError(
          "Pop-up blocked — allow pop-ups for Talkotype, then try Manage plan again.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not open billing portal.",
      );
    } finally {
      setPortalBusy(false);
    }
  }

  async function saveDisplayName() {
    if (!account) return;
    const next = nameDraft.trim().replace(/\s+/g, " ");
    if (!next || next === account.name) return;
    setSavingName(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: next }),
    });
    setSavingName(false);
    if (!res.ok) {
      setError("Could not save your name.");
      return;
    }
    const payload = await res.json();
    const name =
      payload.profile?.display_name ||
      next;
    if (userId) setCachedDisplayName(userId, name);
    setAccount({ ...account, name });
    setNameDraft(name);
    setMessage("Name updated.");
  }

  async function saveNotification(
    key: keyof AccountView["notifications"],
    value: boolean,
  ) {
    if (!account) return;
    const next = {
      ...account.notifications,
      [key]: value,
    };
    setAccount({ ...account, notifications: next });
    const res = await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed_transcripts: next.completedTranscripts,
        free_quota_resets: next.freeQuotaResets,
        product_updates: next.productUpdates,
      }),
    });
    if (!res.ok) {
      setError("Could not save notification settings.");
      void load();
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      "Delete your Talkotype account? This signs you out. Contact support if you need full data erasure.",
    );
    if (!ok) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    await clearSession();
    router.replace("/");
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(-45deg,transparent,transparent_14px,rgba(18,61,58,0.03)_14px,rgba(18,61,58,0.03)_15px)]"
      />

      <div className="mx-auto w-full max-w-xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-6 flex justify-center">
          <span className="grid size-14 place-items-center rounded-full bg-coral shadow-[0_14px_30px_rgba(255,92,69,0.28)]">
            <InfinityIcon className="size-7 text-white" aria-hidden />
          </span>
        </div>

        <div className="rounded-[1.6rem] border border-border/80 bg-white p-6 shadow-[0_24px_50px_rgba(18,61,58,0.08)] sm:p-8">
          <h1 className="text-center font-display text-3xl font-semibold tracking-tight text-ink">
            Account Settings
          </h1>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Your Plan
            </h2>
            <div className="mt-3 rounded-2xl bg-ink px-5 py-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">
                    Talkotype{" "}
                    {account.plan === "unlimited" ? "Unlimited" : "Free"}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {account.plan === "free"
                      ? `${used} of ${FREE_DAILY_LIMIT} daily transcriptions used.`
                      : account.billingInterval === "yearly"
                        ? "$14 / month · billed yearly via Paddle"
                        : "$20 / month · billed monthly via Paddle"}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-sea transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {account.plan === "unlimited" ? (
                <button
                  type="button"
                  disabled={portalBusy}
                  onClick={() => void openBillingPortal()}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold uppercase tracking-wide text-coral transition hover:bg-blush disabled:opacity-70"
                >
                  <InfinityIcon className="size-4" />
                  {portalBusy ? "Opening portal…" : "Manage plan"}
                </button>
              ) : (
                <PaddleCheckoutButton
                  interval="monthly"
                  loginNext="/account"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold uppercase tracking-wide text-coral transition hover:bg-blush disabled:opacity-70"
                >
                  <InfinityIcon className="size-4" />
                  Go Unlimited
                </PaddleCheckoutButton>
              )}
            </div>

            <div className="mt-3">
              {account.invoices.length === 0 ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="size-4" />
                  No invoices yet — they appear after Unlimited billing (Paddle).
                </p>
              ) : (
                <ul className="space-y-2">
                  {account.invoices.map((invoice) => (
                    <li key={invoice.id}>
                      {invoice.url ? (
                        <a
                          href={invoice.url}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-coral hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="size-4" />
                          Download invoice · {invoice.amountLabel}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                          <Download className="size-4" />
                          {invoice.label} · {invoice.amountLabel}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Profile
            </h2>
            <div className="mt-3 rounded-2xl bg-mist px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-coral font-display text-lg font-semibold text-white">
                  {avatarLetter}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    Logged in with{" "}
                    {account.provider === "google" ? "Google account" : "email"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {account.email}
                  </p>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-ink">
                  Display name
                </span>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={nameDraft}
                    maxLength={80}
                    onChange={(event) => setNameDraft(event.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none ring-coral/30 focus:ring-2"
                    placeholder="How should we greet you?"
                  />
                  <button
                    type="button"
                    disabled={
                      savingName ||
                      !nameDraft.trim() ||
                      nameDraft.trim() === account.name
                    }
                    onClick={() => void saveDisplayName()}
                    className="shrink-0 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff6f5b] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingName ? "Saving…" : "Save"}
                  </button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Shown in your desk greeting. You can change it anytime.
                </p>
              </label>
              {message ? (
                <p className="mt-2 text-sm font-medium text-sea">{message}</p>
              ) : null}
              {error ? (
                <p className="mt-2 text-sm font-medium text-coral">{error}</p>
              ) : null}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Email Settings
            </h2>
            <ul className="mt-3 divide-y divide-border/70 rounded-2xl border border-border/70 bg-white">
              {(
                [
                  {
                    key: "completedTranscripts" as const,
                    title: "Completed Transcripts",
                    copy: "Let me know when my transcripts are ready.",
                  },
                  {
                    key: "freeQuotaResets" as const,
                    title: "Free Tier Quota Resets",
                    copy: "Let me know when I can transcribe more files for free.",
                  },
                  {
                    key: "productUpdates" as const,
                    title: "Product Updates and New Features",
                    copy: "Let me know about product updates and new features.",
                  },
                ] as const
              ).map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-4 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.copy}
                    </p>
                  </div>
                  <Toggle
                    checked={account.notifications[item.key]}
                    label={item.title}
                    onChange={(value) => void saveNotification(item.key, value)}
                  />
                </li>
              ))}
            </ul>
          </section>

          {(message || error) && (
            <p
              className={`mt-5 rounded-xl px-3 py-2 text-sm ${
                error ? "bg-coral/10 text-coral" : "bg-secondary text-ink"
              }`}
            >
              {error || message}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/app"
            className="text-sm font-semibold text-ink/70 hover:text-ink"
          >
            ← Back to desk
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="text-sm font-semibold text-muted-foreground hover:text-coral"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
