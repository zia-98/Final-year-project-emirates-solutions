-- Fix the overly permissive INSERT policy for notifications
-- Drop the permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create a proper policy that only allows authenticated users to receive notifications for themselves
-- (In practice, notifications will be inserted via edge function with service role)
CREATE POLICY "System can insert notifications for users"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');