-- =============================================================================
-- Movr — Fix Migration
-- Run this in the Supabase SQL Editor to repair missing tables and columns.
-- This script is IDEMPOTENT — safe to run multiple times.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXERCISES — add columns that may be missing in older databases
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS tips              TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS suggested_rest    INTEGER,
  ADD COLUMN IF NOT EXISTS suggested_sets    INTEGER,
  ADD COLUMN IF NOT EXISTS suggested_reps    TEXT,
  ADD COLUMN IF NOT EXISTS primary_muscles   TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exercise_type     TEXT,
  ADD COLUMN IF NOT EXISTS level             TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DIETS — add columns that may be missing in older databases
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.diets
  ADD COLUMN IF NOT EXISTS duration_days     INTEGER,
  ADD COLUMN IF NOT EXISTS restriction_level TEXT,
  ADD COLUMN IF NOT EXISTS preferences       TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS favorite_foods    JSONB   NOT NULL DEFAULT '[]';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. MEALS — add target_calories column if missing
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS target_calories INTEGER;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PROFILES — add personal trainer extra columns if missing
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialties      TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications   TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_years INTEGER,
  ADD COLUMN IF NOT EXISTS instagram        TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp         TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TRAINING SESSIONS — create table if it doesn't exist (Agenda do Personal)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  status      TEXT NOT NULL DEFAULT 'agendado'
              CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'concluido')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS training_sessions_personal_id_idx ON public.training_sessions (personal_id);
CREATE INDEX IF NOT EXISTS training_sessions_student_id_idx  ON public.training_sessions (student_id);
CREATE INDEX IF NOT EXISTS training_sessions_date_idx        ON public.training_sessions (date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. STUDENT PAYMENTS — create table if it doesn't exist (Financeiro)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  description    TEXT NOT NULL,
  due_date       DATE NOT NULL,
  paid_at        DATE,
  status         TEXT NOT NULL DEFAULT 'pendente'
                 CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  payment_method TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_payments_personal_id_idx ON public.student_payments (personal_id);
CREATE INDEX IF NOT EXISTS student_payments_student_id_idx  ON public.student_payments (student_id);
CREATE INDEX IF NOT EXISTS student_payments_due_date_idx    ON public.student_payments (due_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. STUDENT ANAMNESES — create table if it doesn't exist (Ficha de Saúde)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_anamneses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  objective           TEXT,
  activity_level      TEXT CHECK (activity_level IN ('sedentario','leve','moderado','ativo','muito_ativo')),
  has_health_issues   BOOLEAN NOT NULL DEFAULT FALSE,
  health_issues       TEXT,
  medications         TEXT,
  injuries            TEXT,
  sleep_hours         NUMERIC(4,1),
  stress_level        INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  water_intake_liters NUMERIC(4,1),
  previous_training   TEXT,
  training_years      INTEGER,
  preferred_days      TEXT[] NOT NULL DEFAULT '{}',
  preferred_time      TEXT CHECK (preferred_time IN ('manha','tarde','noite')),
  observations        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_anamneses_personal_id_idx ON public.student_anamneses (personal_id);
CREATE INDEX IF NOT EXISTS student_anamneses_student_id_idx  ON public.student_anamneses (student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RLS — enable and create policies for new tables (skip if already exist)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_anamneses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- training_sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'training_sessions' AND policyname = 'personal_manage_sessions'
  ) THEN
    CREATE POLICY "personal_manage_sessions" ON public.training_sessions
      FOR ALL USING (personal_id = auth.uid())
      WITH CHECK (personal_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'training_sessions' AND policyname = 'student_view_sessions'
  ) THEN
    CREATE POLICY "student_view_sessions" ON public.training_sessions
      FOR SELECT USING (student_id = auth.uid());
  END IF;

  -- student_payments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'student_payments' AND policyname = 'personal_manage_payments'
  ) THEN
    CREATE POLICY "personal_manage_payments" ON public.student_payments
      FOR ALL USING (personal_id = auth.uid())
      WITH CHECK (personal_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'student_payments' AND policyname = 'student_view_payments'
  ) THEN
    CREATE POLICY "student_view_payments" ON public.student_payments
      FOR SELECT USING (student_id = auth.uid());
  END IF;

  -- student_anamneses
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'student_anamneses' AND policyname = 'personal_manage_anamneses'
  ) THEN
    CREATE POLICY "personal_manage_anamneses" ON public.student_anamneses
      FOR ALL USING (personal_id = auth.uid())
      WITH CHECK (personal_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'student_anamneses' AND policyname = 'student_manage_own_anamnese'
  ) THEN
    CREATE POLICY "student_manage_own_anamnese" ON public.student_anamneses
      FOR ALL USING (student_id = auth.uid());
  END IF;
END $$;
