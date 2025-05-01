-- First, disable RLS on all tables
ALTER TABLE contact_first_names DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_last_names DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_phones DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;

-- Then, drop all existing policies
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_first_names" ON contact_first_names;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_first_names" ON contact_first_names;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_first_names_new" ON contact_first_names;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_first_names_new" ON contact_first_names;

DROP POLICY IF EXISTS "Allow anonymous inserts to contact_last_names" ON contact_last_names;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_last_names" ON contact_last_names;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_last_names_new" ON contact_last_names;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_last_names_new" ON contact_last_names;

DROP POLICY IF EXISTS "Allow anonymous inserts to contact_emails" ON contact_emails;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_emails" ON contact_emails;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_emails_new" ON contact_emails;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_emails_new" ON contact_emails;

DROP POLICY IF EXISTS "Allow anonymous inserts to contact_phones" ON contact_phones;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_phones" ON contact_phones;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_phones_new" ON contact_phones;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_phones_new" ON contact_phones;

DROP POLICY IF EXISTS "Allow anonymous inserts to contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_messages_new" ON contact_messages;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_messages_new" ON contact_messages;

-- Now, re-enable RLS
ALTER TABLE contact_first_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_last_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create new, simple policies for all tables
DO $$
BEGIN
    -- Check if policies exist and create them if they don't
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_first_names' AND policyname = 'Allow all operations on contact_first_names') THEN
        CREATE POLICY "Allow all operations on contact_first_names"
        ON contact_first_names FOR ALL
        TO anon
        USING (true)
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_last_names' AND policyname = 'Allow all operations on contact_last_names') THEN
        CREATE POLICY "Allow all operations on contact_last_names"
        ON contact_last_names FOR ALL
        TO anon
        USING (true)
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_emails' AND policyname = 'Allow all operations on contact_emails') THEN
        CREATE POLICY "Allow all operations on contact_emails"
        ON contact_emails FOR ALL
        TO anon
        USING (true)
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_phones' AND policyname = 'Allow all operations on contact_phones') THEN
        CREATE POLICY "Allow all operations on contact_phones"
        ON contact_phones FOR ALL
        TO anon
        USING (true)
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Allow all operations on contact_messages') THEN
        CREATE POLICY "Allow all operations on contact_messages"
        ON contact_messages FOR ALL
        TO anon
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- Also fix the phone constraint to be more flexible
ALTER TABLE contact_phones DROP CONSTRAINT IF EXISTS valid_phone;
ALTER TABLE contact_phones ADD CONSTRAINT valid_phone
CHECK (phone ~* '^\d{3}[-]?\d{3}[-]?\d{4}$');