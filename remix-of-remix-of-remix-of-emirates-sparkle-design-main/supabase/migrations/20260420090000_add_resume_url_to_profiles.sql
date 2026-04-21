-- Add persisted resume path/url to user profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS resume_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profile_resume_url_length'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profile_resume_url_length CHECK (length(resume_url) <= 500);
  END IF;
END $$;
