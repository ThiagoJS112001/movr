-- ─────────────────────────────────────────────────────────────────────────────
-- Movr — Full Database Schema
-- Execute this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. PROFILES ─────────────────────────────────────────────────────────────
-- Extends auth.users. Created automatically via trigger (see triggers.sql).
-- role_prefix is a generated column — derived automatically from role:
--   personal  → PT
--   aluno     → ALN
--   academia  → ACD
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('personal', 'aluno', 'academia')),
  role_prefix TEXT GENERATED ALWAYS AS (
    CASE role
      WHEN 'personal' THEN 'PT'
      WHEN 'aluno'    THEN 'ALN'
      WHEN 'academia' THEN 'ACD'
    END
  ) STORED,
  avatar_url  TEXT,
  -- For alunos: reference to their personal trainer
  personal_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- For alunos: whether they are blocked by their personal
  is_blocked  BOOLEAN NOT NULL DEFAULT FALSE,
  -- Invite flow: 'pending' = personal added aluno, aluno hasn't confirmed yet
  --              'confirmed' = aluno confirmed the link
  --              NULL = created via old flow (treat as confirmed)
  connection_status TEXT CHECK (connection_status IN ('pending', 'confirmed')),
  -- Aluno profile fields
  birth_date  DATE,
  -- Academia-specific fields
  bio         TEXT,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  phone       TEXT,
  has_personal    BOOLEAN NOT NULL DEFAULT FALSE,
  has_nutrition   BOOLEAN NOT NULL DEFAULT FALSE,
  amenities       TEXT[]  NOT NULL DEFAULT '{}',
  photos          TEXT[]  NOT NULL DEFAULT '{}',
  opening_hours   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. EXERCISES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  muscle_group      TEXT NOT NULL,
  description       TEXT,
  equipment         TEXT,
  level             TEXT,
  exercise_type     TEXT,
  image_url         TEXT,
  video_url         TEXT,
  tips              TEXT[] DEFAULT '{}',
  suggested_rest    INTEGER,
  suggested_sets    INTEGER,
  suggested_reps    TEXT,
  primary_muscles   TEXT[] DEFAULT '{}',
  secondary_muscles TEXT[] DEFAULT '{}',
  personal_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration for existing databases (run once):
-- ALTER TABLE public.exercises
--   ADD COLUMN IF NOT EXISTS tips              TEXT[] DEFAULT '{}',
--   ADD COLUMN IF NOT EXISTS suggested_rest    INTEGER,
--   ADD COLUMN IF NOT EXISTS suggested_sets    INTEGER,
--   ADD COLUMN IF NOT EXISTS suggested_reps    TEXT,
--   ADD COLUMN IF NOT EXISTS primary_muscles   TEXT[] DEFAULT '{}',
--   ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[] DEFAULT '{}';

-- ─── 3. WORKOUTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  personal_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'rascunho')),
  level            TEXT CHECK (level IN ('iniciante', 'intermediario', 'avancado')),
  duration_minutes INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. WORKOUT EXERCISES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id    UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id   UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  sets          INTEGER NOT NULL,
  reps          TEXT NOT NULL,
  weight        TEXT,
  rest_seconds  INTEGER NOT NULL DEFAULT 60,
  notes         TEXT,
  image_url     TEXT,
  video_url     TEXT,
  order_index   INTEGER NOT NULL DEFAULT 0
);

-- ─── 5. WORKOUT ASSIGNMENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id     UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  workout_name   TEXT NOT NULL,
  student_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  personal_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_days TEXT[] NOT NULL DEFAULT '{}'
);

-- ─── 6. WORKOUT LOGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id        UUID REFERENCES public.workout_assignments(id) ON DELETE SET NULL,
  workout_id           UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  workout_name         TEXT NOT NULL,
  student_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_exercises  TEXT[]  NOT NULL DEFAULT '{}',
  exercise_weights     JSONB   NOT NULL DEFAULT '{}',
  duration_minutes     INTEGER,
  notes                TEXT
);

-- ─── 7. DIETS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  goal             TEXT,
  status           TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada')),
  personal_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_calories  INTEGER,
  target_protein   NUMERIC(6,1),
  target_carbs     NUMERIC(6,1),
  target_fat       NUMERIC(6,1),
  duration_days    INTEGER,
  restriction_level TEXT,
  preferences      TEXT[] NOT NULL DEFAULT '{}',
  favorite_foods   JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Migration (run on existing DB):
-- ALTER TABLE public.diets ADD COLUMN IF NOT EXISTS duration_days INTEGER;
-- ALTER TABLE public.diets ADD COLUMN IF NOT EXISTS restriction_level TEXT;
-- ALTER TABLE public.diets ADD COLUMN IF NOT EXISTS preferences TEXT[] NOT NULL DEFAULT '{}';
-- ALTER TABLE public.diets ADD COLUMN IF NOT EXISTS favorite_foods JSONB NOT NULL DEFAULT '[]';

