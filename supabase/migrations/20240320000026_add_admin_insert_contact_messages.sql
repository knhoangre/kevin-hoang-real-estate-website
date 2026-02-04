-- Add INSERT policy for authenticated admins on contact_messages
-- This is needed for CSV import functionality

DROP POLICY IF EXISTS "Allow admins to insert contact_messages" ON contact_messages;

CREATE POLICY "Allow admins to insert contact_messages"
  ON contact_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
