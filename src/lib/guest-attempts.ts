/**
 * Guest attempt cache — keeps the last N pronunciation attempts in
 * localStorage so signed-out users still see their recent history.
 * On sign-in, this cache can be flushed to the `user_attempts` table.
 */

export interface GuestAttempt {
  lessonId: string | null;
  expectedText: string;
  transcript: string;
  score: number;
  accuracyScore: number | null;
  fluencyScore: number | null;
  completenessScore: number | null;
  durationMs: number | null;
  createdAt: string;
}

export const GUEST_ATTEMPTS_KEY = "guest_attempts";
export const GUEST_ATTEMPTS_LIMIT = 3;

const safeParse = (raw: string | null): GuestAttempt[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GuestAttempt[]) : [];
  } catch {
    return [];
  }
};

export const readGuestAttempts = (): GuestAttempt[] => {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(GUEST_ATTEMPTS_KEY));
  } catch {
    return [];
  }
};

export const pushGuestAttempt = (attempt: GuestAttempt): GuestAttempt[] => {
  if (typeof window === "undefined") return [];
  const next = [attempt, ...readGuestAttempts()].slice(0, GUEST_ATTEMPTS_LIMIT);
  try {
    window.localStorage.setItem(GUEST_ATTEMPTS_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  return next;
};

export const clearGuestAttempts = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_ATTEMPTS_KEY);
  } catch {
    /* noop */
  }
};
