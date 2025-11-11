-- ============================================
-- Seed Example Songs into Supabase
-- ============================================
-- 
-- This migration creates a special "Example Songs Library" band and inserts all 86 example songs.
-- All authenticated users can view and copy these songs into their own bands.
--
-- PREREQUISITES:
-- 1. At least one user must exist in auth.users (create one via Supabase Auth first)
-- 2. Run migrations 001-009 before this one
--
-- USAGE:
-- 1. Go to Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- 2. Copy and paste this entire file
-- 3. Click "Run" or press Cmd/Ctrl+Enter
-- 4. Verify the output shows "Example songs seeded successfully!"
--
-- VERIFICATION:
-- After running, check that 86 songs were inserted:
--   SELECT COUNT(*) FROM public.songs WHERE band_id = '00000000-0000-0000-0000-000000000001'::UUID;
--
-- The example songs will be accessible to all authenticated users via the "Example Songs Library" band.

-- ============================================
-- CREATE EXAMPLE SONGS BAND
-- ============================================
-- Use a fixed UUID so we can reference it consistently
-- This band will contain all example songs that users can copy into their own bands

-- Create a service role function to seed example songs
-- This bypasses RLS and allows inserting without a real user
CREATE OR REPLACE FUNCTION seed_example_songs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  example_band_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  -- Use the first user, or raise error if none exists
  admin_user_id UUID := (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);
