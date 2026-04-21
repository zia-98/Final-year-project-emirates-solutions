-- Add admin policy for recommendation_history
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'recommendation_history'
        AND policyname = 'Admins can view all history'
    ) THEN
        CREATE POLICY "Admins can view all history"
        ON public.recommendation_history FOR SELECT
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;
