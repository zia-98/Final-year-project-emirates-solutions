-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;

-- Create a restrictive policy that denies direct public inserts
-- The edge function uses service role key which bypasses RLS
CREATE POLICY "Only service role can insert subscriptions"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (false);
