-- Add admin role to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles (is_admin) WHERE is_admin = TRUE;

-- Create a helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id 
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Update RLS policies to allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile or admins can view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Allow admins to update any profile (for managing users)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile or admins can update any"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Allow admins to view all contact messages
CREATE POLICY IF NOT EXISTS "Allow admins to view all contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Allow admins to view all open house sign-ins
CREATE POLICY IF NOT EXISTS "Allow admins to view all open_house_sign_ins"
  ON open_house_sign_ins FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Allow admins to view all contact data (first names, last names, emails, phones)
CREATE POLICY IF NOT EXISTS "Allow admins to view all contact_first_names"
  ON contact_first_names FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY IF NOT EXISTS "Allow admins to view all contact_last_names"
  ON contact_last_names FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY IF NOT EXISTS "Allow admins to view all contact_emails"
  ON contact_emails FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY IF NOT EXISTS "Allow admins to view all contact_phones"
  ON contact_phones FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Allow admins to view contact sources
CREATE POLICY IF NOT EXISTS "Allow admins to view all contact_sources"
  ON contact_sources FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Add comment to explain the admin system
COMMENT ON COLUMN public.profiles.is_admin IS 'Indicates if the user has admin privileges. Admins can view all data in the system.';
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Checks if a user has admin privileges. Returns true if the user is an admin.';

