import type { Attempt } from "@/types/attempt";

/**
 * Mock scored attempts — used before Supabase reads hydrate, and in offline
 * / unsigned-in mode so the UI can be exercised end-to-end.
 */
export const MOCK_RECENT_ATTEMPTS: readonly Attempt[] = [
  {
    id: "mock-1",
    lessonId: null,
    expectedText: "Bonjour, comment allez-vous ?",
    transcript: "Bonjour comment allez vous",
    score: 0.94,
    durationMs: 2100,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "mock-2",
    lessonId: null,
    expectedText: "Un bon vin blanc",
    transcript: "Un bon vin blan",
    score: 0.82,
    durationMs: 1800,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "mock-3",
    lessonId: null,
    expectedText: "Le livre est dessus, pas dessous.",
    transcript: "Le livre est dessous pas dessus",
    score: 0.61,
    durationMs: 2900,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
] as const;
