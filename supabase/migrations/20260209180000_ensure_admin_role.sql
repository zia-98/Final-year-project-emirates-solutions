-- 1. Ensure the admin user exists in public.profiles (if matched by email in auth.users)
-- Note: We cannot easily SELECT from auth.users in a migration due to permissions, 
-- but we can add a policy that allows the specific email to bypass checks if existing policies fail.

-- 2. Add a special RLS policy for the hardcoded admin email to match Frontend logic
-- This is a backup in case the user isn't correctly assigned the role in user_roles table

-- Allow 'admin@gmail.com' to do ANYTHING on ALL admin-restricted tables

-- Products
CREATE POLICY "Super Admin Access Products"
ON public.products
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Internships
CREATE POLICY "Super Admin Access Internships"
ON public.internships
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Internship Applications
CREATE POLICY "Super Admin Access Applications"
ON public.internship_applications
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Orders
CREATE POLICY "Super Admin Access Orders"
ON public.orders
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Profiles
CREATE POLICY "Super Admin Access Profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Course Enrollments
CREATE POLICY "Super Admin Access Enrollments"
ON public.course_enrollments
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');

-- Newsletter
CREATE POLICY "Super Admin Access Newsletter"
ON public.newsletter_subscriptions
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@gmail.com');
