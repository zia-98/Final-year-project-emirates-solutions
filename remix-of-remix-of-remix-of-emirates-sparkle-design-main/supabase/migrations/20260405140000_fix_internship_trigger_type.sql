-- Fix the handle_internship_slot_decrement trigger to cast NEW.program_id to uuid
CREATE OR REPLACE FUNCTION public.handle_internship_slot_decrement()
RETURNS TRIGGER AS $$
BEGIN
  -- We only decrement if there's enough room
  UPDATE public.internships
  SET available_slots = available_slots - 1
  WHERE id = (NEW.program_id)::uuid AND available_slots > 0;
  
  -- Create a notification for the admin if slots are low
  -- (Assuming we will handle email via edge functions or app-layer logic as well)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
