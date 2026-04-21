-- Enable pgcrypto extension if not already enabled (required for password hashing)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Use a transaction block
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'admin@gmail.com';
  v_password text := 'admin@123';
BEGIN
  -- 1. Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  -- 2. If user does not exist, create them
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      role,
      aud,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "System Admin"}',
      now(),
      now()
    );
    
    RAISE NOTICE 'User % created with ID %', v_email, v_user_id;
  ELSE
    -- If user exists, update password AND ensure they are confirmed
    UPDATE auth.users 
    SET 
      encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'User % already exists. Password updated and email confirmed.', v_email;
  END IF;

  -- 3. Ensure the user has the 'admin' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Admin role assigned to user %', v_email;

END $$;
