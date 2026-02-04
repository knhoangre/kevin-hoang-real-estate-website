-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own deals" ON deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON deals;
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
DROP POLICY IF EXISTS "Admins can view all deals" ON deals;
DROP POLICY IF EXISTS "Admins can view all activities" ON activities;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;

-- Drop existing tables (order matters due to foreign keys)
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS deals CASCADE;

-- Drop existing view
DROP VIEW IF EXISTS unified_contacts CASCADE;

-- Create unified contacts view that aggregates data from messages, open houses, and signups
-- This view combines contacts from contact_messages and open_house_sign_ins
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
)
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
HAVING MAX(email) IS NOT NULL OR MAX(phone) IS NOT NULL;

-- Create deals table for CRM pipeline
CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id TEXT, -- References unified_contacts contact_id
  title TEXT NOT NULL,
  value DECIMAL(12, 2), -- Keep for backward compatibility
  house_price DECIMAL(12, 2), -- House/property price
  commission DECIMAL(12, 2), -- Commission amount
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualification', 'proposal', 'closed-won', 'closed-lost')),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for deals
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals (user_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals (contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals (stage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals (created_at);

-- Activities table removed - no longer needed

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_deals_updated_at
BEFORE UPDATE ON deals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activities trigger removed

-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- Activities RLS removed

-- RLS Policies for deals
CREATE POLICY "Users can view their own deals"
  ON deals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals"
  ON deals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Activities policies removed

-- Allow admins to view all deals
CREATE POLICY "Admins can view all deals"
  ON deals FOR SELECT
  TO authenticated
  USING (public.is_admin());
