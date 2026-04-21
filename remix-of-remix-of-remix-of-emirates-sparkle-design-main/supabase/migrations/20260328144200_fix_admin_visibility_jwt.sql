-- Final Fix for Admin Visibility using JWT Claims
-- auth.jwt() is the most reliable way to check user email in RLS

-- 1. Ensure the user_roles entry is there (fallback)
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@gmail.com';
    IF admin_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

-- 2. Update Orders policy with JWT check
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (
    public.has_role(auth.uid(), 'admin') 
    OR (auth.jwt() ->> 'email') = 'admin@gmail.com'
);

-- 3. Update Profiles policy with JWT check
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
    public.has_role(auth.uid(), 'admin')
    OR (auth.jwt() ->> 'email') = 'admin@gmail.com'
);

-- 4. Update Recommendation History policy with JWT check
DROP POLICY IF EXISTS "Admins can view all history" ON public.recommendation_history;
CREATE POLICY "Admins can view all history"
ON public.recommendation_history FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin')
    OR (auth.jwt() ->> 'email') = 'admin@gmail.com'
);

-- 5. Force specific bypass for feedbacks just in case
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedbacks;
CREATE POLICY "Admins can view all feedback"
ON public.feedbacks FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin')
    OR (auth.jwt() ->> 'email') = 'admin@gmail.com'
);
