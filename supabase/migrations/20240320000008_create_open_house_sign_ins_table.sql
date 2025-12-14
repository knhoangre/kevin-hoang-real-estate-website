-- Create contact_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS contact_sources (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index on source for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_sources_source ON contact_sources (source);

-- Create open_house_sign_ins table
CREATE TABLE IF NOT EXISTS open_house_sign_ins (
  id SERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  first_name_id INTEGER REFERENCES contact_first_names(id),
  last_name_id INTEGER REFERENCES contact_last_names(id),
  email_id INTEGER REFERENCES contact_emails(id),
  phone_id INTEGER REFERENCES contact_phones(id),
  source_id INTEGER REFERENCES contact_sources(id),
  works_with_realtor BOOLEAN DEFAULT FALSE,
  realtor_name TEXT,
  realtor_company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_open_house_sign_ins_address ON open_house_sign_ins (address);
CREATE INDEX IF NOT EXISTS idx_open_house_sign_ins_first_name_id ON open_house_sign_ins (first_name_id);
CREATE INDEX IF NOT EXISTS idx_open_house_sign_ins_last_name_id ON open_house_sign_ins (last_name_id);
CREATE INDEX IF NOT EXISTS idx_open_house_sign_ins_email_id ON open_house_sign_ins (email_id);
CREATE INDEX IF NOT EXISTS idx_open_house_sign_ins_phone_id ON open_house_sign_ins (phone_id);
CREATE INDEX IF NOT EXISTS idx_open_house_sign_ins_source_id ON open_house_sign_ins (source_id);
CREATE INDEX IF NOT EXISTS idx_open_house_sign_ins_created_at ON open_house_sign_ins (created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE open_house_sign_ins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for the sign-in form)
CREATE POLICY "Allow public insert on open_house_sign_ins"
  ON open_house_sign_ins
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy to allow service role to read all (for admin access)
CREATE POLICY "Allow service role to read all open_house_sign_ins"
  ON open_house_sign_ins
  FOR SELECT
  TO service_role
  USING (true);

