-- Add policy to allow admins to view all user profiles
-- This is necessary for the AdminUsers page to function correctly
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));