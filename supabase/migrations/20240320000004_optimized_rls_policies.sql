-- Enable RLS on all tables
ALTER TABLE contact_first_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_last_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_first_names
CREATE POLICY "Allow anonymous inserts to contact_first_names"
ON contact_first_names FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_first_names"
ON contact_first_names FOR SELECT
TO anon
USING (is_active = TRUE);

-- Create policies for contact_last_names
CREATE POLICY "Allow anonymous inserts to contact_last_names"
ON contact_last_names FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_last_names"
ON contact_last_names FOR SELECT
TO anon
USING (is_active = TRUE);

-- Create policies for contact_emails
CREATE POLICY "Allow anonymous inserts to contact_emails"
ON contact_emails FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_emails"
ON contact_emails FOR SELECT
TO anon
USING (is_active = TRUE);

-- Create policies for contact_phones
CREATE POLICY "Allow anonymous inserts to contact_phones"
ON contact_phones FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_phones"
ON contact_phones FOR SELECT
TO anon
USING (is_active = TRUE);

-- Create policies for contact_messages
CREATE POLICY "Allow anonymous inserts to contact_messages"
ON contact_messages FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_messages"
ON contact_messages FOR SELECT
TO anon
USING (is_active = TRUE);

-- Create a secure view for admin access
CREATE OR REPLACE VIEW admin_contact_messages_view AS
SELECT
  cm.id,
  cf.first_name,
  cl.last_name,
  ce.email,
  cp.phone,
  cm.message,
  cm.is_read,
  cm.read_at,
  cm.created_at,
  cm.updated_at,
  ce.is_verified AS email_verified,
  cp.is_verified AS phone_verified
FROM
  contact_messages cm
  LEFT JOIN contact_first_names cf ON cm.first_name_id = cf.id
  LEFT JOIN contact_last_names cl ON cm.last_name_id = cl.id
  LEFT JOIN contact_emails ce ON cm.email_id = ce.id
  LEFT JOIN contact_phones cp ON cm.phone_id = cp.id
WHERE
  cm.is_active = TRUE;

-- Grant access to the admin view
GRANT SELECT ON admin_contact_messages_view TO authenticated;