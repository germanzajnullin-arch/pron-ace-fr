import type { PainPoint } from "@/hooks/useProfile";

/** Maps onboarding pain-point choice → quick-drill module id to recommend. */
export const PAIN_POINT_TO_MODULE: Record<PainPoint, string> = {
  french_r: "french-r-silent",
  nasal_vowels: "voyelles-nasales",
  liaison: "liaison",
  fast_speech: "minimal-pairs",
};
