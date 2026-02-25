-- ── Auto-create profile rows when a user signs up ────────────────────────────
-- This runs as SECURITY DEFINER (superuser) so it bypasses RLS entirely.
-- It reads the role from user metadata set during signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
BEGIN
  v_role := NEW.raw_user_meta_data ->> 'role';
  v_name := COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1));

  -- Record role in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create matching profile row
  IF v_role = 'parent' THEN
    INSERT INTO public.parent_profiles (user_id, name)
    VALUES (NEW.id, v_name)
    ON CONFLICT (user_id) DO NOTHING;

  ELSIF v_role = 'babysitter' THEN
    INSERT INTO public.babysitter_profiles (user_id, name)
    VALUES (NEW.id, v_name)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and re-create the trigger so it's idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── Fix RLS: ensure authenticated users can always read their own profiles ────

-- parent_profiles: add missing policies if not already present
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can insert their own profile" ON public.parent_profiles;

DROP POLICY IF EXISTS "Parents can upsert their own profile" ON public.parent_profiles;

DROP POLICY IF EXISTS "Parents can view their own profile" ON public.parent_profiles;

DROP POLICY IF EXISTS "Parents can update their own profile" ON public.parent_profiles;

CREATE POLICY "parent_profiles_insert" ON public.parent_profiles FOR INSERT TO authenticated
WITH
    CHECK (user_id = auth.uid ());

CREATE POLICY "parent_profiles_select" ON public.parent_profiles FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "parent_profiles_update" ON public.parent_profiles FOR
UPDATE TO authenticated USING (user_id = auth.uid ())
WITH
    CHECK (user_id = auth.uid ());

-- babysitter_profiles: anyone authenticated can read (needed for search/profile pages)
ALTER TABLE public.babysitter_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Babysitters can view own profile" ON public.babysitter_profiles;

DROP POLICY IF EXISTS "Anyone can view babysitter profiles" ON public.babysitter_profiles;

DROP POLICY IF EXISTS "Babysitters can update own profile" ON public.babysitter_profiles;

DROP POLICY IF EXISTS "Babysitters can insert own profile" ON public.babysitter_profiles;

CREATE POLICY "babysitter_profiles_public_select" ON public.babysitter_profiles FOR
SELECT TO authenticated USING (true);

CREATE POLICY "babysitter_profiles_insert" ON public.babysitter_profiles FOR INSERT TO authenticated
WITH
    CHECK (user_id = auth.uid ());

CREATE POLICY "babysitter_profiles_update" ON public.babysitter_profiles FOR
UPDATE TO authenticated USING (user_id = auth.uid ())
WITH
    CHECK (user_id = auth.uid ());

-- user_roles: users can read their own role
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add unique constraint on user_id so upsert onConflict works
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;

DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "user_roles_select" ON public.user_roles FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
WITH
    CHECK (user_id = auth.uid ());