-- Update internships table schema
ALTER TABLE public.internships 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS stipend TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS spots TEXT;

-- Rename required_skills to skills_required if it exists and skills_required doesn't
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'internships' AND column_name = 'required_skills') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'internships' AND column_name = 'skills_required') THEN
        ALTER TABLE public.internships RENAME COLUMN required_skills TO skills_required;
    END IF;
END $$;

-- Update RLS policies to ensure admin can manage internships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'internships'
        AND policyname = 'Enable all access for admins'
    ) THEN
        CREATE POLICY "Enable all access for admins"
            ON public.internships
            FOR ALL
            TO authenticated
            USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;
