"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  InfinityIcon,
  Mail,
} from "lucide-react";
import {
  FREE_DAILY_LIMIT,
  changeEmailLocal,
  deleteAccountLocal,
  ensureAccount,
  updateNotifications,
  type AccountRecord,
} from "@/lib/account-settings";
import {
  clearSession,
  getSessionUser,
  type TalkotypeUser,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

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

export function AccountSettings() {
  const router = useRouter();
  const [user, setUser] = useState<TalkotypeUser | null>(null);
  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSessionUser();
    if (!session) {
      router.replace("/login");
      return;
    }
    const record = ensureAccount(session);
    setUser(session);
    setAccount(record);
    setEmailDraft(record.email);
    setReady(true);

    const sync = () => {
      const next = getSessionUser();
      if (!next) {
        router.replace("/login");
        return;
      }
      setUser(next);
      setAccount(ensureAccount(next));
    };
    window.addEventListener("talkotype-auth", sync);
    window.addEventListener("talkotype-account", sync);
    return () => {
      window.removeEventListener("talkotype-auth", sync);
      window.removeEventListener("talkotype-account", sync);
    };
  }, [router]);

  if (!ready || !user || !account) {
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
  const initial = (account.name || account.email || "T").slice(0, 1).toUpperCase();

  function refresh() {
    const session = getSessionUser();
    if (!session) return;
    setAccount(ensureAccount(session));
    setUser(session);
  }

  function saveNotification(
    key: keyof AccountRecord["notifications"],
    value: boolean,
  ) {
    updateNotifications(user!.id, { [key]: value });
    refresh();
  }

  function handleChangeEmail() {
    setError(null);
    setMessage(null);
    try {
      changeEmailLocal(user!.id, emailDraft);
      setEditingEmail(false);
      setMessage("Email updated.");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update email.");
    }
  }

  function handleDelete() {
    const ok = window.confirm(
      "Delete your Talkotype account? This clears your local account data and signs you out.",
    );
    if (!ok) return;
    deleteAccountLocal(user!.id);
    clearSession();
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

          {!isSupabaseConfigured() ? (
            <p className="mt-3 rounded-xl bg-lemon/70 px-3 py-2 text-center text-xs leading-relaxed text-ink/80">
              Settings are saved on this device for now. Connect the new
              Talkotype Supabase project to sync accounts, invoices, and
              transcripts across devices.
            </p>
          ) : null}

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
                        ? "$8.40 / month · billed yearly"
                        : "$12 / month · billed monthly"}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-sea transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <Link
                href="/pricing"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold uppercase tracking-wide text-coral transition hover:bg-blush"
              >
                <InfinityIcon className="size-4" />
                {account.plan === "unlimited" ? "Manage plan" : "Go Unlimited"}
              </Link>
            </div>

            <div className="mt-3">
              {account.invoices.length === 0 ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="size-4" />
                  No invoices yet — they appear after Unlimited billing.
                </p>
              ) : (
                <ul className="space-y-2">
                  {account.invoices.map((invoice) => (
                    <li key={invoice.id}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-coral hover:underline"
                        onClick={() =>
                          setMessage(
                            `Invoice “${invoice.label}” (${invoice.amountLabel}) is ready once Stripe is connected.`,
                          )
                        }
                      >
                        <Download className="size-4" />
                        Download invoice · {invoice.amountLabel}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Email Address
            </h2>
            <div className="mt-3 rounded-2xl bg-mist px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-coral font-display text-lg font-semibold text-white">
                  {initial}
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

              {editingEmail ? (
                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    New email
                    <input
                      value={emailDraft}
                      onChange={(event) => setEmailDraft(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none ring-coral/30 focus:ring-2"
                      type="email"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEmail(false);
                        setEmailDraft(account.email);
                      }}
                      className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-coral">
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() =>
                      setMessage(
                        account.provider === "google"
                          ? "Password login arrives with Supabase Auth — Google stays available."
                          : "You’re already on password login.",
                      )
                    }
                  >
                    {account.provider === "google"
                      ? "Switch to Password Login"
                      : "Password login active"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline"
                    onClick={() => setEditingEmail(true)}
                  >
                    <Mail className="size-3.5" />
                    Change Email
                  </button>
                </div>
              )}
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
                    onChange={(value) => saveNotification(item.key, value)}
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
            onClick={handleDelete}
            className="text-sm font-semibold text-muted-foreground hover:text-coral"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
