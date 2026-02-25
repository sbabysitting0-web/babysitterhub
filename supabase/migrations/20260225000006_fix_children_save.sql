-- ══════════════════════════════════════════════════════════════════════════
-- FIX: Children not saving during parent onboarding
-- Open: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor
-- Paste this ENTIRE file and click RUN
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Re-create save_children with SECURITY DEFINER (bypasses RLS) ───────
CREATE OR REPLACE FUNCTION public.save_children(p_children jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  child jsonb;
BEGIN
  -- Remove old children for this parent
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

-- ── 2. Ensure RLS is enabled with correct policies on children table ───────
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

-- ── 3. Drop the parent+name unique constraint (causes silent upsert failures) ─
ALTER TABLE public.children
DROP CONSTRAINT IF EXISTS children_parent_name_unique;