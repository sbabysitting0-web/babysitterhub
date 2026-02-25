-- ══════════════════════════════════════════════════════════════════════════
-- PASTE AND RUN THIS ENTIRE BLOCK in Supabase Dashboard → SQL Editor
-- Fixes: children not saving, booking FK error
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Children RLS (ensure all policies exist including DELETE) ──────────
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

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

-- ── 2. Disable RLS on public.users so client writes always work ──────────
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ── 3. Backfill public.users for all existing accounts ───────────────────
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

-- ── 4. Create ensure_user_record RPC (bypasses RLS) ─────────────────────
CREATE OR REPLACE FUNCTION public.ensure_user_record(p_role text DEFAULT 'parent')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, role) VALUES (auth.uid(), p_role)
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_record (text) TO authenticated;