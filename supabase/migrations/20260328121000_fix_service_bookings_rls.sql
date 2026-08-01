-- Add Super Admin Access for service_bookings
-- This ensures the hardcoded admin email can ALWAYS see all inquiries
DROP POLICY IF EXISTS "Super Admin Access Service Bookings" ON public.service_bookings;
CREATE POLICY "Super Admin Access Service Bookings"
ON public.service_bookings
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');
