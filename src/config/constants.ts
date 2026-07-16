/**
 * Central constants — no magic numbers in components or services.
 */

export const RECOGNITION_LANG = "fr-FR" as const;

export const RECORDING = {
  /** Hard cap on a single attempt in ms. */
  MAX_DURATION_MS: 20_000,
  /** How long to keep MediaRecorder chunks after stop before finalizing. */
  FINALIZE_DELAY_MS: 250,
  /** Audio MIME preference order. */
  MIME_PREFERENCES: [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ] as const,
} as const;

export const SCORING = {
  EXCELLENT: 0.9,
  GOOD: 0.75,
  FAIR: 0.5,
} as const;

export const TABS = [
  { id: "daily-focus", label: "Daily Focus", to: "/daily-focus" as const },
  { id: "practice", label: "Practice", to: "/practice" as const },
  { id: "progress", label: "Progress", to: "/progress" as const },
] as const;

export const HERO_COURSE = {
  category: "phonetics_basics",
  title: "French Phonetics Basics",
  subtitle: "Master the sounds that make French, French.",
  totalLessons: 5,
} as const;

export const APP_NAME = "Prononce" as const;
