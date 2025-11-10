-- Verify the function exists
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'invite_band_member'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- If the above returns nothing, the function doesn't exist
-- Run 009_invite_member_function.sql again

