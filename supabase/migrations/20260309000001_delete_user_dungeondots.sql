-- Delete user dungeondots235@gmail.com and ALL their data
-- Run in: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor/sql

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user ID from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'dungeondots235@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User not found: dungeondots235@gmail.com';
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting user: %', target_user_id;

  -- Delete all related data (cascade order matters)
  DELETE FROM public.reviews         WHERE parent_id    = target_user_id OR babysitter_id = target_user_id;
  DELETE FROM public.messages        WHERE sender_id    = target_user_id OR receiver_id   = target_user_id;
  DELETE FROM public.bookings        WHERE parent_id    = target_user_id OR babysitter_id = target_user_id;
  DELETE FROM public.children        WHERE parent_id    = target_user_id;
  DELETE FROM public.subscriptions   WHERE parent_id    = target_user_id;
  DELETE FROM public.babysitter_availability WHERE babysitter_id = target_user_id;
  DELETE FROM public.babysitter_profiles WHERE user_id  = target_user_id;
  DELETE FROM public.parent_profiles WHERE user_id      = target_user_id;
  DELETE FROM public.user_roles      WHERE user_id      = target_user_id;
  DELETE FROM public.users           WHERE id           = target_user_id;

  -- Delete from Supabase Auth (this is the final step)
  DELETE FROM auth.users WHERE id = target_user_id;

  RAISE NOTICE 'User and all data successfully deleted.';
END $$;
