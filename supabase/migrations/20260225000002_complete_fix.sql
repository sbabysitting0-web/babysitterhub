-- ═══════════════════════════════════════════════════════════════════════════
-- ONE-SHOT FIX: Run this entire block in Supabase SQL Editor
-- Fixes "Booking failed – Your profile is incomplete" error
-- ═══════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Backfill public.users for ALL existing accounts right now
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO public.users (id, role)
SELECT ur.user_id, ur.role::text
FROM public.user_roles ur
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO
    public.users (id, role)
SELECT pp.user_id, 'parent'
FROM public.parent_profiles pp
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE
            u.id = pp.user_id
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO
    public.users (id, role)
SELECT bp.user_id, 'babysitter'
FROM public.babysitter_profiles bp
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE
            u.id = bp.user_id
    )
ON CONFLICT (id) DO NOTHING;

-- Also pull from auth.users in case nothing else matched
INSERT INTO
    public.users (id, role)
SELECT au.id, COALESCE(
        au.raw_user_meta_data ->> 'role', 'parent'
    )
FROM auth.users au
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE
            u.id = au.id
    )
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. RLS policies on public.users so client-side writes work
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;

DROP POLICY IF EXISTS "users_insert_own" ON public.users;

DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_select_own" ON public.users FOR
SELECT TO authenticated USING (id = auth.uid ());

CREATE POLICY "users_insert_own" ON public.users FOR INSERT TO authenticated
WITH
    CHECK (id = auth.uid ());

CREATE POLICY "users_update_own" ON public.users FOR
UPDATE TO authenticated USING (id = auth.uid ())
WITH
    CHECK (id = auth.uid ());

-- ────────────────────────────────────────────────────────────────────────────
-- 3. RPC function: ensure_user_record  (SECURITY DEFINER = bypasses RLS)
--    Client calls this before booking to guarantee the row exists.
-- ────────────────────────────────────────────────────────────────────────────
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_user_record (text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Fix the trigger for future signups
-- ────────────────────────────────────────────────────────────────────────────
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

  IF v_role IS NULL OR v_role NOT IN ('parent', 'babysitter', 'admin') THEN
    v_role := 'parent';
  END IF;

  -- Always create public.users row
  BEGIN
    INSERT INTO public.users (id, role) VALUES (NEW.id, v_role)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: users insert failed for %: %', NEW.id, SQLERRM;
  END;

  -- Record role in user_roles
  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role::public.user_role)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_roles insert failed for %: %', NEW.id, SQLERRM;
  END;

  -- Create matching profile row
  BEGIN
    IF v_role = 'parent' THEN
      INSERT INTO public.parent_profiles (user_id, name) VALUES (NEW.id, v_name)
      ON CONFLICT (user_id) DO NOTHING;
    ELSIF v_role = 'babysitter' THEN
      INSERT INTO public.babysitter_profiles (user_id, name) VALUES (NEW.id, v_name)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();