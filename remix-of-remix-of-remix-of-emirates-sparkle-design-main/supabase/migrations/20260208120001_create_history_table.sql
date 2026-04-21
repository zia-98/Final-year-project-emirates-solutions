-- Create recommendation_history table
CREATE TABLE IF NOT EXISTS public.recommendation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_profile JSONB NOT NULL,
    recommendations JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own history (via service role or if we allowed it, but function handles it)
-- Actually, since we use service role in edge function, we just need policies for the user to SELECT their own history.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'recommendation_history'
        AND policyname = 'Users can view their own history'
    ) THEN
        CREATE POLICY "Users can view their own history"
        ON public.recommendation_history FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'recommendation_history'
        AND policyname = 'Users can insert their own history'
    ) THEN
        CREATE POLICY "Users can insert their own history"
        ON public.recommendation_history FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
