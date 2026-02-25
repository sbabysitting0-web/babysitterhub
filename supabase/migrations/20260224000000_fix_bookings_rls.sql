-- ── parent_profiles RLS ──────────────────────────────────────────────────────
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can insert their own profile" ON public.parent_profiles;

CREATE POLICY "Parents can insert their own profile" ON public.parent_profiles FOR INSERT TO authenticated
WITH
    CHECK (user_id = auth.uid ());

DROP POLICY IF EXISTS "Parents can upsert their own profile" ON public.parent_profiles;

CREATE POLICY "Parents can upsert their own profile" ON public.parent_profiles FOR
UPDATE TO authenticated USING (user_id = auth.uid ())
WITH
    CHECK (user_id = auth.uid ());

DROP POLICY IF EXISTS "Parents can view their own profile" ON public.parent_profiles;

CREATE POLICY "Parents can view their own profile" ON public.parent_profiles FOR
SELECT TO authenticated USING (user_id = auth.uid ());

-- ── bookings RLS ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow parents to create bookings for themselves
DROP POLICY IF EXISTS "Parents can insert their own bookings" ON public.bookings;

CREATE POLICY "Parents can insert their own bookings" ON public.bookings FOR INSERT TO authenticated
WITH
    CHECK (parent_id = auth.uid ());

-- Allow users to view bookings they are part of
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings" ON public.bookings FOR
SELECT TO authenticated USING (
        parent_id = auth.uid ()
        OR babysitter_id = auth.uid ()
    );

-- Allow parents to cancel (update) their own bookings
DROP POLICY IF EXISTS "Parents can update their own bookings" ON public.bookings;

CREATE POLICY "Parents can update their own bookings" ON public.bookings FOR
UPDATE TO authenticated USING (parent_id = auth.uid ())
WITH
    CHECK (parent_id = auth.uid ());

-- Allow babysitters to update booking status (confirm/complete)
DROP POLICY IF EXISTS "Babysitters can update bookings assigned to them" ON public.bookings;

CREATE POLICY "Babysitters can update bookings assigned to them" ON public.bookings FOR
UPDATE TO authenticated USING (babysitter_id = auth.uid ())
WITH
    CHECK (babysitter_id = auth.uid ());