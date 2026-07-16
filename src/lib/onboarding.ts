/**
 * Client-side onboarding flag stored in localStorage.
 * Used by the OnboardingGate to decide whether to force the quiz.
 */
export const ONBOARDING_STORAGE_KEY = "onboarding_completed";

export const isOnboardingCompleted = (): boolean => {
  if (typeof window === "undefined") return true; // SSR: don't force redirect
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const setOnboardingCompleted = (completed: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    if (completed) {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  } catch {
    /* noop */
  }
};

export const resetOnboarding = (): void => setOnboardingCompleted(false);
