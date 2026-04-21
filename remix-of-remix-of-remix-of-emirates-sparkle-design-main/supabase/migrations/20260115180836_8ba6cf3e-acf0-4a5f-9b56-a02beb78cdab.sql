-- Make the resumes bucket private (it may already exist)
UPDATE storage.buckets SET public = false WHERE id = 'resumes';

-- Drop any existing policies on resumes bucket objects
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all resumes" ON storage.objects;

-- Allow authenticated users to upload resumes
CREATE POLICY "Users can upload their own resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own resumes
CREATE POLICY "Users can view their own resumes" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all resumes
CREATE POLICY "Admins can view all resumes" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'resumes' 
  AND public.has_role(auth.uid(), 'admin')
);