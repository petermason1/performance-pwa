-- Create a function to invite a member to a band
-- This function can check auth.users (which we can't query directly from client)
-- and add them to band_members

CREATE OR REPLACE FUNCTION public.invite_band_member(
  p_band_id UUID,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS for this function
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  -- Check if user exists
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found with that email. They must sign up first.'
    );
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.band_members
    WHERE band_id = p_band_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is already a member of this band'
    );
  END IF;

  -- Add user to band
  INSERT INTO public.band_members (band_id, user_id, role)
  VALUES (p_band_id, v_user_id, 'member')
  ON CONFLICT (band_id, user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Member added successfully'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.invite_band_member(UUID, TEXT) TO authenticated;

