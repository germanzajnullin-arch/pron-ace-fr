
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS pain_point text,
  ADD COLUMN IF NOT EXISTS audio_challenge_answer text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_goal_check,
  DROP CONSTRAINT IF EXISTS profiles_pain_point_check,
  DROP CONSTRAINT IF EXISTS profiles_audio_challenge_answer_check,
  DROP CONSTRAINT IF EXISTS profiles_daily_goal_minutes_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_goal_check
    CHECK (goal IS NULL OR goal IN ('overcome_barrier','professional','travel','accent')),
  ADD CONSTRAINT profiles_pain_point_check
    CHECK (pain_point IS NULL OR pain_point IN ('french_r','nasal_vowels','liaison','fast_speech')),
  ADD CONSTRAINT profiles_audio_challenge_answer_check
    CHECK (audio_challenge_answer IS NULL OR audio_challenge_answer IN ('dessus','dessous')),
  ADD CONSTRAINT profiles_daily_goal_minutes_check
    CHECK (daily_goal_minutes IN (3, 10, 20));
