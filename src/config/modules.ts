import type { LessonCategory } from "@/types/lesson";

export interface QuickDrillModule {
  readonly id: string;
  readonly category: LessonCategory;
  readonly title: string;
  readonly subtitle: string;
  readonly emoji: string;
}

export const QUICK_DRILL_MODULES: readonly QuickDrillModule[] = [
  {
    id: "voyelles-nasales",
    category: "nasal_vowels",
    title: "Voyelles Nasales",
    subtitle: "Nasal vowels — un / on / in / an",
    emoji: "👃",
  },
  {
    id: "french-r-silent",
    category: "french_r_silent",
    title: "The French 'R' & Silent Letters",
    subtitle: "Uvular R and endings you don't say",
    emoji: "🗣️",
  },
  {
    id: "liaison",
    category: "liaison",
    title: "Liaison",
    subtitle: "Linking words together",
    emoji: "🔗",
  },
  {
    id: "minimal-pairs",
    category: "minimal_pairs",
    title: "Minimal Pairs",
    subtitle: "dessus vs dessous — hear the contrast",
    emoji: "🎯",
  },
] as const;

export const getModuleById = (id: string): QuickDrillModule | undefined =>
  QUICK_DRILL_MODULES.find((m) => m.id === id);
