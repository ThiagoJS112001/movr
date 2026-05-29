-- =============================================================================
-- Movr — Academia Module Migration  (v2)
-- Supersedes v1 (academia_migration.sql)
-- Run in Supabase SQL Editor AFTER schema.sql and rls.sql
-- =============================================================================

-- =============================================================================
-- SECTION 0 — Clean up v1 artifacts
-- These tables were created by the first migration with incorrect FK targets
-- (they pointed to profiles.id instead of gyms.id).  Safe to drop because
-- no user-facing data relies on them yet.
-- =============================================================================

DROP TABLE IF EXISTS public.gym_group_messages  CASCADE;
DROP TABLE IF EXISTS public.gym_group_members   CASCADE;
DROP TABLE IF EXISTS public.gym_groups          CASCADE;
DROP TABLE IF EXISTS public.gym_subscriptions   CASCADE;
DROP TABLE IF EXISTS public.gym_payments        CASCADE;

-- Remove helper created in v1 (will be recreated below with the right body)
DROP FUNCTION IF EXISTS public.my_gym_id();

-- CNPJ is now in the gyms table — remove it from profiles if it was added
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cnpj;

-- =============================================================================
-- SECTION 1 — Shared trigger function for updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- SECTION 2 — Helper: resolve the gyms.id for the authenticated user
-- Usage in RLS:  gym_id = public.my_gym_id()
-- =============================================================================

CREATE OR REPLACE FUNCTION public.my_gym_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.gyms WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.my_gym_id() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.my_gym_id() TO authenticated;

-- =============================================================================
-- SECTION 3 — Core tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1  GYMS
-- One row per academia account.  user_id is the auth.users FK so we can always
-- resolve gym_id from a JWT without an extra lookup.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gyms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT        NOT NULL,
  cnpj        TEXT,
  descricao   TEXT,
  -- Structured address stored as JSONB:
  -- { "rua": "", "numero": "", "bairro": "", "cidade": "", "estado": "", "cep": "" }
  endereco    JSONB       NOT NULL DEFAULT '{}',
  -- Array of offered sports / class types
  modalidades TEXT[]      NOT NULL DEFAULT '{}',
  -- Weekly schedule stored as JSONB:
  -- { "segunda": "06:00-22:00", "sabado": "08:00-18:00", "domingo": "Fechado", ... }
  horarios    JSONB       NOT NULL DEFAULT '{}',
  -- Public URLs of gallery images (Supabase Storage bucket: gym-photos)
  fotos       TEXT[]      NOT NULL DEFAULT '{}',
  logo_url    TEXT,
  website     TEXT,
  telefone    TEXT,
  instagram   TEXT,
  -- FALSE = hidden from marketplace / soft-deleted
  ativo       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS gyms_set_updated_at ON public.gyms;
CREATE TRIGGER gyms_set_updated_at
  BEFORE UPDATE ON public.gyms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3.2  GYM PLANS
-- Each gym defines one or more membership plans with pricing.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_plans (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id        UUID        NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  nome          TEXT        NOT NULL,
  descricao     TEXT,
  preco         NUMERIC(8,2) NOT NULL CHECK (preco >= 0),
  duracao_dias  INTEGER     NOT NULL CHECK (duracao_dias > 0),
  beneficios    TEXT[]      NOT NULL DEFAULT '{}',
  ativo         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3.3  GYM SUBSCRIPTIONS
-- Links an aluno to a gym through one of that gym's plans.
-- expires_at is computed by the caller: starts_at + duracao_dias interval.
-- payment_id is intentionally unkeyed (references a future payments table).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_subscriptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gym_id       UUID        NOT NULL REFERENCES public.gyms(id)     ON DELETE CASCADE,
  plan_id      UUID        NOT NULL REFERENCES public.gym_plans(id) ON DELETE RESTRICT,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  starts_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  -- Nullable reference to a future public.payments table
  payment_id   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active / pending subscription per (aluno, gym) at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_subscriptions_one_active
  ON public.gym_subscriptions (aluno_id, gym_id)
  WHERE status IN ('active', 'pending');

-- -----------------------------------------------------------------------------
-- 3.4  GYM GROUPS
-- Broadcast groups created and owned by the gym (distinct from student_groups).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      UUID        NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3.5  GYM GROUP MEMBERS
-- Many-to-many: which alunos are in which gym group.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_group_members (
  group_id    UUID        NOT NULL REFERENCES public.gym_groups(id) ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, student_id)
);

