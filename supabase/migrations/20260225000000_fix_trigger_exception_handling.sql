-- ── Fix handle_new_user trigger to never block auth signup ───────────────────
-- Wraps profile/role inserts in an exception handler so that if anything fails
-- (missing table, null role, constraint violation) the auth.users row is still
-- created successfully.  Client code handles profile creation as a fallback.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
BEGIN
  v_role := NEW.raw_user_meta_data ->> 'role';
  v_name := COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1));

  -- Only proceed if role is valid
  IF v_role IS NULL OR v_role NOT IN ('parent', 'babysitter', 'admin') THEN
    RETURN NEW;
  END IF;

  BEGIN
    -- Record role in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::public.user_role)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log but don't block signup
    RAISE WARNING 'handle_new_user: failed to insert user_role for %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    -- Sync to public.users table
    INSERT INTO public.users (id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: failed to upsert users for %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    -- Create matching profile row
    IF v_role = 'parent' THEN
      INSERT INTO public.parent_profiles (user_id, name)
      VALUES (NEW.id, v_name)
      ON CONFLICT (user_id) DO NOTHING;

    ELSIF v_role = 'babysitter' THEN
      INSERT INTO public.babysitter_profiles (user_id, name)
      VALUES (NEW.id, v_name)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: failed to insert profile for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Re-create the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();