-- Create contact_first_names table
CREATE TABLE IF NOT EXISTS contact_first_names (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_last_names table
CREATE TABLE IF NOT EXISTS contact_last_names (
  id SERIAL PRIMARY KEY,
  last_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_emails table
CREATE TABLE IF NOT EXISTS contact_emails (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_phones table
CREATE TABLE IF NOT EXISTS contact_phones (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  first_name_id INTEGER REFERENCES contact_first_names(id),
  last_name_id INTEGER REFERENCES contact_last_names(id),
  email_id INTEGER REFERENCES contact_emails(id),
  phone_id INTEGER REFERENCES contact_phones(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);