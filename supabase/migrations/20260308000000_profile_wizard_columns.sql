-- Profile Wizard extra columns
-- Run this in: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor

-- Babysitter profile extras
ALTER TABLE public.babysitter_profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age_groups_served text[];

-- Parent profile extras
ALTER TABLE public.parent_profiles
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS gender text;
