-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration TEXT,
  level TEXT,
  category TEXT,
  image_url TEXT,
  instructor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure courses table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view courses
CREATE POLICY "Anyone can view courses" 
ON public.courses 
FOR SELECT 
USING (true);

-- Policy: Admins can manage courses (insert, update, delete)
CREATE POLICY "Admins can manage courses" 
ON public.courses 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed some dummy courses
INSERT INTO public.courses (title, description, price, duration, level, category, instructor, image_url)
VALUES 
('Full Stack Web Development', 'Master frontend and backend development with React, Node.js, and SQL.', 299.99, '12 Weeks', 'Intermediate', 'Development', 'John Doe', 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613'),
('Python for Data Science', 'Learn Python programming and its applications in Data Science and ML.', 199.99, '8 Weeks', 'Beginner', 'Data Science', 'Jane Smith', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935'),
('UI/UX Design Masterclass', 'Design beautiful user interfaces and experiences using Figma and Adobe XD.', 149.99, '6 Weeks', 'Beginner', 'Design', 'Alice Johnson', 'https://images.unsplash.com/photo-1561070791-2526d30994b5'),
('Digital Marketing Strategy', 'Learn SEO, SEM, and Social Media Marketing strategies to grow businesses.', 129.99, '5 Weeks', 'Beginner', 'Marketing', 'Bob Wilson', 'https://images.unsplash.com/photo-1533750516457-a7f992034fec');