BEGIN
  -- Require at least one user to exist
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create at least one user before seeding example songs.';
  END IF;

  -- Create the example songs band if it doesn't exist
  INSERT INTO public.bands (id, name, created_by, created_at, updated_at)
  VALUES (
    example_band_id,
    'Example Songs Library',
    admin_user_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Ensure band_members entry exists (trigger should create it, but add fallback)
  INSERT INTO public.band_members (band_id, user_id, role)
  VALUES (example_band_id, admin_user_id, 'owner')
  ON CONFLICT (band_id, user_id) DO NOTHING;

  -- Insert all 86 example songs
  INSERT INTO public.songs (band_id, name, artist, bpm, time_signature, key, created_by, created_at, updated_at)
  VALUES
    -- Arctic Monkeys
    (example_band_id, 'Bet You Look Good on the Dance Floor', 'Arctic Monkeys', 204, 4, NULL, admin_user_id, NOW(), NOW()),
    (example_band_id, 'Mardy Bum', 'Arctic Monkeys', 112, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Ben E. King
    (example_band_id, 'Stand By Me', 'Ben E. King', 118, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Blink 182
    (example_band_id, 'All The Small Things', 'Blink 182', 152, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Blur
    (example_band_id, 'Country House', 'Blur', 175, 4, 'A', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Parklife', 'Blur', 139, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Bruno Mars
    (example_band_id, 'Uptown Funk', 'Bruno Mars', 115, 4, 'C', admin_user_id, NOW(), NOW()),
    
    -- Bryan Adams
    (example_band_id, 'Summer of 69', 'Bryan Adams', 139, 4, 'D', admin_user_id, NOW(), NOW()),
    
    -- Buzzcocks
    (example_band_id, 'Ever Fallen In Love', 'Buzzcocks', 176, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Ed Sheeran
    (example_band_id, 'Castle on the Hill', 'Ed Sheeran', 135, 4, 'D', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Thinking Out Loud', 'Ed Sheeran', 79, 4, 'D', admin_user_id, NOW(), NOW()),
    
    -- Elvis Presley
    (example_band_id, 'Burning Love', 'Elvis Presley', 144, 4, 'D', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Suspicious Minds', 'Elvis Presley', 117, 4, 'G', admin_user_id, NOW(), NOW()),
    
    -- Erasure
    (example_band_id, 'A Little Respect', 'Erasure', 115, 4, 'C', admin_user_id, NOW(), NOW()),
    
    -- Feeder
    (example_band_id, 'Buck Rogers', 'Feeder', 121, 4, 'F', admin_user_id, NOW(), NOW()),
    
    -- Fountains Of Wayne
    (example_band_id, 'Stacey''s Mom', 'Fountains Of Wayne', 118, 4, 'B', admin_user_id, NOW(), NOW()),
    
    -- Frankie Valli
    (example_band_id, 'Can''t Take My Eyes Off You', 'Frankie Valli', 124, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Franz Ferdinand
    (example_band_id, 'Take Me Out', 'Franz Ferdinand', 104, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- George Ezra
    (example_band_id, 'Shotgun', 'George Ezra', 116, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Gerry Cinnamon
    (example_band_id, 'Belter', 'Gerry Cinnamon', 127, 4, 'A', admin_user_id, NOW(), NOW()),
    
    -- Gloria Jones
    (example_band_id, 'Tainted Love', 'Gloria Jones', 166, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Green Day
    (example_band_id, 'Basket Case', 'Green Day', 170, 4, NULL, admin_user_id, NOW(), NOW()),
    (example_band_id, 'Good Riddance (Time of Your Life)', 'Green Day', 95, 4, 'G', admin_user_id, NOW(), NOW()),
    
    -- James
    (example_band_id, 'Sit Down', 'James', 126, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Jason Mraz
    (example_band_id, 'I''m Yours', 'Jason Mraz', 151, 4, 'B major', admin_user_id, NOW(), NOW()),
    
    -- John Legend
    (example_band_id, 'All of Me', 'John Legend (Acoustic)', 120, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Kaiser Chiefs
    (example_band_id, 'I Predict a Riot', 'Kaiser Chiefs', 159, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Kings of Leon
    (example_band_id, 'Sex on Fire', 'Kings of Leon', 153, 4, 'A', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Use Somebody', 'Kings of Leon', 137, 4, 'C', admin_user_id, NOW(), NOW()),
    
    -- Madness
    (example_band_id, 'It Must Be Love', 'Madness', 146, 4, 'G', admin_user_id, NOW(), NOW()),
    
    -- Mark Ronson/Amy Winehouse
    (example_band_id, 'Valerie', 'Mark Ronson/Amy Winehouse', 212, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Mumford and Sons
    (example_band_id, 'Little Lion Man', 'Mumford and Sons', 139, 4, 'F', admin_user_id, NOW(), NOW()),
    
    -- Neil Diamond
    (example_band_id, 'Sweet Caroline', 'Neil Diamond', 126, 4, 'B', admin_user_id, NOW(), NOW()),
    
    -- Oasis
    (example_band_id, 'Cigarettes and Alcohol', 'Oasis', 115, 4, 'D', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Don''t Look Back In Anger', 'Oasis', 82, 4, NULL, admin_user_id, NOW(), NOW()),
    (example_band_id, 'She''s Electric', 'Oasis', 125, 4, NULL, admin_user_id, NOW(), NOW()),
    (example_band_id, 'Wonderwall', 'Oasis', 88, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Ocean Colour Scene
    (example_band_id, 'The Day We Caught The Train', 'Ocean Colour Scene', 89, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Pulp
    (example_band_id, 'Common People', 'Pulp', 145, 4, 'C', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Disco 2000', 'Pulp', 133, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Queen
    (example_band_id, 'Crazy Little Thing Called Love', 'Queen', 154, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Razorlight
    (example_band_id, 'In The Morning', 'Razorlight', 124, 4, 'E', admin_user_id, NOW(), NOW()),
    
    -- Reef
    (example_band_id, 'Place Your Hands', 'Reef', 109, 4, 'D', admin_user_id, NOW(), NOW()),
    
    -- Sam Fender
    (example_band_id, 'Hypersonic Missiles', 'Sam Fender', 131, 4, 'E', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Seventeen Going Under', 'Sam Fender', 162, 4, NULL, admin_user_id, NOW(), NOW()),
    (example_band_id, 'Will We Talk?', 'Sam Fender', 204, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Sixties Medley
    (example_band_id, 'Sixties Medley', NULL, 137, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Snow Patrol
    (example_band_id, 'Chasing Cars', 'Snow Patrol', 104, 4, 'A', admin_user_id, NOW(), NOW()),
    
    -- Stealers Wheels
    (example_band_id, 'Stuck in The Middle with You', 'Stealers Wheels', 124, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Stereophonics
    (example_band_id, 'Dakota', 'Stereophonics', 147, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Stevie Wonder
    (example_band_id, 'Superstition', 'Stevie Wonder', 101, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Stone Roses
    (example_band_id, 'She Bangs the Drums', 'The Stone Roses', 145, 4, 'A', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Waterfall', 'The Stone Roses', 104, 4, 'B', admin_user_id, NOW(), NOW()),
    
    -- The Beatles
    (example_band_id, 'Eight Days a Week', 'The Beatles', 138, 4, NULL, admin_user_id, NOW(), NOW()),
    (example_band_id, 'Saw Her Standing There', 'The Beatles', 160, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Clash
    (example_band_id, 'I Fought The Law', 'The Clash', 151, 4, 'D', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Should I Stay or Should I Go', 'The Clash', 113, 4, 'D', admin_user_id, NOW(), NOW()),
    
    -- The Coral
    (example_band_id, 'Dreaming of You', 'The Coral', 199, 4, 'A', admin_user_id, NOW(), NOW()),
    
    -- The Courteeners
    (example_band_id, 'Not Nineteen Forever', 'The Courteeners', 140, 4, 'D', admin_user_id, NOW(), NOW()),
    
    -- The Cure
    (example_band_id, 'Love Cats', 'The Cure', 92, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Fratellis
    (example_band_id, 'Chelsea Dagger', 'The Fratellis', 155, 4, 'G', admin_user_id, NOW(), NOW()),
    
    -- The Jam
    (example_band_id, 'Going Underground', 'The Jam', 181, 4, 'B', admin_user_id, NOW(), NOW()),
    (example_band_id, 'Town Called Malice', 'The Jam', 204, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Killers
    (example_band_id, 'All These Things I Have Done', 'The Killers', 118, 4, NULL, admin_user_id, NOW(), NOW()),
    (example_band_id, 'Human', 'The Killers', 135, 4, NULL, admin_user_id, NOW(), NOW()),
    (example_band_id, 'Mr. Brightside', 'The Killers', 148, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Kinks
    (example_band_id, 'You Really Got Me', 'The Kinks', 137, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Kooks
    (example_band_id, 'Naïve', 'The Kooks', 103, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Lumineers
    (example_band_id, 'Ho, Hey!', 'The Lumineers', 80, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Police
    (example_band_id, 'Message In a Bottle', 'The Police', 151, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Proclaimers
    (example_band_id, '500 Miles', 'The Proclaimers', 132, 4, 'E', admin_user_id, NOW(), NOW()),
    
    -- The Rolling Stones
    (example_band_id, '(I Can''t Get No) Satisfaction', 'The Rolling Stones', 136, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Smiths
    (example_band_id, 'This Charming Man', 'The Smiths', 208, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Strokes
    (example_band_id, 'Last Night', 'The Strokes', 208, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- The Undertones
    (example_band_id, 'Teenage Kicks', 'The Undertones', 135, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Tina/Ike Turner
    (example_band_id, 'Proud Mary', 'Tina/Ike Turner', 171, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Walk the Moon
    (example_band_id, 'Shut Up and Dance', 'Walk the Moon', 128, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Wheatus
    (example_band_id, 'Teenage Dirtbag', 'Wheatus', 95, 4, 'E', admin_user_id, NOW(), NOW()),
    
    -- CCR
    (example_band_id, 'Bad Moon Rising', 'CCR', 179, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Wizard
    (example_band_id, 'Wish It Could Be Xmas', 'Wizard', 140, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Lizzo
    (example_band_id, 'About Damn Time', 'Lizzo', 109, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Slade
    (example_band_id, 'Merry Xmas Everybody', 'Slade', 130, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Shakin Stevens
    (example_band_id, 'Merry Xmas Everyone', 'Shakin Stevens', 204, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Kenny Loggins
    (example_band_id, 'Footloose', 'Kenny Loggins', 174, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Dua Lipa
    (example_band_id, 'Don''t Start Now', 'Dua Lipa', 124, 4, NULL, admin_user_id, NOW(), NOW()),
    
    -- Miley Cyrus
    (example_band_id, 'Flowers', 'Miley Cyrus', 116, 4, NULL, admin_user_id, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Example songs seeded successfully!';
END $$;

-- Run the seeding function
SELECT seed_example_songs();

-- ============================================
-- UPDATE RLS POLICY TO ALLOW ALL USERS TO READ EXAMPLE SONGS
-- ============================================
-- Allow all authenticated users to view songs from the Example Songs Library band
-- This lets users browse and copy example songs into their own bands

CREATE POLICY "All users can view example songs library"
  ON public.songs FOR SELECT
  USING (band_id = '00000000-0000-0000-0000-000000000001'::UUID);

-- Also allow viewing the example band itself
CREATE POLICY "All users can view example songs band"
  ON public.bands FOR SELECT
  USING (id = '00000000-0000-0000-0000-000000000001'::UUID);

-- ============================================
-- VERIFY
-- ============================================
SELECT 
  COUNT(*) as total_example_songs,
  COUNT(DISTINCT artist) as unique_artists
FROM public.songs
WHERE band_id = '00000000-0000-0000-0000-000000000001'::UUID;

