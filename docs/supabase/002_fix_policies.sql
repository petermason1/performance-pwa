-- Fix recursive policy error in band_members
-- Run this in Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.band_members;

-- Create simpler policies that don't cause recursion
CREATE POLICY "Users can insert own membership"
  ON public.band_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert memberships"
  ON public.band_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_members.band_id 
        AND bm.user_id = auth.uid() 
        AND bm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update own membership"
  ON public.band_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update memberships"
  ON public.band_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_members.band_id 
        AND bm.user_id = auth.uid() 
        AND bm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete own membership"
  ON public.band_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete memberships"
  ON public.band_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_members.band_id 
        AND bm.user_id = auth.uid() 
        AND bm.role IN ('owner', 'admin')
    )
  );

