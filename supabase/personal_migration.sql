-- =============================================================================
-- Movr — Personal Trainer Marketplace Migration
-- Run in Supabase SQL Editor AFTER schema.sql and rls.sql
-- =============================================================================

-- =============================================================================
-- SECTION 1 — personal_profiles
-- One row per personal trainer, extending the profiles table.
-- Stores marketplace-specific data: CREF, specialties, pricing, modality.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.personal_profiles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id       UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  cref              TEXT,
  cref_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
  specialties       TEXT[]      NOT NULL DEFAULT '{}',
  years_experience  INTEGER     NOT NULL DEFAULT 0,
  modality          TEXT        NOT NULL DEFAULT 'presencial'
                    CHECK (modality IN ('online', 'presencial', 'ambos')),
  bio               TEXT,
  photos            TEXT[]      NOT NULL DEFAULT '{}',
  price_per_session NUMERIC(8,2),
  -- Cached from profiles.city / profiles.state for faster queries
  city              TEXT,
  state             TEXT,
  ativo             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS personal_profiles_set_updated_at ON public.personal_profiles;
CREATE TRIGGER personal_profiles_set_updated_at
  BEFORE UPDATE ON public.personal_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 2 — personal_availability
-- Weekly recurring availability slots (by day_of_week).
-- day_of_week: 0 = Sunday … 6 = Saturday
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.personal_availability (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID     NOT NULL REFERENCES public.personal_profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  TIME     NOT NULL,
  end_time    TIME     NOT NULL,
  modality    TEXT     NOT NULL DEFAULT 'presencial'
              CHECK (modality IN ('online', 'presencial', 'ambos')),
  UNIQUE (personal_id, day_of_week, start_time)
);

-- =============================================================================
-- SECTION 3 — personal_ratings
-- Alunos can rate and review trainers after sessions.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.personal_ratings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID        NOT NULL REFERENCES public.personal_profiles(id) ON DELETE CASCADE,
  aluno_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comentario  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (personal_id, aluno_id)
);

-- =============================================================================
-- SECTION 4 — Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_personal_profiles_personal   ON public.personal_profiles(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_profiles_ativo      ON public.personal_profiles(ativo);
CREATE INDEX IF NOT EXISTS idx_personal_profiles_modality   ON public.personal_profiles(modality);
CREATE INDEX IF NOT EXISTS idx_personal_profiles_specialties ON public.personal_profiles USING GIN (specialties);

CREATE INDEX IF NOT EXISTS idx_personal_avail_personal      ON public.personal_availability(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_avail_day           ON public.personal_availability(day_of_week);

CREATE INDEX IF NOT EXISTS idx_personal_ratings_personal    ON public.personal_ratings(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_ratings_aluno       ON public.personal_ratings(aluno_id);

-- =============================================================================
-- SECTION 5 — RLS
-- =============================================================================

ALTER TABLE public.personal_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_ratings    ENABLE ROW LEVEL SECURITY;

-- personal_profiles: anyone authenticated can read active profiles
CREATE POLICY personal_profiles_select ON public.personal_profiles
  FOR SELECT TO authenticated
  USING (ativo = TRUE);

-- personal_profiles: only the owner can insert/update their own row
CREATE POLICY personal_profiles_insert ON public.personal_profiles
  FOR INSERT TO authenticated
  WITH CHECK (personal_id = auth.uid());

CREATE POLICY personal_profiles_update ON public.personal_profiles
  FOR UPDATE TO authenticated
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

-- personal_availability: authenticated users can read
CREATE POLICY personal_avail_select ON public.personal_availability
  FOR SELECT TO authenticated
  USING (
    personal_id IN (
      SELECT id FROM public.personal_profiles WHERE ativo = TRUE
    )
  );

-- personal_availability: owner can manage
CREATE POLICY personal_avail_manage ON public.personal_availability
  FOR ALL TO authenticated
  USING (
    personal_id IN (
      SELECT id FROM public.personal_profiles WHERE personal_id = auth.uid()
    )
  )
  WITH CHECK (
    personal_id IN (
      SELECT id FROM public.personal_profiles WHERE personal_id = auth.uid()
    )
  );

-- personal_ratings: anyone authenticated can read
CREATE POLICY personal_ratings_select ON public.personal_ratings
  FOR SELECT TO authenticated
  USING (TRUE);

-- personal_ratings: aluno can insert/update their own rating
CREATE POLICY personal_ratings_insert ON public.personal_ratings
  FOR INSERT TO authenticated
  WITH CHECK (aluno_id = auth.uid());

CREATE POLICY personal_ratings_update ON public.personal_ratings
  FOR UPDATE TO authenticated
  USING (aluno_id = auth.uid())
  WITH CHECK (aluno_id = auth.uid());
