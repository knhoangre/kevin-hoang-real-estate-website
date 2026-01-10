-- Add policy to allow admins to update contact_messages (for mark as read functionality)
DROP POLICY IF EXISTS "Allow admins to update contact_messages" ON contact_messages;

CREATE POLICY "Allow admins to update contact_messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());



