export type TalkotypeUser = {
  id: string;
  email: string;
  name: string;
  provider: "email" | "google";
  createdAt: string;
};

type StoredUser = TalkotypeUser & {
  passwordHash?: string;
};

const USERS_KEY = "talkotype_users";
const SESSION_KEY = "talkotype_session";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readUsers(): StoredUser[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function simpleHash(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

function toPublicUser(user: StoredUser): TalkotypeUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function getSessionUser(): TalkotypeUser | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as TalkotypeUser) : null;
  } catch {
    return null;
  }
}

export function setSessionUser(user: TalkotypeUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("talkotype-auth"));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("talkotype-auth"));
}

export function signUpWithEmail(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    throw new Error("Email and password please — we're friendly, not psychic.");
  }
  if (password.length < 6) {
    throw new Error("Make that password at least 6 characters. Future you will thank you.");
  }

  const users = readUsers();
  if (users.some((user) => user.email === normalized)) {
    throw new Error("That email already has a seat. Try logging in instead.");
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalized,
    name: normalized.split("@")[0] || "Friend",
    provider: "email",
    createdAt: new Date().toISOString(),
    passwordHash: simpleHash(password),
  };

  writeUsers([...users, user]);
  const publicUser = toPublicUser(user);
  setSessionUser(publicUser);
  return publicUser;
}

export function signInWithEmail(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const users = readUsers();
  const match = users.find((user) => user.email === normalized);

  if (!match || match.passwordHash !== simpleHash(password)) {
    throw new Error("Hmm, that combo didn't match. Want to try again?");
  }

  const publicUser = toPublicUser(match);
  setSessionUser(publicUser);
  return publicUser;
}

export function signInWithGoogle() {
  const user: TalkotypeUser = {
    id: crypto.randomUUID(),
    email: `friend-${Date.now().toString().slice(-6)}@gmail.com`,
    name: "Google Friend",
    provider: "google",
    createdAt: new Date().toISOString(),
  };
  setSessionUser(user);
  return user;
}
