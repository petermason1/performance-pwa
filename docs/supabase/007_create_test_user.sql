-- ✅ CREATE TEST USER: pete.mason80@gmail.com
-- 
-- STEP 1: Go to Supabase Dashboard → Authentication → Users → "Add User"
--   - Email: pete.mason80@gmail.com
--   - Password: testpassword123 (or your choice)
--   - ✅ Check "Auto Confirm User" (so they don't need email verification)
--   - Click "Create User"
--
-- STEP 2: The trigger will automatically create the public.users entry!
--   (The handle_new_user() trigger does this automatically)
--
-- STEP 3: Verify it worked (optional - run this SQL):
SELECT 
  u.id, 
  u.email, 
  u.display_name,
  au.email_confirmed_at,
  au.confirmed_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'pete.mason80@gmail.com';

-- Then you can log in at http://localhost:5173 with:
-- Email: pete.mason80@gmail.com
-- Password: testpassword123 (or whatever you set)

