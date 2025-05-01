-- Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS contact_phones;
DROP TABLE IF EXISTS contact_emails;
DROP TABLE IF EXISTS contact_last_names;
DROP TABLE IF EXISTS contact_first_names;

-- Create contact_first_names table with optimizations
CREATE TABLE contact_first_names (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_first_name UNIQUE (first_name)
);

-- Create index on first_name for faster lookups
CREATE INDEX idx_contact_first_names_name ON contact_first_names (first_name);

-- Create contact_last_names table with optimizations
CREATE TABLE contact_last_names (
  id SERIAL PRIMARY KEY,
  last_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_last_name UNIQUE (last_name)
);

-- Create index on last_name for faster lookups
CREATE INDEX idx_contact_last_names_name ON contact_last_names (last_name);

-- Create contact_emails table with optimizations
CREATE TABLE contact_emails (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_email UNIQUE (email),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index on email for faster lookups
CREATE INDEX idx_contact_emails_email ON contact_emails (email);

-- Create contact_phones table with optimizations
CREATE TABLE contact_phones (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_phone UNIQUE (phone),
  CONSTRAINT valid_phone CHECK (phone ~* '^\d{3}-\d{3}-\d{4}$')
);

-- Create index on phone for faster lookups
CREATE INDEX idx_contact_phones_phone ON contact_phones (phone);

-- Create contact_messages table with optimizations
CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY,
  first_name_id INTEGER REFERENCES contact_first_names(id),
  last_name_id INTEGER REFERENCES contact_last_names(id),
  email_id INTEGER REFERENCES contact_emails(id),
  phone_id INTEGER REFERENCES contact_phones(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes on foreign keys for faster joins
CREATE INDEX idx_contact_messages_first_name_id ON contact_messages (first_name_id);
CREATE INDEX idx_contact_messages_last_name_id ON contact_messages (last_name_id);
CREATE INDEX idx_contact_messages_email_id ON contact_messages (email_id);
CREATE INDEX idx_contact_messages_phone_id ON contact_messages (phone_id);

-- Create index on created_at for faster date-based queries
CREATE INDEX idx_contact_messages_created_at ON contact_messages (created_at);

-- Create a view for easy access to complete message data
CREATE OR REPLACE VIEW contact_messages_view AS
SELECT
  cm.id,
  cf.first_name,
  cl.last_name,
  ce.email,
  cp.phone,
  cm.message,
  cm.is_read,
  cm.read_at,
  cm.created_at
FROM
  contact_messages cm
  LEFT JOIN contact_first_names cf ON cm.first_name_id = cf.id
  LEFT JOIN contact_last_names cl ON cm.last_name_id = cl.id
  LEFT JOIN contact_emails ce ON cm.email_id = ce.id
  LEFT JOIN contact_phones cp ON cm.phone_id = cp.id
WHERE
  cm.is_active = TRUE;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_contact_first_names_updated_at
BEFORE UPDATE ON contact_first_names
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_last_names_updated_at
BEFORE UPDATE ON contact_last_names
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_emails_updated_at
BEFORE UPDATE ON contact_emails
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_phones_updated_at
BEFORE UPDATE ON contact_phones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON contact_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();