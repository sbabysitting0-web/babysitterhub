-- ══════════════════════════════════════════════════════════════════════════
-- FIX: invalid input value for enum booking_status: "confirmed"
-- The production DB enum is missing the required values.
-- Open: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor
-- Paste and click RUN
-- ══════════════════════════════════════════════════════════════════════════

-- Add all required enum values (IF NOT EXISTS is safe to run multiple times)
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'pending';

ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'confirmed';

ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'completed';

ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'cancelled';