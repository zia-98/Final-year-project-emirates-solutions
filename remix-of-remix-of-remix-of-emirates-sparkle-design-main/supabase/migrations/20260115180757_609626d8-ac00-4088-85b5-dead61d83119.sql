-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can submit applications" ON public.internship_applications;

-- Create a stricter policy requiring authentication
CREATE POLICY "Authenticated users can submit applications" 
ON public.internship_applications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());