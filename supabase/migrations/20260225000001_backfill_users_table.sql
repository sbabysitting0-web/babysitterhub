-- ── Backfill public.users for existing accounts ──────────────────────────────
-- Users who signed up before the trigger was fixed may have parent_profiles /
-- babysitter_profiles rows but no row in public.users, which causes a FK
-- violation when they try to create a booking.

-- Ensure RLS won't block the service-role backfill
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Backfill from user_roles (most reliable source of role info)
INSERT INTO public.users (id, role)
SELECT ur.user_id, ur.role::text
FROM public.user_roles ur
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Also backfill any parent_profiles that still have no users row
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

-- Also backfill any babysitter_profiles that still have no users row
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

-- Add RLS policies so authenticated users can read/update their own row
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