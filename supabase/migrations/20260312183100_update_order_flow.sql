-- Create a new migration to update order statuses and add payment-related columns

-- Extend order_status enum
-- Note: PostgreSQL doesn't support adding enum values in a transaction with BEGIN/COMMIT easily in some versions/environments.
-- However, for Supabase migrations, we can often just alter the type.
-- If the type exists, we add the new values.

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'cod_pending';

-- Add columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

-- Ensure status default is still pending or maybe pending_payment depending on use case.
-- We'll keep it as pending for now or handle it in the application logic.
