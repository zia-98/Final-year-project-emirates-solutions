-- Migration to add missing columns to orders table
-- These columns are expected by the frontend in CheckoutPage.tsx and OrderHistory.tsx

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Update existing orders if any (optional, but good for consistency)
UPDATE public.orders SET currency = 'INR' WHERE currency IS NULL;
UPDATE public.orders SET order_number = 'ORD-' || id::text WHERE order_number IS NULL;
