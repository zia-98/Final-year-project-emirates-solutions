-- PROCTORED ASSESSMENT SYSTEM SCHEMA
-- This migration creates the infrastructure for secure internship testing.

-- 1. Assessment Templates (Questions)
CREATE TABLE IF NOT EXISTS public.assessment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- e.g., 'Web Development', 'Data Science', 'Marketing'
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_option_index INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Assessment Attempts (User Results & Proctoring Logs)
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    violations_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed', -- 'completed', 'invalidated', 'in_progress'
    proctoring_logs JSONB DEFAULT '[]'::jsonb, -- Store list of visibility/fullscreen violations
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Templates: Anyone can view (to take the test), Admins can manage
DROP POLICY IF EXISTS "Anyone can view assessment templates" ON public.assessment_templates;
CREATE POLICY "Anyone can view assessment templates" ON public.assessment_templates 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage assessment templates" ON public.assessment_templates;
CREATE POLICY "Admins can manage assessment templates" ON public.assessment_templates 
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR (auth.jwt() ->> 'email' = 'admin@gmail.com'));

-- Attempts: Users can view/insert their own, Admins can view all
DROP POLICY IF EXISTS "Users can view own attempts" ON public.assessment_attempts;
CREATE POLICY "Users can view own attempts" ON public.assessment_attempts 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attempts" ON public.assessment_attempts;
CREATE POLICY "Users can insert own attempts" ON public.assessment_attempts 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all attempts" ON public.assessment_attempts;
CREATE POLICY "Admins can view all attempts" ON public.assessment_attempts 
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR (auth.jwt() ->> 'email' = 'admin@gmail.com'));

-- 5. Seed Initial Data
INSERT INTO public.assessment_templates (category, question, options, correct_option_index, difficulty) VALUES
('Web Development', 'What does the "box-sizing: border-box" CSS property do?', '["Includes padding and border in the element''s total width/height", "Excludes padding from the width", "Only affects the border", "Resets the margin"]', 0, 'intermediate'),
('Web Development', 'Which React hook is primarily used for side effects?', '["useState", "useContext", "useEffect", "useMemo"]', 2, 'beginner'),
('Data Science', 'What is the primary purpose of the Pandas library in Python?', '["Machine Learning models", "Data manipulation and analysis", "Web scraping", "Image processing"]', 1, 'beginner'),
('Marketing', 'What does "ROI" stand for in business marketing?', '["Return on Investment", "Reach of Interest", "Rate of Interaction", "Revenue over Income"]', 0, 'beginner'),
('Software Engineering', 'Which data structure follows the LIFO (Last-In, First-Out) principle?', '["Queue", "Linked List", "Stack", "Binary Tree"]', 2, 'intermediate');

-- 6. Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'assessment_attempts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_attempts;
  END IF;
END $$;
