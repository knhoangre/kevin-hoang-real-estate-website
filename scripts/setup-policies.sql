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
USING (true);

-- Create policies for contact_last_names
CREATE POLICY "Allow anonymous inserts to contact_last_names"
ON contact_last_names FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_last_names"
ON contact_last_names FOR SELECT
TO anon
USING (true);

-- Create policies for contact_emails
CREATE POLICY "Allow anonymous inserts to contact_emails"
ON contact_emails FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_emails"
ON contact_emails FOR SELECT
TO anon
USING (true);

-- Create policies for contact_phones
CREATE POLICY "Allow anonymous inserts to contact_phones"
ON contact_phones FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_phones"
ON contact_phones FOR SELECT
TO anon
USING (true);

-- Create policies for contact_messages
CREATE POLICY "Allow anonymous inserts to contact_messages"
ON contact_messages FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_messages"
ON contact_messages FOR SELECT
TO anon
USING (true);