-- Add home_anniversary field to contacts

-- Create contact_home_anniversaries table
CREATE TABLE IF NOT EXISTS contact_home_anniversaries (
  id SERIAL PRIMARY KEY,
  contact_id TEXT NOT NULL UNIQUE, -- References unified_contacts contact_id
  home_anniversary DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_contact_home_anniversaries_contact_id ON contact_home_anniversaries (contact_id);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_home_anniversaries_updated_at
BEFORE UPDATE ON contact_home_anniversaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE contact_home_anniversaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_home_anniversaries
CREATE POLICY "Allow admins to view all contact_home_anniversaries"
  ON contact_home_anniversaries FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Allow admins to insert contact_home_anniversaries"
  ON contact_home_anniversaries FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to update contact_home_anniversaries"
  ON contact_home_anniversaries FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to delete contact_home_anniversaries"
  ON contact_home_anniversaries FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Update unified_contacts view to include home_anniversary
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
  cha.home_anniversary,
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
LEFT JOIN contact_home_anniversaries cha ON cc.contact_id = cha.contact_id
LEFT JOIN contact_addresses ca ON cc.contact_id = ca.contact_id
LEFT JOIN contact_tag_assignments cta ON cc.contact_id = cta.contact_id
LEFT JOIN contact_tags ct ON cta.tag_id = ct.id
GROUP BY cc.contact_id, cc.first_name, cc.last_name, cc.email, cc.phone, cc.last_contact_at, cc.sources, cc.message_count, cc.open_house_count, cb.birthday, cha.home_anniversary;
