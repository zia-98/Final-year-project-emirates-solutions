-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of objects {id: 1, text: "Option A"}
  correct_option_id INTEGER NOT NULL,
  domain TEXT NOT NULL, -- 'Python', 'Web Dev', 'AI/ML'
  difficulty TEXT NOT NULL, -- 'Easy', 'Medium', 'Hard'
  skill_tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure questions table (Enable RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything on questions (API access only for security)
CREATE POLICY "Service role can do everything on questions" 
ON public.questions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  score_total FLOAT,
  score_breakdown JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'flagged'
  cheat_logs JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure assessments table
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own assessments
CREATE POLICY "Users can view own assessments" 
ON public.assessments 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Service role can manage assessments
CREATE POLICY "Service role can manage assessments" 
ON public.assessments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Seed some dummy questions
INSERT INTO public.questions (question_text, options, correct_option_id, domain, difficulty, skill_tag)
VALUES 
('What is the output of print(2 ** 3)?', '[{"id": 1, "text": "6"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}]'::jsonb, 2, 'Python', 'Easy', 'Basic Syntax'),
('Which data structure uses LIFO?', '[{"id": 1, "text": "Queue"}, {"id": 2, "text": "Stack"}, {"id": 3, "text": "Array"}]'::jsonb, 2, 'Data Structures', 'Easy', 'Stacks'),
('What library is used for DataFrames in Python?', '[{"id": 1, "text": "Numpy"}, {"id": 2, "text": "Pandas"}, {"id": 3, "text": "Seaborn"}]'::jsonb, 2, 'AI/ML', 'Easy', 'Data Processing'),
('Which keyword is used to define a function in Python?', '[{"id": 1, "text": "func"}, {"id": 2, "text": "def"}, {"id": 3, "text": "function"}]'::jsonb, 2, 'Python', 'Easy', 'Functions'),
('What does HTML stand for?', '[{"id": 1, "text": "Hyper Text Markup Language"}, {"id": 2, "text": "High Tech Modern Language"}, {"id": 3, "text": "Hyper Transfer Mark Language"}]'::jsonb, 1, 'Web Development', 'Easy', 'HTML'),
('In React, what is used to pass data to a component?', '[{"id": 1, "text": "State"}, {"id": 2, "text": "Props"}, {"id": 3, "text": "Hooks"}]'::jsonb, 2, 'Web Development', 'Medium', 'React'),
('Which algorithm is used for classification?', '[{"id": 1, "text": "Linear Regression"}, {"id": 2, "text": "K-Means"}, {"id": 3, "text": "Logistic Regression"}]'::jsonb, 3, 'AI/ML', 'Medium', 'Algorithms');
