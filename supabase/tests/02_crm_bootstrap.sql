-- Stand-ins for the CRM's tables, for the tests that file a contact.
--
-- crm_upsert_contact() is applied from its own migration, as written; these are
-- the tables it reads and writes, with the columns and types the live project
-- has (contact_id is an INTEGER there, whatever 20240320000024 first declared).
-- The two rental tables are here only because that same migration hangs a
-- trigger on one and reads the other — nothing in these tests exercises them.

CREATE TABLE contact_first_names (id SERIAL PRIMARY KEY, first_name TEXT NOT NULL);
CREATE TABLE contact_last_names (id SERIAL PRIMARY KEY, last_name TEXT NOT NULL);
CREATE TABLE contact_emails (id SERIAL PRIMARY KEY, email TEXT NOT NULL);
CREATE TABLE contact_phones (id SERIAL PRIMARY KEY, phone TEXT NOT NULL);
CREATE TABLE contact_sources (id SERIAL PRIMARY KEY, source TEXT NOT NULL UNIQUE);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  first_name_id INTEGER REFERENCES contact_first_names (id),
  last_name_id INTEGER REFERENCES contact_last_names (id),
  email_id INTEGER REFERENCES contact_emails (id),
  phone_id INTEGER REFERENCES contact_phones (id),
  source_id INTEGER REFERENCES contact_sources (id),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE contact_tags (id SERIAL PRIMARY KEY, tag TEXT NOT NULL UNIQUE, color TEXT);
CREATE TABLE contact_tag_assignments (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER,
  tag_id INTEGER REFERENCES contact_tags (id)
);
CREATE TABLE contact_birthdays (id SERIAL PRIMARY KEY, contact_id INTEGER UNIQUE, birthday DATE);

CREATE TABLE rental_application_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_address TEXT,
  property_town TEXT
);
CREATE TABLE rental_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID,
  applicant_first_name TEXT,
  applicant_last_name TEXT,
  applicant_email TEXT,
  applicant_phone TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);
