-- Add source_id column to contact_messages table
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS source_id INTEGER REFERENCES contact_sources(id);

-- Create index on source_id for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_source_id ON contact_messages (source_id);

-- Update the contact_messages_view to include source
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
  cm.created_at,
  cs.source
FROM
  contact_messages cm
  LEFT JOIN contact_first_names cf ON cm.first_name_id = cf.id
  LEFT JOIN contact_last_names cl ON cm.last_name_id = cl.id
  LEFT JOIN contact_emails ce ON cm.email_id = ce.id
  LEFT JOIN contact_phones cp ON cm.phone_id = cp.id
  LEFT JOIN contact_sources cs ON cm.source_id = cs.id
WHERE
  cm.is_active = TRUE;



