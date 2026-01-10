-- Fix the is_admin() function to check app_metadata instead of profiles table
-- Since we're using auth.users.app_metadata.is_admin, we need to update the function

-- Drop the old function that checks profiles table
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.is_admin();

-- Create new function that checks app_metadata from auth.users
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (raw_app_meta_data->>'is_admin')::boolean,
      false
    )
    FROM auth.users
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Update comment
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Checks if a user has admin privileges from app_metadata. Returns true if the user is an admin.';