-- ─── 8. MEALS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_id     UUID NOT NULL REFERENCES public.diets(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  time        TEXT NOT NULL,
  notes       TEXT,
  target_calories INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0
);
-- Migration (run on existing DB):
-- ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS target_calories INTEGER;

-- ─── 9. FOOD ITEMS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.food_items (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id  UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  quantity TEXT NOT NULL,
  calories NUMERIC(7,1),
  protein  NUMERIC(6,1),
  carbs    NUMERIC(6,1),
  fat      NUMERIC(6,1)
);

-- ─── 10. DIET ASSIGNMENTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diet_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_id     UUID NOT NULL REFERENCES public.diets(id) ON DELETE CASCADE,
  diet_name   TEXT NOT NULL,
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 11. WEEKLY PLANS ────────────────────────────────────────────────────────
-- One active plan per student (UNIQUE on student_id)
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  days        JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 12. WEEKLY PLAN ARCHIVES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_plan_archives (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  personal_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  days         JSONB NOT NULL DEFAULT '[]',
  archived_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 13. WORKOUT SESSIONS ────────────────────────────────────────────────────
-- Student-side log of completed daily sessions (tied to weekly plan days)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week              TEXT NOT NULL,
  label                    TEXT NOT NULL,
  completed_exercise_ids   TEXT[] NOT NULL DEFAULT '{}',
  duration_minutes         INTEGER NOT NULL DEFAULT 0,
  completed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 14. MESSAGES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read    BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── 15. FRIEND REQUESTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_id, to_id)
);

-- ─── 16. STUDENT GROUPS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 17. GROUP MEMBERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id   UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, student_id)
);

-- ─── 18. GROUP MESSAGES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  from_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_name     TEXT NOT NULL,
  content       TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'offer')),
  image_url     TEXT,
  offer_gym_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  offer_gym_name TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 19. STUDENT ASSESSMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  weight      NUMERIC(5,1),
  body_fat    NUMERIC(4,1),
  muscle_mass NUMERIC(5,1),
  lean_mass   NUMERIC(5,1),
  chest       NUMERIC(5,1),
  waist       NUMERIC(5,1),
  hip         NUMERIC(5,1),
  thigh       NUMERIC(5,1),
  arm         NUMERIC(5,1),
  calf        NUMERIC(5,1),
  abdomen     NUMERIC(5,1),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 20. GYM RATINGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gym_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gym_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES (for common query patterns)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_personal_id        ON public.profiles(personal_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_prefix         ON public.profiles(role_prefix);
CREATE INDEX IF NOT EXISTS idx_exercises_personal_id       ON public.exercises(personal_id);
CREATE INDEX IF NOT EXISTS idx_workouts_personal_id        ON public.workouts(personal_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout   ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student         ON public.workout_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_personal        ON public.workout_assignments(personal_id);
CREATE INDEX IF NOT EXISTS idx_logs_student                ON public.workout_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_diets_personal              ON public.diets(personal_id);
CREATE INDEX IF NOT EXISTS idx_meals_diet                  ON public.meals(diet_id);
CREATE INDEX IF NOT EXISTS idx_food_items_meal             ON public.food_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_diet_assignments_student    ON public.diet_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student            ON public.workout_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_from               ON public.messages(from_id);
CREATE INDEX IF NOT EXISTS idx_messages_to                 ON public.messages(to_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group        ON public.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_assessments_student         ON public.assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_gym_ratings_gym             ON public.gym_ratings(gym_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION — apply to existing databases that were created before role_prefix
-- Run this once in Supabase SQL Editor if the table already exists:
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS role_prefix TEXT GENERATED ALWAYS AS (
--     CASE role
--       WHEN 'personal' THEN 'PT'
--       WHEN 'aluno'    THEN 'ALN'
--       WHEN 'academia' THEN 'ACD'
--     END
--   ) STORED;
-- CREATE INDEX IF NOT EXISTS idx_profiles_role_prefix ON public.profiles(role_prefix);

-- MIGRATION — connection_status column (run once):
-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS connection_status TEXT
--     CHECK (connection_status IN ('pending', 'confirmed'));

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: find_aluno_by_email
-- Used by personals to search for an existing aluno to invite.
-- Returns minimal safe fields — does NOT expose email to caller.
-- SECURITY DEFINER so it can bypass RLS (caller identity still validated inside).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.find_aluno_by_email(search_email TEXT)
RETURNS TABLE(
  id            UUID,
  name          TEXT,
  avatar_url    TEXT,
  already_linked BOOLEAN
)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.avatar_url,
    (p.personal_id IS NOT NULL) AS already_linked
  FROM public.profiles p
  WHERE LOWER(p.email) = LOWER(search_email)
    AND p.role = 'aluno'
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.find_aluno_by_email(TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.find_aluno_by_email(TEXT) TO authenticated;
