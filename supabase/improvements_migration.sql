-- ─────────────────────────────────────────────────────────────────────────────
-- Movr — Improvements Migration
-- Run this in the Supabase SQL Editor after schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. TRAINING SESSIONS (Agenda) ───────────────────────────────────────────
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

-- ─── 2. STUDENT PAYMENTS (Financeiro) ────────────────────────────────────────
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

-- ─── 3. STUDENT ANAMNESES (Ficha de Saúde) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_anamneses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Goals & Activity
  objective           TEXT,
  activity_level      TEXT CHECK (activity_level IN ('sedentario','leve','moderado','ativo','muito_ativo')),
  -- Health
  has_health_issues   BOOLEAN NOT NULL DEFAULT FALSE,
  health_issues       TEXT,
  medications         TEXT,
  injuries            TEXT,
  -- Lifestyle
  sleep_hours         NUMERIC(4,1),
  stress_level        INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  water_intake_liters NUMERIC(4,1),
  -- Training history
  previous_training   TEXT,
  training_years      INTEGER,
  -- Preferences
  preferred_days      TEXT[] NOT NULL DEFAULT '{}',
  preferred_time      TEXT CHECK (preferred_time IN ('manha','tarde','noite')),
  observations        TEXT,
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_anamneses_personal_id_idx ON public.student_anamneses (personal_id);
CREATE INDEX IF NOT EXISTS student_anamneses_student_id_idx  ON public.student_anamneses (student_id);

-- ─── 4. PERSONAL PROFILES (extended info) ────────────────────────────────────
-- Add extra columns to existing profiles table for personal trainers
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialties     TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications  TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_years INTEGER,
  ADD COLUMN IF NOT EXISTS instagram       TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp        TEXT;

-- ─── 5. ROW LEVEL SECURITY ───────────────────────────────────────────────────

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_anamneses ENABLE ROW LEVEL SECURITY;

-- Training sessions: personal can manage all their sessions
CREATE POLICY "personal_manage_sessions" ON public.training_sessions
  FOR ALL USING (personal_id = auth.uid());

-- Student can see their own sessions
CREATE POLICY "student_view_sessions" ON public.training_sessions
  FOR SELECT USING (student_id = auth.uid());

-- Payments: personal manages, student can view their own
CREATE POLICY "personal_manage_payments" ON public.student_payments
  FOR ALL USING (personal_id = auth.uid());

CREATE POLICY "student_view_payments" ON public.student_payments
  FOR SELECT USING (student_id = auth.uid());

-- Anamneses: personal manages, student can view/update their own
CREATE POLICY "personal_manage_anamneses" ON public.student_anamneses
  FOR ALL USING (personal_id = auth.uid());

CREATE POLICY "student_manage_own_anamnese" ON public.student_anamneses
  FOR ALL USING (student_id = auth.uid());
