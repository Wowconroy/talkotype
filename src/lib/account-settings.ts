import type { TalkotypeUser } from "@/lib/auth";

export type PlanTier = "free" | "unlimited";
export type BillingInterval = "monthly" | "yearly" | "none";

export type NotificationSettings = {
  completedTranscripts: boolean;
  freeQuotaResets: boolean;
  productUpdates: boolean;
};

export type AccountRecord = {
  userId: string;
  email: string;
  name: string;
  provider: TalkotypeUser["provider"];
  plan: PlanTier;
  billingInterval: BillingInterval;
  notifications: NotificationSettings;
  dailyUsed: number;
  dailyDate: string; // YYYY-MM-DD UTC
  invoices: InvoiceRecord[];
};

export type InvoiceRecord = {
  id: string;
  label: string;
  amountLabel: string;
  createdAt: string;
  url?: string;
};

const ACCOUNT_KEY = "talkotype_accounts";
export const FREE_DAILY_LIMIT = 3;

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readAll(): Record<string, AccountRecord> {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AccountRecord>) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, AccountRecord>) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event("talkotype-account"));
}

function defaultNotifications(): NotificationSettings {
  return {
    completedTranscripts: true,
    freeQuotaResets: true,
    productUpdates: true,
  };
}

export function ensureAccount(user: TalkotypeUser): AccountRecord {
  const all = readAll();
  const existing = all[user.id];
  const day = todayKey();

  if (existing) {
    const refreshed: AccountRecord = {
      ...existing,
      email: user.email,
      name: user.name,
      provider: user.provider,
      dailyUsed: existing.dailyDate === day ? existing.dailyUsed : 0,
      dailyDate: day,
    };
    all[user.id] = refreshed;
    writeAll(all);
    return refreshed;
  }

  const created: AccountRecord = {
    userId: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    plan: "free",
    billingInterval: "none",
    notifications: defaultNotifications(),
    dailyUsed: 0,
    dailyDate: day,
    invoices: [],
  };
  all[user.id] = created;
  writeAll(all);
  return created;
}

export function getAccount(userId: string): AccountRecord | null {
  return readAll()[userId] ?? null;
}

export function updateNotifications(
  userId: string,
  patch: Partial<NotificationSettings>,
) {
  const all = readAll();
  const account = all[userId];
  if (!account) return null;
  account.notifications = { ...account.notifications, ...patch };
  all[userId] = account;
  writeAll(all);
  return account;
}

export function setPlan(
  userId: string,
  plan: PlanTier,
  billingInterval: BillingInterval = plan === "unlimited" ? "monthly" : "none",
) {
  const all = readAll();
  const account = all[userId];
  if (!account) return null;
  account.plan = plan;
  account.billingInterval = billingInterval;
  if (plan === "unlimited" && account.invoices.length === 0) {
    account.invoices = [
      {
        id: crypto.randomUUID(),
        label: "Talkotype Unlimited — starter invoice",
        amountLabel: billingInterval === "yearly" ? "$100.80" : "$12.00",
        createdAt: new Date().toISOString(),
      },
    ];
  }
  all[userId] = account;
  writeAll(all);
  return account;
}

export function deleteAccountLocal(userId: string) {
  const all = readAll();
  delete all[userId];
  writeAll(all);

  // Also drop from the local auth user directory if present.
  try {
    const raw = localStorage.getItem("talkotype_users");
    if (raw) {
      const users = JSON.parse(raw) as Array<{ id: string }>;
      localStorage.setItem(
        "talkotype_users",
        JSON.stringify(users.filter((user) => user.id !== userId)),
      );
    }
  } catch {
    // ignore
  }
}

export function changeEmailLocal(userId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("That doesn’t look like an email yet.");
  }
  const all = readAll();
  const account = all[userId];
  if (!account) return null;
  account.email = normalized;
  account.name = normalized.split("@")[0] || account.name;
  all[userId] = account;
  writeAll(all);

  try {
    const sessionRaw = localStorage.getItem("talkotype_session");
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw) as TalkotypeUser;
      if (session.id === userId) {
        localStorage.setItem(
          "talkotype_session",
          JSON.stringify({ ...session, email: normalized, name: account.name }),
        );
        window.dispatchEvent(new Event("talkotype-auth"));
      }
    }
    const usersRaw = localStorage.getItem("talkotype_users");
    if (usersRaw) {
      const users = JSON.parse(usersRaw) as Array<TalkotypeUser & { passwordHash?: string }>;
      const next = users.map((user) =>
        user.id === userId
          ? { ...user, email: normalized, name: account.name }
          : user,
      );
      localStorage.setItem("talkotype_users", JSON.stringify(next));
    }
  } catch {
    // ignore
  }

  return account;
}
