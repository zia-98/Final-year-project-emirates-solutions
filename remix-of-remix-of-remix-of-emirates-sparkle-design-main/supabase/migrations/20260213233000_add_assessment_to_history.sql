-- Add assessment_result column to recommendation_history
ALTER TABLE public.recommendation_history 
ADD COLUMN IF NOT EXISTS assessment_result JSONB;
