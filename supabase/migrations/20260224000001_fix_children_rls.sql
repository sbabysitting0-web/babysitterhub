-- ── children RLS ─────────────────────────────────────────────────────────────
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Parents can insert their own children
DROP POLICY IF EXISTS "Parents can insert their own children" ON public.children;

CREATE POLICY "Parents can insert their own children" ON public.children FOR INSERT TO authenticated
WITH
    CHECK (parent_id = auth.uid ());

-- Parents can view their own children
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;

CREATE POLICY "Parents can view their own children" ON public.children FOR
SELECT TO authenticated USING (parent_id = auth.uid ());

-- Parents can update their own children
DROP POLICY IF EXISTS "Parents can update their own children" ON public.children;

CREATE POLICY "Parents can update their own children" ON public.children FOR
UPDATE TO authenticated USING (parent_id = auth.uid ())
WITH
    CHECK (parent_id = auth.uid ());

-- Parents can delete their own children
DROP POLICY IF EXISTS "Parents can delete their own children" ON public.children;

CREATE POLICY "Parents can delete their own children" ON public.children FOR DELETE TO authenticated USING (parent_id = auth.uid ());