-- Create service_bookings table
CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_type TEXT NOT NULL,
    brief TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to insert (to support guest inquiries), but normally we'd restrict it to authenticated users or use a CAPTCHA
-- For this project, we'll allow all inserts but restrict selects.
DROP POLICY IF EXISTS "Anyone can submit a booking request" ON public.service_bookings;
CREATE POLICY "Anyone can submit a booking request" 
ON public.service_bookings FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own booking requests" ON public.service_bookings;
CREATE POLICY "Users can view their own booking requests" 
ON public.service_bookings FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to booking requests" ON public.service_bookings;
CREATE POLICY "Admins have full access to booking requests" 
ON public.service_bookings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_bookings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_bookings;
  END IF;
END $$;
