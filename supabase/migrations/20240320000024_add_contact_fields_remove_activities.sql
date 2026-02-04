-- Add birthday, addresses, and tags to contacts
-- Remove activities table and related policies

-- Drop activities table and related policies first
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON activities;
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
DROP TABLE IF EXISTS activities CASCADE;

-- Create contact_addresses table
CREATE TABLE IF NOT EXISTS contact_addresses (
  id SERIAL PRIMARY KEY,
  contact_id TEXT NOT NULL, -- References unified_contacts contact_id
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_tags table
CREATE TABLE IF NOT EXISTS contact_tags (
  id SERIAL PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#9b87f5',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_tag_assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id SERIAL PRIMARY KEY,
  contact_id TEXT NOT NULL, -- References unified_contacts contact_id
  tag_id INTEGER REFERENCES contact_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, tag_id)
);

-- Create contact_birthdays table
CREATE TABLE IF NOT EXISTS contact_birthdays (
  id SERIAL PRIMARY KEY,
  contact_id TEXT NOT NULL UNIQUE, -- References unified_contacts contact_id
  birthday DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_addresses_contact_id ON contact_addresses (contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_addresses_primary ON contact_addresses (contact_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact_id ON contact_tag_assignments (contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag_id ON contact_tag_assignments (tag_id);
CREATE INDEX IF NOT EXISTS idx_contact_birthdays_contact_id ON contact_birthdays (contact_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_addresses_updated_at
BEFORE UPDATE ON contact_addresses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_birthdays_updated_at
BEFORE UPDATE ON contact_birthdays
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE contact_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_birthdays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_addresses
CREATE POLICY "Allow admins to view all contact_addresses"
  ON contact_addresses FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Allow admins to insert contact_addresses"
  ON contact_addresses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to update contact_addresses"
  ON contact_addresses FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to delete contact_addresses"
  ON contact_addresses FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- RLS Policies for contact_tags
CREATE POLICY "Allow admins to view all contact_tags"
  ON contact_tags FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Allow admins to insert contact_tags"
  ON contact_tags FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to update contact_tags"
  ON contact_tags FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to delete contact_tags"
  ON contact_tags FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- RLS Policies for contact_tag_assignments
CREATE POLICY "Allow admins to view all contact_tag_assignments"
  ON contact_tag_assignments FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Allow admins to insert contact_tag_assignments"
  ON contact_tag_assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to delete contact_tag_assignments"
  ON contact_tag_assignments FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- RLS Policies for contact_birthdays
CREATE POLICY "Allow admins to view all contact_birthdays"
  ON contact_birthdays FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Allow admins to insert contact_birthdays"
  ON contact_birthdays FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to update contact_birthdays"
  ON contact_birthdays FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to delete contact_birthdays"
  ON contact_birthdays FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Update unified_contacts view to include birthday, addresses, and tags
DROP VIEW IF EXISTS unified_contacts CASCADE;

CREATE OR REPLACE VIEW unified_contacts AS
WITH message_contacts AS (
  SELECT DISTINCT
    COALESCE(ce.email, '') || '_' || COALESCE(cp.phone, '') as contact_id,
    cf.first_name,
    cl.last_name,
    ce.email,
    cp.phone,
    cm.created_at as last_contact_at,
    COALESCE(cs.source, 'Website') as source,
    'message' as contact_type
  FROM contact_messages cm
  LEFT JOIN contact_first_names cf ON cm.first_name_id = cf.id
  LEFT JOIN contact_last_names cl ON cm.last_name_id = cl.id
  LEFT JOIN contact_emails ce ON cm.email_id = ce.id
  LEFT JOIN contact_phones cp ON cm.phone_id = cp.id
  LEFT JOIN contact_sources cs ON cm.source_id = cs.id
  WHERE cm.is_active = TRUE
),
open_house_contacts AS (
  SELECT DISTINCT
    COALESCE(ce.email, '') || '_' || COALESCE(cp.phone, '') as contact_id,
    cf.first_name,
    cl.last_name,
    ce.email,
    cp.phone,
    ohs.created_at as last_contact_at,
    COALESCE(cs.source, 'Open House') as source,
    'open_house' as contact_type
  FROM open_house_sign_ins ohs
  LEFT JOIN contact_first_names cf ON ohs.first_name_id = cf.id
  LEFT JOIN contact_last_names cl ON ohs.last_name_id = cl.id
  LEFT JOIN contact_emails ce ON ohs.email_id = ce.id
  LEFT JOIN contact_phones cp ON ohs.phone_id = cp.id
  LEFT JOIN contact_sources cs ON ohs.source_id = cs.id
  WHERE ohs.is_active = TRUE
),
combined_contacts AS (
  SELECT 
    contact_id,
    MAX(first_name) FILTER (WHERE first_name IS NOT NULL AND first_name != '') as first_name,
    MAX(last_name) FILTER (WHERE last_name IS NOT NULL AND last_name != '') as last_name,
    MAX(email) FILTER (WHERE email IS NOT NULL AND email != '') as email,
    MAX(phone) FILTER (WHERE phone IS NOT NULL AND phone != '') as phone,
    MAX(last_contact_at) as last_contact_at,
    STRING_AGG(DISTINCT source, ', ' ORDER BY source) as sources,
    COUNT(DISTINCT CASE WHEN contact_type = 'message' THEN contact_id END) as message_count,
    COUNT(DISTINCT CASE WHEN contact_type = 'open_house' THEN contact_id END) as open_house_count
  FROM (
    SELECT * FROM message_contacts
    UNION ALL
    SELECT * FROM open_house_contacts
  ) combined
  GROUP BY contact_id
  HAVING MAX(email) IS NOT NULL OR MAX(phone) IS NOT NULL
)
SELECT 
  cc.contact_id,
  cc.first_name,
  cc.last_name,
  cc.email,
  cc.phone,
  cc.last_contact_at,
  cc.sources,
  cc.message_count,
  cc.open_house_count,
  cb.birthday,
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
  ) as tags
FROM combined_contacts cc
LEFT JOIN contact_birthdays cb ON cc.contact_id = cb.contact_id
LEFT JOIN contact_addresses ca ON cc.contact_id = ca.contact_id
LEFT JOIN contact_tag_assignments cta ON cc.contact_id = cta.contact_id
LEFT JOIN contact_tags ct ON cta.tag_id = ct.id
GROUP BY cc.contact_id, cc.first_name, cc.last_name, cc.email, cc.phone, cc.last_contact_at, cc.sources, cc.message_count, cc.open_house_count, cb.birthday;
