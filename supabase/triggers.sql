-- ─────────────────────────────────────────────────────────────────────────────
-- FitCoach — Auth Trigger
-- Execute AFTER schema.sql and rls.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Trigger function: auto-create a profile row when a new auth user is created.
-- Reads name, role, and personal_id from user metadata set during sign-up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, personal_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno'),
    NULLIF(NEW.raw_user_meta_data->>'personal_id', '')::UUID
  );
  RETURN NEW;
END;
$$;

-- Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
