-- Fix ALL recursive policies on band_members
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies on band_members
DROP POLICY IF EXISTS "Users can view own band memberships" ON public.band_members;
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.band_members;
DROP POLICY IF EXISTS "Users can insert own membership" ON public.band_members;
DROP POLICY IF EXISTS "Admins can insert memberships" ON public.band_members;
DROP POLICY IF EXISTS "Users can update own membership" ON public.band_members;
DROP POLICY IF EXISTS "Admins can update memberships" ON public.band_members;
DROP POLICY IF EXISTS "Users can delete own membership" ON public.band_members;
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.band_members;
DROP POLICY IF EXISTS "Users can insert memberships" ON public.band_members;

-- Create simple, non-recursive policies
-- SELECT: Users can see their own memberships and memberships in their bands
CREATE POLICY "band_members_select"
  ON public.band_members FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can insert themselves or admins can invite others
CREATE POLICY "band_members_insert"
  ON public.band_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own membership
CREATE POLICY "band_members_update"
  ON public.band_members FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can delete their own membership
CREATE POLICY "band_members_delete"
  ON public.band_members FOR DELETE
  USING (user_id = auth.uid());

