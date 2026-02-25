-- ══════════════════════════════════════════════════════════════════════════
-- DEFINITIVE ALL-IN-ONE FIX
-- Open: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor
-- Paste this ENTIRE file and click RUN
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Disable RLS on public.users (fixes "Booking failed" FK error) ─────
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ── 2. Backfill public.users for every existing account ──────────────────
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

INSERT INTO
    public.users (id, role)
SELECT au.id, COALESCE(
        au.raw_user_meta_data ->> 'role', 'parent'
    )
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- ── 3. ensure_user_record RPC (bypasses RLS, used before booking) ────────
CREATE OR REPLACE FUNCTION public.ensure_user_record(p_role text DEFAULT 'parent')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, role) VALUES (auth.uid(), p_role)
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_record (text) TO authenticated;

-- ── 4. save_children RPC (bypasses RLS, called from onboarding) ──────────
--    Deletes existing children for the user then inserts the new list.
--    Input: JSON array of {name, age, special_needs}
CREATE OR REPLACE FUNCTION public.save_children(p_children jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  child jsonb;
BEGIN
  -- Remove old children
  DELETE FROM public.children WHERE parent_id = auth.uid();

  -- Insert new ones
  FOR child IN SELECT * FROM jsonb_array_elements(p_children)
  LOOP
    INSERT INTO public.children (parent_id, name, age, special_needs)
    VALUES (
      auth.uid(),
      child->>'name',
      CASE WHEN (child->>'age') IS NOT NULL AND (child->>'age') != ''
           THEN (child->>'age')::int ELSE NULL END,
      NULLIF(child->>'special_needs', '')
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_children (jsonb) TO authenticated;

-- ── 5a. Children unique constraint (needed for upsert fallback) ─────────
ALTER TABLE public.children
DROP CONSTRAINT IF EXISTS children_parent_name_unique;

ALTER TABLE public.children
ADD CONSTRAINT children_parent_name_unique UNIQUE (parent_id, name);

-- ── 5. Children RLS (belt + suspenders alongside the RPC) ────────────────
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "children_insert" ON public.children;

DROP POLICY IF EXISTS "children_select" ON public.children;

DROP POLICY IF EXISTS "children_update" ON public.children;

DROP POLICY IF EXISTS "children_delete" ON public.children;

DROP POLICY IF EXISTS "Parents can insert their own children" ON public.children;

DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;

DROP POLICY IF EXISTS "Parents can update their own children" ON public.children;

DROP POLICY IF EXISTS "Parents can delete their own children" ON public.children;

CREATE POLICY "children_insert" ON public.children FOR INSERT TO authenticated
WITH
    CHECK (parent_id = auth.uid ());

CREATE POLICY "children_select" ON public.children FOR
SELECT TO authenticated USING (parent_id = auth.uid ());

CREATE POLICY "children_update" ON public.children FOR
UPDATE TO authenticated USING (parent_id = auth.uid ())
WITH
    CHECK (parent_id = auth.uid ());

CREATE POLICY "children_delete" ON public.children FOR DELETE TO authenticated USING (parent_id = auth.uid ());

-- ── 6. Fix trigger so new signups always get a public.users row ───────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role text; v_name text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1));
  IF v_role NOT IN ('parent','babysitter','admin') THEN v_role := 'parent'; END IF;
  BEGIN INSERT INTO public.users (id,role) VALUES (NEW.id,v_role) ON CONFLICT (id) DO UPDATE SET role=EXCLUDED.role;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_new_user users: %', SQLERRM; END;
  BEGIN INSERT INTO public.user_roles (user_id,role) VALUES (NEW.id,v_role::public.user_role) ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_new_user roles: %', SQLERRM; END;
  BEGIN
    IF v_role='parent' THEN INSERT INTO public.parent_profiles(user_id,name) VALUES(NEW.id,v_name) ON CONFLICT(user_id) DO NOTHING;
    ELSIF v_role='babysitter' THEN INSERT INTO public.babysitter_profiles(user_id,name) VALUES(NEW.id,v_name) ON CONFLICT(user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_new_user profile: %', SQLERRM; END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();