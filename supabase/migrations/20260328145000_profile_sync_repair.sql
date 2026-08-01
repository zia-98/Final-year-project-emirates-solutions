-- EMERGENCY PROFILE AND ROLE SYNCHRONIZATION
-- This script fills the public.profiles table from auth.users to fix empty user lists.

-- 1. Sync all existing auth users into public.profiles
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data ->> 'full_name', email), 
    created_at, 
    COALESCE(last_sign_in_at, created_at)
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

-- 2. Ensure the admin user has the 'admin' role in user_roles
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

-- 3. Verify handle_new_user trigger exists and is correct
-- (Already handled in previous migrations, but the sync above fixes existing orphans)

-- 4. Finalizing RLS for the admin
-- Re-applying the atomic bypass for profiles/orders
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON public.profiles;
CREATE POLICY "Admin Full Access Profiles" ON public.profiles FOR ALL TO authenticated 
USING (LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com' OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin Full Access Orders" ON public.orders;
CREATE POLICY "Admin Full Access Orders" ON public.orders FOR ALL TO authenticated 
USING (LOWER(auth.jwt() ->> 'email') = 'admin@gmail.com' OR public.has_role(auth.uid(), 'admin'));
