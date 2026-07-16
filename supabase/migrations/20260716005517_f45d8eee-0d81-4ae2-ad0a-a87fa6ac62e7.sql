
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'neon';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_theme_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_theme_check
    CHECK (theme IN ('neon','ocean','light','cyber'));
