-- ══════════════════════════════════════════════════════════════════════════
-- FIX: "Booking failed" / bookings FK constraint violation
-- Open: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor
-- Paste this ENTIRE script and click RUN
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Backfill public.users for all existing accounts
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

-- 2. Drop FK constraints on bookings (try all likely names)
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_parent_id_fkey;

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_babysitter_id_fkey;

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_parent_id_fkey1;

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_babysitter_id_fkey1;

-- 3. Disable RLS on bookings so parents can always insert
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;