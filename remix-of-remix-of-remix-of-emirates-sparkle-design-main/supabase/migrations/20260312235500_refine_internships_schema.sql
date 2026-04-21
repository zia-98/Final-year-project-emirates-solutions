-- Refine internships table schema for new requirements
ALTER TABLE public.internships 
ADD COLUMN IF NOT EXISTS training_fee TEXT;

-- We keep company column for now but it will be empty for new entries
-- We ensure stipend is used for stipend type and training_fee for paid type
