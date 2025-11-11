-- Fix RLS Policy for Example Songs to allow anonymous reads
-- Run this if example songs aren't showing up in the app

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "All users can view example songs library" ON public.songs;

-- Create a new policy that allows ANYONE (including anonymous) to read example songs
-- This is safe because example songs are read-only and don't contain sensitive data
CREATE POLICY "Anyone can view example songs library"
  ON public.songs FOR SELECT
  USING (band_id = '00000000-0000-0000-0000-000000000001'::UUID);

-- Also ensure the example band itself is viewable
DROP POLICY IF EXISTS "All users can view example songs band" ON public.bands;

CREATE POLICY "Anyone can view example songs band"
  ON public.bands FOR SELECT
  USING (id = '00000000-0000-0000-0000-000000000001'::UUID);

-- Verify the policy works
SELECT 
  COUNT(*) as total_example_songs,
  COUNT(DISTINCT artist) as unique_artists
FROM public.songs
WHERE band_id = '00000000-0000-0000-0000-000000000001'::UUID;

