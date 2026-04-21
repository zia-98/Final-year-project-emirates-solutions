
-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Update handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  sanitized_name TEXT;
  sanitized_username TEXT;
BEGIN
  -- Sanitize and validate full_name from metadata (limit to 100 chars, trim whitespace)
  sanitized_name := NULLIF(TRIM(LEFT(COALESCE(new.raw_user_meta_data ->> 'full_name', ''), 100)), '');
  
  -- Sanitize and validate username from metadata (limit to 50 chars, trim whitespace)
  sanitized_username := NULLIF(TRIM(LEFT(COALESCE(new.raw_user_meta_data ->> 'username', ''), 50)), '');
  
  -- If username is not provided, we could optionally generate one from email or fallback to null
  -- For now, we'll just insert what we have.
  
  INSERT INTO public.profiles (id, full_name, email, username)
  VALUES (
    new.id, 
    sanitized_name,
    LEFT(new.email, 255),
    sanitized_username
  );
  RETURN new;
END;
$$;
