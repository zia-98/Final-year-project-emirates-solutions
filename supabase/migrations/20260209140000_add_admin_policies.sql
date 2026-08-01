-- Drop existing policies if they exist to allow clean re-application
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage internships" ON public.internships;

-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all orders
CREATE POLICY "Admins can update all orders" 
ON public.orders 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert/update/delete products
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to list internships (view already covered by public policy, but good to be explicit for other operations)
CREATE POLICY "Admins can manage internships" 
ON public.internships 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
