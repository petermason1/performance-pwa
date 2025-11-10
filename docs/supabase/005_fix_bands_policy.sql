-- Fix bands INSERT policy
-- Run this in Supabase SQL Editor

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create bands" ON public.bands;

-- Create simpler INSERT policy
CREATE POLICY "bands_insert"
  ON public.bands FOR INSERT
  WITH CHECK (created_by = auth.uid());

