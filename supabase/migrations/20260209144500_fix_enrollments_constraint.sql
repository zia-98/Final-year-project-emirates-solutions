-- Make user_id optional to allow admin-entered enrollments (which might not be linked to an existing auth user yet)
ALTER TABLE public.course_enrollments ALTER COLUMN user_id DROP NOT NULL;
