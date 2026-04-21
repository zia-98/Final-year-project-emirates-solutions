-- Enable Realtime for core tables to allow immediate updates on the website
-- This adds the tables to the supabase_realtime publication

DO $$
BEGIN
  -- Profiles (Users)
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  
  -- Internships
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'internships') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internships;
  END IF;
  
  -- Orders
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  
  -- Internship Applications
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'internship_applications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internship_applications;
  END IF;
END $$;
