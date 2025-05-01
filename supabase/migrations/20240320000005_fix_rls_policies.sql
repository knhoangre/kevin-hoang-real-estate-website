-- Drop existing policies if they exist
DO $$
BEGIN
    -- Check if policies exist before dropping them
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_first_names'
        AND policyname = 'Allow anonymous inserts to contact_first_names'
    ) THEN
        DROP POLICY "Allow anonymous inserts to contact_first_names" ON contact_first_names;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_first_names'
        AND policyname = 'Allow anonymous selects from contact_first_names'
    ) THEN
        DROP POLICY "Allow anonymous selects from contact_first_names" ON contact_first_names;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_last_names'
        AND policyname = 'Allow anonymous inserts to contact_last_names'
    ) THEN
        DROP POLICY "Allow anonymous inserts to contact_last_names" ON contact_last_names;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_last_names'
        AND policyname = 'Allow anonymous selects from contact_last_names'
    ) THEN
        DROP POLICY "Allow anonymous selects from contact_last_names" ON contact_last_names;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_emails'
        AND policyname = 'Allow anonymous inserts to contact_emails'
    ) THEN
        DROP POLICY "Allow anonymous inserts to contact_emails" ON contact_emails;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_emails'
        AND policyname = 'Allow anonymous selects from contact_emails'
    ) THEN
        DROP POLICY "Allow anonymous selects from contact_emails" ON contact_emails;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_phones'
        AND policyname = 'Allow anonymous inserts to contact_phones'
    ) THEN
        DROP POLICY "Allow anonymous inserts to contact_phones" ON contact_phones;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_phones'
        AND policyname = 'Allow anonymous selects from contact_phones'
    ) THEN
        DROP POLICY "Allow anonymous selects from contact_phones" ON contact_phones;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_messages'
        AND policyname = 'Allow anonymous inserts to contact_messages'
    ) THEN
        DROP POLICY "Allow anonymous inserts to contact_messages" ON contact_messages;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contact_messages'
        AND policyname = 'Allow anonymous selects from contact_messages'
    ) THEN
        DROP POLICY "Allow anonymous selects from contact_messages" ON contact_messages;
    END IF;
END
$$;

-- Create new policies for contact_first_names
CREATE POLICY "Allow anonymous inserts to contact_first_names"
ON contact_first_names FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_first_names"
ON contact_first_names FOR SELECT
TO anon
USING (true);

-- Create new policies for contact_last_names
CREATE POLICY "Allow anonymous inserts to contact_last_names"
ON contact_last_names FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_last_names"
ON contact_last_names FOR SELECT
TO anon
USING (true);

-- Create new policies for contact_emails
CREATE POLICY "Allow anonymous inserts to contact_emails"
ON contact_emails FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_emails"
ON contact_emails FOR SELECT
TO anon
USING (true);

-- Create new policies for contact_phones
CREATE POLICY "Allow anonymous inserts to contact_phones"
ON contact_phones FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_phones"
ON contact_phones FOR SELECT
TO anon
USING (true);

-- Create new policies for contact_messages
CREATE POLICY "Allow anonymous inserts to contact_messages"
ON contact_messages FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous selects from contact_messages"
ON contact_messages FOR SELECT
TO anon
USING (true);