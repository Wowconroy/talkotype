const KEY = "talkotype_display_names";

type NameMap = Record<string, string>;

function readMap(): NameMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NameMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: NameMap) {
  window.localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new Event("talkotype-display-name"));
}

export function getCachedDisplayName(userId: string): string | null {
  const value = readMap()[userId]?.trim();
  return value || null;
}

export function setCachedDisplayName(userId: string, name: string) {
  const next = name.trim().replace(/\s+/g, " ");
  if (!userId || !next) return;
  const map = readMap();
  map[userId] = next;
  writeMap(map);
}

export function clearCachedDisplayName(userId?: string) {
  if (!userId) {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("talkotype-display-name"));
    return;
  }
  const map = readMap();
  delete map[userId];
  writeMap(map);
}

/** Prefer cached profile name, then auth fallback. */
export function resolveDisplayName(
  userId: string,
  fallback: string,
): string {
  return getCachedDisplayName(userId) || fallback;
}
