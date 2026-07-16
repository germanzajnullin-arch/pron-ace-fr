import type { PainPoint } from "@/hooks/useProfile";

export interface DailyTopic {
  readonly title: string;
  readonly moduleId: string;
  readonly description: string;
  readonly tasks: readonly DailyTask[];
}

export interface DailyTask {
  readonly id: string;
  readonly emoji: string;
  readonly title: string;
  readonly detail: string;
  readonly target: number;
}

/** Topic-of-the-day content, keyed by onboarding pain-point. */
export const DAILY_TOPICS: Record<PainPoint, DailyTopic> = {
  nasal_vowels: {
    title: "Master Nasal Vowels",
    moduleId: "voyelles-nasales",
    description:
      "Train your ear and mouth to feel the difference between un, on, in, and an.",
    tasks: [
      {
        id: "ear-nasals",
        emoji: "🎧",
        title: "Phonetic Ear Training",
        detail: 'Distinguish between "un" and "une"',
        target: 5,
      },
      {
        id: "mouth-nasals",
        emoji: "🗣️",
        title: "Mouth Mechanics",
        detail: 'Say "bon", "bain", "banc" in a loop',
        target: 3,
      },
      {
        id: "chat-nasals",
        emoji: "🤖",
        title: "Situational Chat",
        detail: "2-minute conversation introducing yourself",
        target: 1,
      },
    ],
  },
  french_r: {
    title: "Tame the French R",
    moduleId: "french-r-silent",
    description:
      "Work the back of your throat. The uvular R is a muscle — train it daily.",
    tasks: [
      {
        id: "ear-r",
        emoji: "🎧",
        title: "Phonetic Ear Training",
        detail: 'Spot the R in "Paris", "rouge", "trois"',
        target: 5,
      },
      {
        id: "mouth-r",
        emoji: "🗣️",
        title: "Mouth Mechanics",
        detail: 'Practice the French "R" in 3 core words',
        target: 3,
      },
      {
        id: "chat-r",
        emoji: "🤖",
        title: "Situational Chat",
        detail: "Order a coffee — nail every R",
        target: 1,
      },
    ],
  },
  liaison: {
    title: "Flow With Liaisons",
    moduleId: "liaison",
    description:
      "Link words so your French sounds like a river, not a checklist.",
    tasks: [
      {
        id: "ear-liaison",
        emoji: "🎧",
        title: "Phonetic Ear Training",
        detail: 'Catch liaisons in "les_amis", "vous_avez"',
        target: 5,
      },
      {
        id: "mouth-liaison",
        emoji: "🗣️",
        title: "Mouth Mechanics",
        detail: "Chain 3 short phrases without pausing",
        target: 3,
      },
      {
        id: "chat-liaison",
        emoji: "🤖",
        title: "Situational Chat",
        detail: "2-minute intro — no choppy words",
        target: 1,
      },
    ],
  },
  fast_speech: {
    title: "Keep Up With Native Speed",
    moduleId: "minimal-pairs",
    description: "Sharpen minimal pairs so fast French stops feeling like noise.",
    tasks: [
      {
        id: "ear-fast",
        emoji: "🎧",
        title: "Phonetic Ear Training",
        detail: 'Distinguish "dessus" vs "dessous"',
        target: 5,
      },
      {
        id: "mouth-fast",
        emoji: "🗣️",
        title: "Mouth Mechanics",
        detail: "Repeat a phrase at 3 tempos",
        target: 3,
      },
      {
        id: "chat-fast",
        emoji: "🤖",
        title: "Situational Chat",
        detail: "2-minute quick-fire small talk",
        target: 1,
      },
    ],
  },
};

/** Fallback for users who haven't finished onboarding. */
export const DEFAULT_DAILY_TOPIC: DailyTopic = DAILY_TOPICS.nasal_vowels;
