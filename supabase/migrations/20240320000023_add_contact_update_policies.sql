-- Add policies to allow authenticated admins to INSERT and UPDATE contact tables
-- This is needed for the CRM contact editing functionality

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to insert contact_first_names" ON contact_first_names;
DROP POLICY IF EXISTS "Allow admins to update contact_first_names" ON contact_first_names;
DROP POLICY IF EXISTS "Allow admins to insert contact_last_names" ON contact_last_names;
DROP POLICY IF EXISTS "Allow admins to update contact_last_names" ON contact_last_names;
DROP POLICY IF EXISTS "Allow admins to insert contact_emails" ON contact_emails;
DROP POLICY IF EXISTS "Allow admins to update contact_emails" ON contact_emails;
DROP POLICY IF EXISTS "Allow admins to insert contact_phones" ON contact_phones;
DROP POLICY IF EXISTS "Allow admins to update contact_phones" ON contact_phones;
DROP POLICY IF EXISTS "Allow admins to update contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow admins to update open_house_sign_ins" ON open_house_sign_ins;

-- Create INSERT policies for contact_first_names
CREATE POLICY "Allow admins to insert contact_first_names"
  ON contact_first_names FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Create UPDATE policies for contact_first_names
CREATE POLICY "Allow admins to update contact_first_names"
  ON contact_first_names FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create INSERT policies for contact_last_names
CREATE POLICY "Allow admins to insert contact_last_names"
  ON contact_last_names FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Create UPDATE policies for contact_last_names
CREATE POLICY "Allow admins to update contact_last_names"
  ON contact_last_names FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create INSERT policies for contact_emails
CREATE POLICY "Allow admins to insert contact_emails"
  ON contact_emails FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Create UPDATE policies for contact_emails
CREATE POLICY "Allow admins to update contact_emails"
  ON contact_emails FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create INSERT policies for contact_phones
CREATE POLICY "Allow admins to insert contact_phones"
  ON contact_phones FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Create UPDATE policies for contact_phones
CREATE POLICY "Allow admins to update contact_phones"
  ON contact_phones FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create UPDATE policies for contact_messages (if not already exists from previous migration)
CREATE POLICY "Allow admins to update contact_messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create UPDATE policies for open_house_sign_ins
CREATE POLICY "Allow admins to update open_house_sign_ins"
  ON open_house_sign_ins FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create INSERT policies for contact_sources (needed when creating new sources)
DROP POLICY IF EXISTS "Allow admins to insert contact_sources" ON contact_sources;

CREATE POLICY "Allow admins to insert contact_sources"
  ON contact_sources FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
