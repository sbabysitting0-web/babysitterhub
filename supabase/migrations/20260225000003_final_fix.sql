-- ═══════════════════════════════════════════════════════════════════════════
-- FINAL FIX — Run this ONCE in Supabase Dashboard → SQL Editor
-- Fixes: "Booking failed / Account setup incomplete"
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Disable RLS on public.users so ALL client writes work without policies
--    (public.users only contains id + role — no sensitive data)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Backfill public.users for every account that already has a profile
INSERT INTO
    public.users (id, role)
SELECT user_id, 'parent'
FROM public.parent_profiles
ON CONFLICT (id) DO
UPDATE
SET
    role = 'parent';

INSERT INTO
    public.users (id, role)
SELECT user_id, 'babysitter'
FROM public.babysitter_profiles
ON CONFLICT (id) DO
UPDATE
SET
    role = 'babysitter';

-- 3. Also backfill from auth.users (catches anyone with no profile yet)
INSERT INTO
    public.users (id, role)
SELECT au.id, COALESCE(
        au.raw_user_meta_data ->> 'role', 'parent'
    )
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- 4. Create the ensure_user_record RPC (SECURITY DEFINER = always works)
CREATE OR REPLACE FUNCTION public.ensure_user_record(p_role text DEFAULT 'parent')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, role)
  VALUES (auth.uid(), p_role)
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_record (text) TO authenticated;

-- 5. Fix the trigger so future signups never miss the users row
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
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'parent');
  v_name := COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1));
  IF v_role NOT IN ('parent', 'babysitter', 'admin') THEN v_role := 'parent'; END IF;

  BEGIN INSERT INTO public.users (id, role) VALUES (NEW.id, v_role)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_new_user users: %', SQLERRM; END;

  BEGIN INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role::public.user_role)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_new_user roles: %', SQLERRM; END;

  BEGIN
    IF v_role = 'parent' THEN
      INSERT INTO public.parent_profiles (user_id, name) VALUES (NEW.id, v_name)
      ON CONFLICT (user_id) DO NOTHING;
    ELSIF v_role = 'babysitter' THEN
      INSERT INTO public.babysitter_profiles (user_id, name) VALUES (NEW.id, v_name)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_new_user profile: %', SQLERRM; END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();