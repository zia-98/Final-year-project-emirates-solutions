-- Fix the product stock decrement trigger to bypass RLS when executed by standard users
CREATE OR REPLACE FUNCTION public.handle_order_stock_decrement()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    UPDATE public.products
    SET stock = GREATEST(0, stock - (item->>'quantity')::integer)
    WHERE id = (item->>'product_id')::uuid;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the internship slot decrement trigger to bypass RLS when executed by standard users
CREATE OR REPLACE FUNCTION public.handle_internship_slot_decrement()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We only decrement if there's enough room
  UPDATE public.internships
  SET available_slots = GREATEST(0, available_slots - 1)
  WHERE id = NEW.program_id AND available_slots > 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
