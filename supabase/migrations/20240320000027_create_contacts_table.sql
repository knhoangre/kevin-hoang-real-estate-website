-- Create proper contacts table and remove unified_contacts view
-- This refactors the contact system to use a single contacts table

-- Drop unified_contacts view
DROP VIEW IF EXISTS unified_contacts CASCADE;

-- Drop existing contacts table if it exists (to recreate with correct structure)
DROP TABLE IF EXISTS contacts CASCADE;

-- Create contacts table
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  first_name_id INTEGER REFERENCES contact_first_names(id),
  last_name_id INTEGER REFERENCES contact_last_names(id),
  email_id INTEGER REFERENCES contact_emails(id),
  phone_id INTEGER REFERENCES contact_phones(id),
  source_id INTEGER REFERENCES contact_sources(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
  -- Note: We'll handle uniqueness in application logic since PostgreSQL unique constraints
  -- don't handle NULLs well in composite keys
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_id ON contacts (first_name_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name_id ON contacts (last_name_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email_id ON contacts (email_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_id ON contacts (phone_id);
CREATE INDEX IF NOT EXISTS idx_contacts_source_id ON contacts (source_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts (is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Allow admins to view all contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Allow admins to insert contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to update contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to delete contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Allow anonymous inserts (for website submissions)
CREATE POLICY "Allow anonymous inserts to contacts"
  ON contacts FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous selects (for public access if needed)
CREATE POLICY "Allow anonymous selects from contacts"
  ON contacts FOR SELECT
  TO anon
  USING (is_active = TRUE);

-- Update contact_addresses to reference contacts.id instead of contact_id (TEXT)
-- First check if column exists and what type it is
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'contact_addresses_contact_id_fkey' 
             AND table_name = 'contact_addresses') THEN
    ALTER TABLE contact_addresses DROP CONSTRAINT contact_addresses_contact_id_fkey;
  END IF;
  
  -- Change column type if it's TEXT
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_addresses' 
             AND column_name = 'contact_id' 
             AND data_type = 'text') THEN
    ALTER TABLE contact_addresses DROP COLUMN contact_id;
  END IF;
  
  -- Add new column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contact_addresses' 
                 AND column_name = 'contact_id') THEN
    ALTER TABLE contact_addresses ADD COLUMN contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update contact_tag_assignments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'contact_tag_assignments_contact_id_fkey' 
             AND table_name = 'contact_tag_assignments') THEN
    ALTER TABLE contact_tag_assignments DROP CONSTRAINT contact_tag_assignments_contact_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_tag_assignments' 
             AND column_name = 'contact_id' 
             AND data_type = 'text') THEN
    ALTER TABLE contact_tag_assignments DROP COLUMN contact_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contact_tag_assignments' 
                 AND column_name = 'contact_id') THEN
    ALTER TABLE contact_tag_assignments ADD COLUMN contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE;
  END IF;
  
  -- Update unique constraint
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'contact_tag_assignments_contact_id_tag_id_key' 
             AND table_name = 'contact_tag_assignments') THEN
    ALTER TABLE contact_tag_assignments DROP CONSTRAINT contact_tag_assignments_contact_id_tag_id_key;
  END IF;
  ALTER TABLE contact_tag_assignments ADD CONSTRAINT contact_tag_assignments_contact_id_tag_id_key UNIQUE (contact_id, tag_id);
END $$;

-- Update contact_birthdays
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'contact_birthdays_contact_id_fkey' 
             AND table_name = 'contact_birthdays') THEN
    ALTER TABLE contact_birthdays DROP CONSTRAINT contact_birthdays_contact_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'contact_birthdays_contact_id_key' 
             AND table_name = 'contact_birthdays') THEN
    ALTER TABLE contact_birthdays DROP CONSTRAINT contact_birthdays_contact_id_key;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_birthdays' 
             AND column_name = 'contact_id' 
             AND data_type = 'text') THEN
    ALTER TABLE contact_birthdays DROP COLUMN contact_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contact_birthdays' 
                 AND column_name = 'contact_id') THEN
    ALTER TABLE contact_birthdays ADD COLUMN contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE;
  END IF;
  
  ALTER TABLE contact_birthdays ADD CONSTRAINT contact_birthdays_contact_id_key UNIQUE (contact_id);
END $$;

