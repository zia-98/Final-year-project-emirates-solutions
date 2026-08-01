-- Drop existing policy if exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage applications" ON public.internship_applications;

-- Allow admins to manage (select, update, delete) internship applications
CREATE POLICY "Admins can manage applications" 
ON public.internship_applications 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure RLS is enabled
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
