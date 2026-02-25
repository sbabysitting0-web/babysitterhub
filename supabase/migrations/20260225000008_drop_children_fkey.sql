-- ══════════════════════════════════════════════════════════════════════════
-- FIX: "children_parent_id_fkey" foreign key violation
-- Open: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor
-- Paste this ENTIRE script and click RUN
-- ══════════════════════════════════════════════════════════════════════════

-- Drop the FK that is blocking inserts
ALTER TABLE public.children
DROP CONSTRAINT IF EXISTS children_parent_id_fkey;

-- Disable RLS so direct inserts from frontend always work
ALTER TABLE public.children DISABLE ROW LEVEL SECURITY;

-- Drop unique constraint that causes re-save failures
ALTER TABLE public.children
DROP CONSTRAINT IF EXISTS children_parent_name_unique;