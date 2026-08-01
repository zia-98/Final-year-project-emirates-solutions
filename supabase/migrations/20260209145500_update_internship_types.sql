-- Add new values to internship_type enum to support more diverse application types
ALTER TYPE public.internship_type ADD VALUE IF NOT EXISTS 'full-time';
ALTER TYPE public.internship_type ADD VALUE IF NOT EXISTS 'part-time';
ALTER TYPE public.internship_type ADD VALUE IF NOT EXISTS 'remote';
