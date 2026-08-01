-- Enable Realtime for orders and internships (just in case)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'internship_applications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internship_applications;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;

-- Function to decrement stock when an order is placed
CREATE OR REPLACE FUNCTION public.handle_order_stock_decrement()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    UPDATE public.products
    SET stock = stock - (item->>'quantity')::integer
    WHERE id = (item->>'product_id')::uuid;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrement stock
DROP TRIGGER IF EXISTS tr_order_stock_decrement ON public.orders;
CREATE TRIGGER tr_order_stock_decrement
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_stock_decrement();

-- Function to handle order status updates (create notification for customer)
CREATE OR REPLACE FUNCTION public.handle_order_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      reference_id,
      reference_type
    ) VALUES (
      NEW.user_id,
      'Order Status Update',
      'Your order #' || substring(NEW.id::text, 1, 8) || ' status has been updated to ' || NEW.status || '.',
      CASE 
        WHEN NEW.status = 'delivered' THEN 'success'
        WHEN NEW.status = 'cancelled' THEN 'error'
        ELSE 'info'
      END,
      NEW.id,
      'order'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status updates
DROP TRIGGER IF EXISTS tr_order_status_update ON public.orders;
CREATE TRIGGER tr_order_status_update
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_update();
