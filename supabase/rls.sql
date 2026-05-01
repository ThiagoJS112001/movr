-- ─────────────────────────────────────────────────────────────────────────────
-- Movr — Row Level Security Policies
-- Execute AFTER schema.sql in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper function: get current user's role from profiles
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
-- Only authenticated users should call this — revoke from anon/public
REVOKE EXECUTE ON FUNCTION public.my_role() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.my_role() TO authenticated;

-- Helper function: get current user's personal_id (for alunos)
CREATE OR REPLACE FUNCTION public.my_personal_id()
RETURNS UUID
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT personal_id FROM public.profiles WHERE id = auth.uid();
$$;
-- Only authenticated users should call this — revoke from anon/public
REVOKE EXECUTE ON FUNCTION public.my_personal_id() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.my_personal_id() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plan_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_groups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_ratings        ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
-- Users can read their own profile
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Personals can read profiles of their own students
CREATE POLICY "profiles: personal reads students"
  ON public.profiles FOR SELECT
  USING (personal_id = auth.uid());

-- Alunos can read the profile of their personal
CREATE POLICY "profiles: aluno reads own personal"
  ON public.profiles FOR SELECT
  USING (
    id = (SELECT personal_id FROM public.profiles WHERE id = auth.uid())
  );

-- Anyone authenticated can read academia profiles (to browse gyms)
CREATE POLICY "profiles: read academia"
  ON public.profiles FOR SELECT
  USING (role = 'academia');

-- Users can update only their own profile
CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Personals can update their students (e.g., block/unblock)
CREATE POLICY "profiles: personal updates students"
  ON public.profiles FOR UPDATE
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

-- Insert is handled by the trigger (service role), but allow authenticated to insert own
CREATE POLICY "profiles: own insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- EXERCISES
-- ─────────────────────────────────────────────────────────────────────────────
-- Personal can CRUD their own exercises
CREATE POLICY "exercises: personal CRUD"
  ON public.exercises FOR ALL
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

