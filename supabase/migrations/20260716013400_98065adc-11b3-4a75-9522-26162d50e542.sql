ALTER TABLE public.user_attempts
  ADD COLUMN IF NOT EXISTS accuracy_score numeric,
  ADD COLUMN IF NOT EXISTS fluency_score numeric,
  ADD COLUMN IF NOT EXISTS completeness_score numeric;

ALTER TABLE public.user_attempts
  ADD CONSTRAINT user_attempts_accuracy_range CHECK (accuracy_score IS NULL OR (accuracy_score >= 0 AND accuracy_score <= 1)),
  ADD CONSTRAINT user_attempts_fluency_range CHECK (fluency_score IS NULL OR (fluency_score >= 0 AND fluency_score <= 1)),
  ADD CONSTRAINT user_attempts_completeness_range CHECK (completeness_score IS NULL OR (completeness_score >= 0 AND completeness_score <= 1));