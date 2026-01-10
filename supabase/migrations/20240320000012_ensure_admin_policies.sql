-- Ensure admin policies exist for all tables
-- This migration ensures that admins can view all data after the is_admin() function was updated

-- Drop any existing versions of the function first
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.is_admin();

-- Create the function with UUID parameter
CREATE FUNCTION public.is_admin(user_id UUID)
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

-- Create the function without parameters (uses auth.uid())
CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Drop existing admin policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Allow admins to view all open_house_sign_ins" ON open_house_sign_ins;
DROP POLICY IF EXISTS "Allow admins to view all contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow admins to view all contact_first_names" ON contact_first_names;
DROP POLICY IF EXISTS "Allow admins to view all contact_last_names" ON contact_last_names;
DROP POLICY IF EXISTS "Allow admins to view all contact_emails" ON contact_emails;
DROP POLICY IF EXISTS "Allow admins to view all contact_phones" ON contact_phones;
DROP POLICY IF EXISTS "Allow admins to view all contact_sources" ON contact_sources;

-- Recreate admin policies for open_house_sign_ins
CREATE POLICY "Allow admins to view all open_house_sign_ins"
  ON open_house_sign_ins FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Recreate admin policies for contact_messages
CREATE POLICY "Allow admins to view all contact_messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Recreate admin policies for contact_first_names
CREATE POLICY "Allow admins to view all contact_first_names"
  ON contact_first_names FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Recreate admin policies for contact_last_names
CREATE POLICY "Allow admins to view all contact_last_names"
  ON contact_last_names FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Recreate admin policies for contact_emails
CREATE POLICY "Allow admins to view all contact_emails"
  ON contact_emails FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Recreate admin policies for contact_phones
CREATE POLICY "Allow admins to view all contact_phones"
  ON contact_phones FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Recreate admin policies for contact_sources
CREATE POLICY "Allow admins to view all contact_sources"
  ON contact_sources FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Add comment
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Checks if a user has admin privileges from app_metadata. Returns true if the user is an admin.';