-- -----------------------------------------------------------------------------
-- 3.6  GYM GROUP MESSAGES
-- Broadcast offers / announcements sent by the gym to one of its groups.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_group_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID        NOT NULL REFERENCES public.gym_groups(id) ON DELETE CASCADE,
  gym_id     UUID        NOT NULL REFERENCES public.gyms(id)       ON DELETE CASCADE,
  gym_name   TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 4 — Indexes
-- =============================================================================

-- gyms
CREATE INDEX IF NOT EXISTS idx_gyms_user_id        ON public.gyms(user_id);
CREATE INDEX IF NOT EXISTS idx_gyms_ativo           ON public.gyms(ativo);
CREATE INDEX IF NOT EXISTS idx_gyms_modalidades     ON public.gyms USING GIN (modalidades);

-- gym_plans
CREATE INDEX IF NOT EXISTS idx_gym_plans_gym        ON public.gym_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_plans_ativo       ON public.gym_plans(ativo);

-- gym_subscriptions
CREATE INDEX IF NOT EXISTS idx_gym_subs_aluno       ON public.gym_subscriptions(aluno_id);
CREATE INDEX IF NOT EXISTS idx_gym_subs_gym         ON public.gym_subscriptions(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_subs_status      ON public.gym_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gym_subs_expires     ON public.gym_subscriptions(expires_at);

-- gym_groups
CREATE INDEX IF NOT EXISTS idx_gym_groups_gym       ON public.gym_groups(gym_id);

-- gym_group_members
CREATE INDEX IF NOT EXISTS idx_gym_grp_members_grp  ON public.gym_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_gym_grp_members_std  ON public.gym_group_members(student_id);

-- gym_group_messages
CREATE INDEX IF NOT EXISTS idx_gym_grp_messages_grp ON public.gym_group_messages(group_id);

-- =============================================================================
-- SECTION 5 — Row Level Security
-- =============================================================================

ALTER TABLE public.gyms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_group_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_group_messages ENABLE ROW LEVEL SECURITY;

-- ── gyms ─────────────────────────────────────────────────────────────────────

-- Academia: full control over their own gym record
CREATE POLICY "gyms: owner CRUD"
  ON public.gyms FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Marketplace: anyone authenticated can browse active gyms
CREATE POLICY "gyms: public read active"
  ON public.gyms FOR SELECT
  USING (ativo = TRUE);

-- Unauthenticated marketplace (anon role)
CREATE POLICY "gyms: anon read active"
  ON public.gyms FOR SELECT
  TO anon
  USING (ativo = TRUE);

-- ── gym_plans ─────────────────────────────────────────────────────────────────

-- Academia: manage plans for their own gym
CREATE POLICY "gym_plans: owner CRUD"
  ON public.gym_plans FOR ALL
  USING  (gym_id = public.my_gym_id())
  WITH CHECK (gym_id = public.my_gym_id());

-- Marketplace: anyone can read active plans for active gyms
CREATE POLICY "gym_plans: public read active"
  ON public.gym_plans FOR SELECT
  USING (
    ativo = TRUE
    AND gym_id IN (SELECT id FROM public.gyms WHERE ativo = TRUE)
  );

CREATE POLICY "gym_plans: anon read active"
  ON public.gym_plans FOR SELECT
  TO anon
  USING (
    ativo = TRUE
    AND gym_id IN (SELECT id FROM public.gyms WHERE ativo = TRUE)
  );

-- ── gym_subscriptions ─────────────────────────────────────────────────────────

-- Academia: read and manage subscriptions to their gym
CREATE POLICY "gym_subscriptions: owner manage"
  ON public.gym_subscriptions FOR ALL
  USING  (gym_id = public.my_gym_id())
  WITH CHECK (gym_id = public.my_gym_id());

-- Aluno: full CRUD on their own subscriptions
CREATE POLICY "gym_subscriptions: aluno CRUD"
  ON public.gym_subscriptions FOR ALL
  USING  (aluno_id = auth.uid())
  WITH CHECK (aluno_id = auth.uid());

-- ── gym_groups ────────────────────────────────────────────────────────────────

-- Academia: CRUD on groups that belong to their gym
CREATE POLICY "gym_groups: owner CRUD"
  ON public.gym_groups FOR ALL
  USING  (gym_id = public.my_gym_id())
  WITH CHECK (gym_id = public.my_gym_id());

-- Members can read groups they were added to
CREATE POLICY "gym_groups: member read"
  ON public.gym_groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.gym_group_members
      WHERE student_id = auth.uid()
    )
  );

