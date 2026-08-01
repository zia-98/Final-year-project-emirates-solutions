-- Create feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    category TEXT NOT NULL,
    comment TEXT,
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can insert feedback
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedbacks;
CREATE POLICY "Anyone can submit feedback" 
ON public.feedbacks FOR INSERT 
WITH CHECK (true);

-- Only admins can view all feedback
DROP POLICY IF EXISTS "Admins have full access to feedback" ON public.feedbacks;
CREATE POLICY "Admins have full access to feedback" 
ON public.feedbacks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR (auth.jwt() ->> 'email' = 'admin@gmail.com')
);

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'feedbacks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE feedbacks;
  END IF;
END $$;
