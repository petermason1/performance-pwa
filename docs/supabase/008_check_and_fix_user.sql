-- Check if user exists
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'pete.mason80@gmail.com';

-- If user doesn't exist, you need to create it via Dashboard:
-- Authentication → Users → Add User
-- Email: pete.mason80@gmail.com
-- Password: (your choice)
-- ✅ Auto Confirm User: ON

-- If user exists but email_confirmed_at is NULL, run this to confirm:
-- Note: confirmed_at is auto-generated, so we only update email_confirmed_at
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'pete.mason80@gmail.com'
RETURNING id, email, email_confirmed_at, confirmed_at;

-- Check public.users entry (should be auto-created by trigger)
SELECT 
  u.id,
  u.email,
  u.display_name,
  au.email_confirmed_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'pete.mason80@gmail.com';

