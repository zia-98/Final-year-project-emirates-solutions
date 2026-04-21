-- Add stock tracking columns to internships table
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS available_slots INTEGER DEFAULT 10;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS total_slots INTEGER DEFAULT 10;

-- Function to decrement internship slots when an application is submitted
CREATE OR REPLACE FUNCTION public.handle_internship_slot_decrement()
RETURNS TRIGGER AS $$
BEGIN
  -- We only decrement if there's enough room
  UPDATE public.internships
  SET available_slots = available_slots - 1
  WHERE id = NEW.program_id AND available_slots > 0;
  
  -- Create a notification for the admin if slots are low
  -- (Assuming we will handle email via edge functions or app-layer logic as well)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrement slots
DROP TRIGGER IF EXISTS tr_internship_slot_decrement ON public.internship_applications;
CREATE TRIGGER tr_internship_slot_decrement
AFTER INSERT ON public.internship_applications
FOR EACH ROW
EXECUTE FUNCTION public.handle_internship_slot_decrement();

-- Update current internships to have some default available_slots based on 'spots' if possible
-- This is a one-time migration logic
UPDATE public.internships 
SET available_slots = 10, total_slots = 10 
WHERE available_slots IS NULL;

-- Enable realtime for internships to show live stock updates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'internships') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internships;
  END IF;
END $$;