-- Update contact_home_anniversaries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'contact_home_anniversaries_contact_id_fkey' 
             AND table_name = 'contact_home_anniversaries') THEN
    ALTER TABLE contact_home_anniversaries DROP CONSTRAINT contact_home_anniversaries_contact_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'contact_home_anniversaries_contact_id_key' 
             AND table_name = 'contact_home_anniversaries') THEN
    ALTER TABLE contact_home_anniversaries DROP CONSTRAINT contact_home_anniversaries_contact_id_key;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_home_anniversaries' 
             AND column_name = 'contact_id' 
             AND data_type = 'text') THEN
    ALTER TABLE contact_home_anniversaries DROP COLUMN contact_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contact_home_anniversaries' 
                 AND column_name = 'contact_id') THEN
    ALTER TABLE contact_home_anniversaries ADD COLUMN contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE;
  END IF;
  
  ALTER TABLE contact_home_anniversaries ADD CONSTRAINT contact_home_anniversaries_contact_id_key UNIQUE (contact_id);
END $$;

-- Create a view for easy querying with all related data
CREATE OR REPLACE VIEW contacts_view AS
SELECT 
  c.id as contact_id,
  cf.first_name,
  cl.last_name,
  ce.email,
  cp.phone,
  cs.source,
  cb.birthday,
  cha.home_anniversary,
  c.created_at as last_contact_at,
  c.updated_at,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ca.id,
        'address_line1', ca.address_line1,
        'address_line2', ca.address_line2,
        'city', ca.city,
        'state', ca.state,
        'zip_code', ca.zip_code,
        'country', ca.country,
        'is_primary', ca.is_primary
      )
    ) FILTER (WHERE ca.id IS NOT NULL),
    '[]'::json
  ) as addresses,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ct.id,
        'tag', ct.tag,
        'color', ct.color
      )
    ) FILTER (WHERE ct.id IS NOT NULL),
    '[]'::json
  ) as tags,
  (SELECT COUNT(*) FROM contact_messages cm WHERE cm.email_id = c.email_id OR cm.phone_id = c.phone_id) as message_count,
  (SELECT COUNT(*) FROM open_house_sign_ins ohs WHERE ohs.email_id = c.email_id OR ohs.phone_id = c.phone_id) as open_house_count
FROM contacts c
LEFT JOIN contact_first_names cf ON c.first_name_id = cf.id
LEFT JOIN contact_last_names cl ON c.last_name_id = cl.id
LEFT JOIN contact_emails ce ON c.email_id = ce.id
LEFT JOIN contact_phones cp ON c.phone_id = cp.id
LEFT JOIN contact_sources cs ON c.source_id = cs.id
LEFT JOIN contact_birthdays cb ON c.id = cb.contact_id
LEFT JOIN contact_home_anniversaries cha ON c.id = cha.contact_id
LEFT JOIN contact_addresses ca ON c.id = ca.contact_id
LEFT JOIN contact_tag_assignments cta ON c.id = cta.contact_id
LEFT JOIN contact_tags ct ON cta.tag_id = ct.id
WHERE c.is_active = TRUE
GROUP BY c.id, cf.first_name, cl.last_name, ce.email, cp.phone, cs.source, cb.birthday, cha.home_anniversary, c.created_at, c.updated_at;

-- Migrate existing data from contact_messages and open_house_sign_ins to contacts table
-- This creates contact entries for existing messages and open house sign-ins
-- Use a subquery to avoid duplicates
INSERT INTO contacts (first_name_id, last_name_id, email_id, phone_id, source_id, created_at, updated_at, is_active)
SELECT DISTINCT ON (COALESCE(cm.email_id, 0), COALESCE(cm.phone_id, 0))
  cm.first_name_id,
  cm.last_name_id,
  cm.email_id,
  cm.phone_id,
  COALESCE(cm.source_id, (SELECT id FROM contact_sources WHERE source = 'Website' LIMIT 1)),
  cm.created_at,
  cm.updated_at,
  TRUE
FROM contact_messages cm
WHERE (cm.is_active = TRUE OR cm.is_active IS NULL)
  AND (cm.email_id IS NOT NULL OR cm.phone_id IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM contacts c 
    WHERE c.email_id = cm.email_id 
      AND (c.phone_id = cm.phone_id OR (c.phone_id IS NULL AND cm.phone_id IS NULL))
  );

-- Migrate open house sign-ins
INSERT INTO contacts (first_name_id, last_name_id, email_id, phone_id, source_id, created_at, updated_at, is_active)
SELECT DISTINCT ON (COALESCE(ohs.email_id, 0), COALESCE(ohs.phone_id, 0))
  ohs.first_name_id,
  ohs.last_name_id,
  ohs.email_id,
  ohs.phone_id,
  ohs.source_id,
  ohs.created_at,
  ohs.updated_at,
  TRUE
FROM open_house_sign_ins ohs
WHERE (ohs.is_active = TRUE OR ohs.is_active IS NULL)
  AND (ohs.email_id IS NOT NULL OR ohs.phone_id IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM contacts c 
    WHERE c.email_id = ohs.email_id 
      AND (c.phone_id = ohs.phone_id OR (c.phone_id IS NULL AND ohs.phone_id IS NULL))
  );
