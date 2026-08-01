-- ADD SKILL LEVELS TO PROFILES
-- Adding dedicated columns to track user proficiency as determined by proctored assessments.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS python_level TEXT DEFAULT 'Beginner';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS java_level TEXT DEFAULT 'Beginner';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sql_level TEXT DEFAULT 'Beginner';

-- Verify the columns exist and are accessible via RLS
-- (Profiles table already has RLS enabled from previous migrations)
