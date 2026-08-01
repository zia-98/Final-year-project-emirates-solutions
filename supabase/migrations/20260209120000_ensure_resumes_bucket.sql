-- Ensure the 'resumes' bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to ensure clean slate or update
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all resumes" ON storage.objects;

-- Allow authenticated users to upload resumes
CREATE POLICY "Users can upload their own resumes" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own resumes
CREATE POLICY "Users can view their own resumes" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all resumes
CREATE POLICY "Admins can view all resumes" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND public.has_role(auth.uid(), 'admin')
);