-- ── gym_group_members ─────────────────────────────────────────────────────────

-- Academia: manage membership in their own groups
CREATE POLICY "gym_group_members: owner CRUD"
  ON public.gym_group_members FOR ALL
  USING (
    group_id IN (
      SELECT id FROM public.gym_groups WHERE gym_id = public.my_gym_id()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.gym_groups WHERE gym_id = public.my_gym_id()
    )
  );

-- Student: read their own memberships
CREATE POLICY "gym_group_members: student read"
  ON public.gym_group_members FOR SELECT
  USING (student_id = auth.uid());

-- ── gym_group_messages ────────────────────────────────────────────────────────

-- Academia: full control over messages from their gym
CREATE POLICY "gym_group_messages: owner CRUD"
  ON public.gym_group_messages FOR ALL
  USING  (gym_id = public.my_gym_id())
  WITH CHECK (gym_id = public.my_gym_id());

-- Members: read messages in groups they belong to
CREATE POLICY "gym_group_messages: member read"
  ON public.gym_group_messages FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.gym_group_members
      WHERE student_id = auth.uid()
    )
  );

-- ── profiles: academia reads alunos ──────────────────────────────────────────
-- Needed so the gym can search for students when managing group membership.
-- Uses a DO block to avoid "policy already exists" errors on re-runs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'profiles: academia reads alunos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "profiles: academia reads alunos"
        ON public.profiles FOR SELECT
        USING (
          role = 'aluno'
          AND EXISTS (
            SELECT 1 FROM public.gyms WHERE user_id = auth.uid()
          )
        )
    $policy$;
  END IF;
END;
$$;

-- =============================================================================
-- SECTION 6 — View: gym_stats
-- Returns per-gym membership and revenue aggregates.
-- Runs as SECURITY INVOKER (default): each caller only sees rows allowed by
-- the RLS policies on the underlying tables.
--   • A gym owner sees full numbers for their own gym.
--   • An anonymous visitor sees only zeros (subscriptions are private).
-- For a fully public aggregate, promote to SECURITY DEFINER and add a
-- dedicated RLS-bypassing function instead.
-- =============================================================================

CREATE OR REPLACE VIEW public.gym_stats
WITH (security_invoker = TRUE)
AS
SELECT
  g.id                                                              AS gym_id,
  g.nome                                                            AS gym_nome,

  -- All non-cancelled subscriptions (current + historical)
  COUNT(s.id) FILTER (WHERE s.status <> 'cancelled')               AS total_members,

  -- Currently active
  COUNT(s.id) FILTER (WHERE s.status = 'active')                   AS active_members,

  -- Revenue estimate for the current calendar month:
  -- Sum of plan prices for subscriptions that STARTED in this month.
  -- Replace with a real payments table aggregation when available.
  COALESCE(
    SUM(p.preco) FILTER (
      WHERE s.status IN ('active', 'expired')
        AND date_trunc('month', s.starts_at)
            = date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    ),
    0
  )                                                                 AS monthly_revenue

FROM public.gyms            g
LEFT JOIN public.gym_subscriptions s ON s.gym_id  = g.id
LEFT JOIN public.gym_plans         p ON p.id       = s.plan_id

GROUP BY g.id, g.nome;

-- Grant SELECT so the PostgREST API exposes the view
GRANT SELECT ON public.gym_stats TO authenticated;

-- =============================================================================
-- SECTION 7 — Trigger: auto-create gyms row for new academia accounts
-- Extends handle_new_user: if the new profile role is 'academia', insert a
-- minimal gyms row so my_gym_id() is never NULL for them.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_academia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act on academia accounts
  IF NEW.role = 'academia' THEN
    INSERT INTO public.gyms (user_id, nome)
    VALUES (NEW.id, NEW.name)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_academia() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.handle_new_academia() TO authenticated;

DROP TRIGGER IF EXISTS on_academia_profile_created ON public.profiles;
CREATE TRIGGER on_academia_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_academia();

-- =============================================================================
-- END OF MIGRATION
-- After running this script, also:
--   1. Create Storage bucket  "gym-photos"  (public read, authenticated write)
--   2. Update src/services/academia.ts to reference gyms.id via my_gym_id()
-- =============================================================================