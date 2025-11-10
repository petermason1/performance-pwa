-- Fix the trigger to bypass RLS and avoid recursion
-- Run this in Supabase SQL Editor

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_band_created ON public.bands;
DROP FUNCTION IF EXISTS public.handle_new_band();

-- Recreate function with proper security context
CREATE OR REPLACE FUNCTION public.handle_new_band()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert directly, bypassing RLS since we're SECURITY DEFINER
  INSERT INTO public.band_members (band_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_band_created
  AFTER INSERT ON public.bands
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_band();

-- Also simplify the band_members INSERT policies to avoid recursion
DROP POLICY IF EXISTS "Admins can insert memberships" ON public.band_members;
DROP POLICY IF EXISTS "Users can insert own membership" ON public.band_members;

-- Single simple INSERT policy
CREATE POLICY "Users can insert memberships"
  ON public.band_members FOR INSERT
  WITH CHECK (
    -- Either inserting yourself
    user_id = auth.uid()
    OR
    -- Or you're an admin of the band (check without recursion)
    band_id IN (
      SELECT bm.band_id 
      FROM public.band_members bm 
      WHERE bm.user_id = auth.uid() 
        AND bm.role IN ('owner', 'admin')
    )
  );

