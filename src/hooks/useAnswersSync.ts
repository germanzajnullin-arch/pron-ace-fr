import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  readLocalAnswers,
  ONBOARDING_ANSWERS_KEY,
  type OnboardingAnswers,
} from "@/lib/personalization";
import { setOnboardingCompleted, isOnboardingCompleted } from "@/lib/onboarding";
import { readGuestAttempts, clearGuestAttempts } from "@/lib/guest-attempts";
import { createLogger } from "@/services/logger";
import type { Database } from "@/integrations/supabase/types";

type ProfilePatch = Database["public"]["Tables"]["profiles"]["Update"];

const log = createLogger("AnswersSync");

/**
 * When a signed-in session appears (login, refresh, tab focus), merge any
 * guest onboarding answers stored in localStorage into the Supabase
 * `profiles` row. Runs at most once per session id.
 */
export const useAnswersSync = (): void => {
  const { session } = useAuthSession();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || syncedFor.current === userId) return;
    syncedFor.current = userId;

    const answers: OnboardingAnswers = readLocalAnswers();
    const locallyCompleted = isOnboardingCompleted();

    // Skip if there's nothing meaningful to write and onboarding isn't marked complete.
    const hasAnswers =
      answers.goal || answers.pain_point || answers.audio_challenge_answer;
    if (!hasAnswers && !locallyCompleted) return;

    (async () => {
      try {
        const { data: existing, error: readError } = await supabase
          .from("profiles")
          .select("goal, pain_point, audio_challenge_answer, french_level, onboarding_completed")
          .eq("id", userId)
          .maybeSingle();
        if (readError) throw readError;

        // Only fill missing fields — never clobber values the user set on this device.
        const patch: ProfilePatch = {};
        if (!existing?.goal && answers.goal) patch.goal = answers.goal;
        if (!existing?.pain_point && answers.pain_point) patch.pain_point = answers.pain_point;
        if (!existing?.audio_challenge_answer && answers.audio_challenge_answer) {
          patch.audio_challenge_answer = answers.audio_challenge_answer;
        }
        if ((!existing?.french_level || existing.french_level === "A1") && answers.french_level) {
          patch.french_level = answers.french_level;
        }
        if (answers.daily_goal_minutes) patch.daily_goal_minutes = answers.daily_goal_minutes;
        if (!existing?.onboarding_completed && (locallyCompleted || hasAnswers)) {
          patch.onboarding_completed = true;
        }

        if (Object.keys(patch).length > 0) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update(patch)
            .eq("id", userId);
          if (updateError) throw updateError;
          log.info("synced guest answers into profile", patch);
        }

        // Mirror completion locally + clear cache so we don't re-sync forever.
        setOnboardingCompleted(true);
        try {
          window.localStorage.removeItem(ONBOARDING_ANSWERS_KEY);
        } catch {
          /* noop */
        }

        // Flush any guest attempts cached on this device into user_attempts.
        const pending = readGuestAttempts();
        if (pending.length > 0) {
          const { error: attemptsError } = await supabase
            .from("user_attempts")
            .insert(
              pending.map((a) => ({
                user_id: userId,
                lesson_id: a.lessonId,
                expected_text: a.expectedText,
                transcript: a.transcript,
                score: a.score,
                duration_ms: a.durationMs,
                accuracy_score: a.accuracyScore,
                fluency_score: a.fluencyScore,
                completeness_score: a.completenessScore,
              })),
            );
          if (attemptsError) {
            log.error("failed to migrate guest attempts", attemptsError);
          } else {
            clearGuestAttempts();
            log.info("migrated guest attempts", { count: pending.length });
          }
        }
      } catch (err) {
        log.error("failed to sync onboarding answers", err);
        syncedFor.current = null; // allow retry on next session change
      }
    })();
  }, [session]);
};
