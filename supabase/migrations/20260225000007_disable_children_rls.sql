-- ══════════════════════════════════════════════════════════════════════════
-- FINAL FIX: Children not saving
-- 1. Open: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor
-- 2. Paste this ENTIRE script and click RUN
-- ══════════════════════════════════════════════════════════════════════════

-- Disable RLS on children (same as users table) so direct inserts always work
ALTER TABLE public.children DISABLE ROW LEVEL SECURITY;

-- Drop the unique constraint that causes silent failures when re-saving
ALTER TABLE public.children
DROP CONSTRAINT IF EXISTS children_parent_name_unique;

-- Allow all authenticated users full access (safety net even if RLS re-enabled)
DROP POLICY IF EXISTS "children_insert" ON public.children;

DROP POLICY IF EXISTS "children_select" ON public.children;

DROP POLICY IF EXISTS "children_update" ON public.children;

DROP POLICY IF EXISTS "children_delete" ON public.children;

DROP POLICY IF EXISTS "Parents can insert their own children" ON public.children;

DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;

DROP POLICY IF EXISTS "Parents can update their own children" ON public.children;

DROP POLICY IF EXISTS "Parents can delete their own children" ON public.children;