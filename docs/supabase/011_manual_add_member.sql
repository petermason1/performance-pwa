-- MANUAL WORKAROUND: Add member directly (if function doesn't work)
-- Replace 'pete.mason80@gmail.com' with the email you want to invite
-- Replace 'YOUR_BAND_ID' with your actual band ID (check bands table)

-- Step 1: Find the user ID
SELECT id, email FROM auth.users WHERE email = 'pete.mason80@gmail.com';

-- Step 2: Find your band ID
SELECT id, name FROM bands WHERE name = 'aaa'; -- or whatever your band name is

-- Step 3: Add the member (replace UUIDs with actual values from above)
INSERT INTO public.band_members (band_id, user_id, role)
SELECT 
  (SELECT id FROM bands WHERE name = 'aaa' LIMIT 1), -- Your band ID
  (SELECT id FROM auth.users WHERE email = 'pete.mason80@gmail.com' LIMIT 1), -- User ID
  'member'
ON CONFLICT (band_id, user_id) DO NOTHING;

-- Verify it worked
SELECT 
  bm.*,
  b.name as band_name,
  u.email as user_email
FROM band_members bm
JOIN bands b ON bm.band_id = b.id
JOIN users u ON bm.user_id = u.id
WHERE b.name = 'aaa';

