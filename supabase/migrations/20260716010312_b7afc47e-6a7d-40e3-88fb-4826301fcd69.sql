ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS french_level text NOT NULL DEFAULT 'A1'
    CHECK (french_level IN ('A1','A2','B1','B2'));