-- Alunos can read exercises from their personal
CREATE POLICY "exercises: aluno read"
  ON public.exercises FOR SELECT
  USING (personal_id = public.my_personal_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- WORKOUTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "workouts: personal CRUD"
  ON public.workouts FOR ALL
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

-- Alunos can read workouts assigned to them
CREATE POLICY "workouts: aluno read assigned"
  ON public.workouts FOR SELECT
  USING (
    id IN (
      SELECT workout_id FROM public.workout_assignments WHERE student_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- WORKOUT EXERCISES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "workout_exercises: personal CRUD"
  ON public.workout_exercises FOR ALL
  USING (
    workout_id IN (SELECT id FROM public.workouts WHERE personal_id = auth.uid())
  )
  WITH CHECK (
    workout_id IN (SELECT id FROM public.workouts WHERE personal_id = auth.uid())
  );

CREATE POLICY "workout_exercises: aluno read"
  ON public.workout_exercises FOR SELECT
  USING (
    workout_id IN (
      SELECT workout_id FROM public.workout_assignments WHERE student_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- WORKOUT ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "assignments: personal CRUD"
  ON public.workout_assignments FOR ALL
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

CREATE POLICY "assignments: aluno read own"
  ON public.workout_assignments FOR SELECT
  USING (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- WORKOUT LOGS
-- ─────────────────────────────────────────────────────────────────────────────
-- Aluno can insert and read own logs
CREATE POLICY "logs: aluno CRUD own"
  ON public.workout_logs FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Personal can read logs of their students
CREATE POLICY "logs: personal read"
  ON public.workout_logs FOR SELECT
  USING (
    student_id IN (SELECT id FROM public.profiles WHERE personal_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- DIETS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "diets: personal CRUD"
  ON public.diets FOR ALL
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

CREATE POLICY "diets: aluno read assigned"
  ON public.diets FOR SELECT
  USING (
    id IN (SELECT diet_id FROM public.diet_assignments WHERE student_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- MEALS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "meals: personal CRUD"
  ON public.meals FOR ALL
  USING (
    diet_id IN (SELECT id FROM public.diets WHERE personal_id = auth.uid())
  )
  WITH CHECK (
    diet_id IN (SELECT id FROM public.diets WHERE personal_id = auth.uid())
  );

CREATE POLICY "meals: aluno read"
  ON public.meals FOR SELECT
  USING (
    diet_id IN (SELECT diet_id FROM public.diet_assignments WHERE student_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- FOOD ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "food_items: personal CRUD"
  ON public.food_items FOR ALL
  USING (
    meal_id IN (
      SELECT m.id FROM public.meals m
      JOIN public.diets d ON d.id = m.diet_id
      WHERE d.personal_id = auth.uid()
    )
  )
  WITH CHECK (
    meal_id IN (
      SELECT m.id FROM public.meals m
      JOIN public.diets d ON d.id = m.diet_id
      WHERE d.personal_id = auth.uid()
    )
  );

CREATE POLICY "food_items: aluno read"
  ON public.food_items FOR SELECT
  USING (
    meal_id IN (
      SELECT m.id FROM public.meals m
      JOIN public.diet_assignments da ON da.diet_id = m.diet_id
      WHERE da.student_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- DIET ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "diet_assignments: personal CRUD"
  ON public.diet_assignments FOR ALL
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

CREATE POLICY "diet_assignments: aluno read own"
  ON public.diet_assignments FOR SELECT
  USING (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- WEEKLY PLANS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "weekly_plans: personal CRUD"
  ON public.weekly_plans FOR ALL
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

CREATE POLICY "weekly_plans: aluno read own"
  ON public.weekly_plans FOR SELECT
  USING (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- WEEKLY PLAN ARCHIVES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "weekly_plan_archives: personal read"
  ON public.weekly_plan_archives FOR ALL
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

CREATE POLICY "weekly_plan_archives: aluno read own"
  ON public.weekly_plan_archives FOR SELECT
  USING (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- WORKOUT SESSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "sessions: aluno CRUD own"
  ON public.workout_sessions FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "sessions: personal read"
  ON public.workout_sessions FOR SELECT
  USING (
    student_id IN (SELECT id FROM public.profiles WHERE personal_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "messages: read own"
  ON public.messages FOR SELECT
  USING (from_id = auth.uid() OR to_id = auth.uid());

CREATE POLICY "messages: insert own"
  ON public.messages FOR INSERT
  WITH CHECK (from_id = auth.uid());

CREATE POLICY "messages: update own (mark read)"
  ON public.messages FOR UPDATE
  USING (to_id = auth.uid())
  WITH CHECK (to_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- FRIEND REQUESTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "friend_requests: read own"
  ON public.friend_requests FOR SELECT
  USING (from_id = auth.uid() OR to_id = auth.uid());

CREATE POLICY "friend_requests: insert own"
  ON public.friend_requests FOR INSERT
  WITH CHECK (from_id = auth.uid());

CREATE POLICY "friend_requests: update recipient"
  ON public.friend_requests FOR UPDATE
  USING (to_id = auth.uid())
  WITH CHECK (to_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- STUDENT GROUPS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "groups: personal CRUD"
  ON public.student_groups FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "groups: member read"
  ON public.student_groups FOR SELECT
  USING (
    id IN (SELECT group_id FROM public.group_members WHERE student_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "group_members: personal CRUD"
  ON public.group_members FOR ALL
  USING (
    group_id IN (SELECT id FROM public.student_groups WHERE created_by = auth.uid())
  )
  WITH CHECK (
    group_id IN (SELECT id FROM public.student_groups WHERE created_by = auth.uid())
  );

CREATE POLICY "group_members: member read"
  ON public.group_members FOR SELECT
  USING (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP MESSAGES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "group_messages: member read"
  ON public.group_messages FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE student_id = auth.uid())
    OR group_id IN (SELECT id FROM public.student_groups WHERE created_by = auth.uid())
  );

CREATE POLICY "group_messages: member insert"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    from_id = auth.uid()
    AND (
      group_id IN (SELECT group_id FROM public.group_members WHERE student_id = auth.uid())
      OR group_id IN (SELECT id FROM public.student_groups WHERE created_by = auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- ASSESSMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "assessments: personal CRUD"
  ON public.assessments FOR ALL
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

CREATE POLICY "assessments: aluno read own"
  ON public.assessments FOR SELECT
  USING (student_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- GYM RATINGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "gym_ratings: read all"
  ON public.gym_ratings FOR SELECT
  USING (true);

CREATE POLICY "gym_ratings: user CUD own"
  ON public.gym_ratings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
