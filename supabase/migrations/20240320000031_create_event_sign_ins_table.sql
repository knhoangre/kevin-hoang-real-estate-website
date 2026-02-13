-- Create event_sign_ins table (admin-only events sign-in, similar to open_house_sign_ins)
CREATE TABLE IF NOT EXISTS event_sign_ins (
  id SERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  first_name_id INTEGER REFERENCES contact_first_names(id),
  last_name_id INTEGER REFERENCES contact_last_names(id),
  email_id INTEGER REFERENCES contact_emails(id),
  phone_id INTEGER REFERENCES contact_phones(id),
  source_id INTEGER REFERENCES contact_sources(id),
  is_active BOOLEAN DEFAULT TRUE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_sign_ins_event_name ON event_sign_ins (event_name);
CREATE INDEX IF NOT EXISTS idx_event_sign_ins_first_name_id ON event_sign_ins (first_name_id);
CREATE INDEX IF NOT EXISTS idx_event_sign_ins_last_name_id ON event_sign_ins (last_name_id);
CREATE INDEX IF NOT EXISTS idx_event_sign_ins_email_id ON event_sign_ins (email_id);
CREATE INDEX IF NOT EXISTS idx_event_sign_ins_phone_id ON event_sign_ins (phone_id);
CREATE INDEX IF NOT EXISTS idx_event_sign_ins_source_id ON event_sign_ins (source_id);
CREATE INDEX IF NOT EXISTS idx_event_sign_ins_created_at ON event_sign_ins (created_at);
CREATE INDEX IF NOT EXISTS idx_event_sign_ins_is_active ON event_sign_ins (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_event_sign_ins_is_read ON event_sign_ins (is_read) WHERE is_read = FALSE;

ALTER TABLE event_sign_ins ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (via edge function); no public insert
-- Admins can view and update
CREATE POLICY "Allow admins to view all event_sign_ins"
  ON event_sign_ins FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Allow admins to update event_sign_ins"
  ON event_sign_ins FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Inserts are done via edge function using service role (bypasses RLS)
