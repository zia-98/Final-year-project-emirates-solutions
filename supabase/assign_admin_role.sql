-- Run this AFTER you have signed up as 'admin@gmail.com' in the browser

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'admin@gmail.com';
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    -- Assign Admin Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Auto-confirm email if not already (just in case)
    UPDATE auth.users
    SET email_confirmed_at = now()
    WHERE id = v_user_id AND email_confirmed_at IS NULL;

    RAISE NOTICE 'SUCCESS: Role assigned to %', v_email;
  ELSE
    RAISE EXCEPTION 'User % not found! Please sign up in the app first.', v_email;
  END IF;
END $$;
