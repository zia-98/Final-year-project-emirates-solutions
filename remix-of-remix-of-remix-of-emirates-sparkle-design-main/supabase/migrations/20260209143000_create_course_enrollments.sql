-- Drop table if exists to ensure fresh schema (fixes potential NOT NULL constraint issues on user_id)
DROP TABLE IF EXISTS public.course_enrollments;

-- Create course_enrollments table
CREATE TABLE public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can create enrollments" ON public.course_enrollments;

-- Policies
CREATE POLICY "Admins can manage enrollments" 
ON public.course_enrollments 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own enrollments" 
ON public.course_enrollments 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can create enrollments" 
ON public.course_enrollments 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());
