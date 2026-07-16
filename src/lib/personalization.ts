import { useEffect, useState } from "react";
import { useProfile, type FrenchLevel, type Goal, type PainPoint } from "@/hooks/useProfile";

/** Consolidated answers captured by the onboarding quiz. */
export interface OnboardingAnswers {
  goal: Goal | null;
  french_level: FrenchLevel;
  pain_point: PainPoint | null;
  audio_challenge_answer: "dessus" | "dessous" | null;
  daily_goal_minutes: number;
}

export const ONBOARDING_ANSWERS_KEY = "onboarding_answers";

const DEFAULTS: OnboardingAnswers = {
  goal: null,
  french_level: "A1",
  pain_point: null,
  audio_challenge_answer: null,
  daily_goal_minutes: 10,
};

export const readLocalAnswers = (): OnboardingAnswers => {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_ANSWERS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<OnboardingAnswers>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
};

export const writeLocalAnswers = (answers: OnboardingAnswers): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONBOARDING_ANSWERS_KEY, JSON.stringify(answers));
  } catch {
    /* noop */
  }
};

/**
 * Merges Supabase profile (when signed in) with the guest localStorage cache.
 * Profile wins when present; falls back to local answers so guests get the
 * same personalized dashboard experience.
 */
export const usePersonalization = (): OnboardingAnswers => {
  const { profile } = useProfile();
  const [local, setLocal] = useState<OnboardingAnswers>(DEFAULTS);

  useEffect(() => {
    setLocal(readLocalAnswers());
    const onStorage = (e: StorageEvent) => {
      if (e.key === ONBOARDING_ANSWERS_KEY) setLocal(readLocalAnswers());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    goal: (profile?.goal as Goal | null) ?? local.goal,
    french_level: (profile?.french_level as FrenchLevel | undefined) ?? local.french_level,
    pain_point: (profile?.pain_point as PainPoint | null) ?? local.pain_point,
    audio_challenge_answer:
      (profile?.audio_challenge_answer as "dessus" | "dessous" | null) ??
      local.audio_challenge_answer,
    daily_goal_minutes: profile?.daily_goal_minutes ?? local.daily_goal_minutes,
  };
};

/* --------------------------------- Content --------------------------------- */

export interface LevelPhrase {
  readonly french: string;
  readonly translation: string;
}

/** Level-adaptive sample phrase used across dashboard + practice previews. */
export const LEVEL_PHRASE: Record<FrenchLevel, LevelPhrase> = {
  A1: { french: "Bonjour, ça va ?", translation: "Hello, how are you?" },
  A2: {
    french: "Je voudrais un café, s'il vous plaît.",
    translation: "I'd like a coffee, please.",
  },
  B1: {
    french: "Si j'avais plus de temps, je voyagerais en France.",
    translation: "If I had more time, I'd travel to France.",
  },
  B2: {
    french: "Bien qu'il pleuve, nous irons nous promener au bord de la Seine.",
    translation: "Even though it's raining, we'll walk along the Seine.",
  },
};

/** Goal → AI Conversation opener (Léa's first line). */
export const GOAL_AI_OPENER: Record<Goal, string> = {
  overcome_barrier:
    "Salut ! Prenons ça tranquillement — parlez-moi de vous en français, simplement.",
  professional:
    "Bonjour, je suis Léa, votre coach. Simulons un entretien : présentez-vous en une phrase.",
  travel:
    "Bienvenue à Paris ! Vous entrez dans un café — comment commandez-vous ?",
  accent:
    "Salut ! Travaillons votre accent. Répétez après moi : « Un bon vin blanc ».",
};

/** Short human label for the goal — used in badges. */
export const GOAL_LABEL: Record<Goal, string> = {
  overcome_barrier: "Overcome the barrier",
  professional: "Sound professional",
  travel: "Travel-ready",
  accent: "Perfect the accent",
};
