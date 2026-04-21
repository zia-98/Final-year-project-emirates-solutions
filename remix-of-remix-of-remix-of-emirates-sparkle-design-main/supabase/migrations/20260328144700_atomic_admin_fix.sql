-- ATOMIC ADMIN ACCESS FIX
-- This migration provides a guaranteed path for admin@gmail.com to see all data
-- regardless of existing role-based lookups which might be failing.

-- 1. PROFILES Table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin Access Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON public.profiles;

CREATE POLICY "Admin Full Access Profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
);

-- 2. ORDERS Table
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Super Admin Access Orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Full Access Orders" ON public.orders;

CREATE POLICY "Admin Full Access Orders"
ON public.orders
FOR ALL
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
);

-- 3. USER_ROLES Table (Crucial for Admin Management)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin Full Access Roles" ON public.user_roles;
CREATE POLICY "Admin Full Access Roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
);

-- 4. INTERNSHIP_APPLICATIONS Table
DROP POLICY IF EXISTS "Super Admin Access Applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Admin Full Access Applications" ON public.internship_applications;
CREATE POLICY "Admin Full Access Applications"
ON public.internship_applications
FOR ALL
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
);

-- 5. FEEDBACKS Table
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "Admin Full Access Feedback" ON public.feedbacks;
CREATE POLICY "Admin Full Access Feedback"
ON public.feedbacks
FOR ALL
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
);

-- 6. RECOMMENDATION_HISTORY Table
DROP POLICY IF EXISTS "Admins can view all history" ON public.recommendation_history;
DROP POLICY IF EXISTS "Admin Full Access History" ON public.recommendation_history;
CREATE POLICY "Admin Full Access History"
ON public.recommendation_history
FOR ALL
TO authenticated
USING (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com'
    OR public.has_role(auth.uid(), 'admin')
);
