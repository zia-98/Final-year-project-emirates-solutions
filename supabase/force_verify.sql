-- FORCE VERIFY EMAIL using your existing SQL Editor
-- Run this single line:

UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'admin@gmail.com';
