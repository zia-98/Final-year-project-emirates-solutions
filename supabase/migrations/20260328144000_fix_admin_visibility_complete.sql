-- 1. Ensure admin@gmail.com has the 'admin' role in public.user_roles
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

-- 2. Update Orders policy to be more robust
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (
    public.has_role(auth.uid(), 'admin') 
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@gmail.com'
);

-- 3. Update Profiles policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
    public.has_role(auth.uid(), 'admin')
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@gmail.com'
);

-- 4. Ensure Recommendation History policy also allows direct email check
DROP POLICY IF EXISTS "Admins can view all history" ON public.recommendation_history;
CREATE POLICY "Admins can view all history"
ON public.recommendation_history FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin')
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@gmail.com'
);
