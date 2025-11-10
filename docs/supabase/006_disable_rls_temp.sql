-- Temporarily disable RLS on bands to test
-- Run this in Supabase SQL Editor

ALTER TABLE public.bands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_members DISABLE ROW LEVEL SECURITY;

