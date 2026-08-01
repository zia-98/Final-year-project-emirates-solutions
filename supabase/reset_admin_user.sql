-- 1. Remove the user regarding 'admin@gmail.com' entirely so you can sign up fresh.
-- This ensures Supabase handles the password hashing correctly.

BEGIN;

-- Delete from public tables first (cascading usually handles this, but being safe)
DELETE FROM public.user_roles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@gmail.com');

DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@gmail.com');

-- Delete the user from authentication system
DELETE FROM auth.users 
WHERE email = 'admin@gmail.com';

COMMIT;

-- 2. Verify it's gone
SELECT email FROM auth.users WHERE email = 'admin@gmail.com';
