export type PresenceRole = "ADMIN" | "DOCTOR" | "PATIENT";

export type PresenceEntry = {
  userId: string;
  name: string;
  email: string;
  role: PresenceRole;
  path: string;
  lastSeenAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __medclickPresence:
    | Map<string, PresenceEntry>
    | undefined;
}

const registry =
  globalThis.__medclickPresence ??
  new Map<string, PresenceEntry>();

if (!globalThis.__medclickPresence) {
  globalThis.__medclickPresence = registry;
}

export const ONLINE_WINDOW_MS = 35_000;

export function touchPresence(
  entry: Omit<PresenceEntry, "lastSeenAt">,
) {
  const current: PresenceEntry = {
    ...entry,
    lastSeenAt: Date.now(),
  };

  registry.set(entry.userId, current);
  cleanupPresence();

  return current;
}

export function listPresence() {
  cleanupPresence();

  return Array.from(registry.values()).sort(
    (a, b) => b.lastSeenAt - a.lastSeenAt,
  );
}

export function cleanupPresence() {
  const cutoff = Date.now() - ONLINE_WINDOW_MS * 4;

  for (const [userId, entry] of registry.entries()) {
    if (entry.lastSeenAt < cutoff) {
      registry.delete(userId);
    }
  }
}

export function isOnline(entry: PresenceEntry) {
  return Date.now() - entry.lastSeenAt <= ONLINE_WINDOW_MS;
}
