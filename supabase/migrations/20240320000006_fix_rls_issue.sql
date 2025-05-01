-- Create a new policy for contact_first_names that allows inserts without checking is_active
CREATE POLICY "Allow anonymous inserts to contact_first_names_new"
ON contact_first_names FOR INSERT
TO anon
WITH CHECK (true);

-- Create a new policy for contact_last_names that allows inserts without checking is_active
CREATE POLICY "Allow anonymous inserts to contact_last_names_new"
ON contact_last_names FOR INSERT
TO anon
WITH CHECK (true);

-- Create a new policy for contact_emails that allows inserts without checking is_active
CREATE POLICY "Allow anonymous inserts to contact_emails_new"
ON contact_emails FOR INSERT
TO anon
WITH CHECK (true);

-- Create a new policy for contact_phones that allows inserts without checking is_active
CREATE POLICY "Allow anonymous inserts to contact_phones_new"
ON contact_phones FOR INSERT
TO anon
WITH CHECK (true);

-- Create a new policy for contact_messages that allows inserts without checking is_active
CREATE POLICY "Allow anonymous inserts to contact_messages_new"
ON contact_messages FOR INSERT
TO anon
WITH CHECK (true);