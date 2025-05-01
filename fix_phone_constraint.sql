-- Drop the existing constraint
ALTER TABLE contact_phones DROP CONSTRAINT IF EXISTS valid_phone;

-- Add a new, more flexible constraint
ALTER TABLE contact_phones ADD CONSTRAINT valid_phone
CHECK (phone ~* '^\d{3}[-]?\d{3}[-]?\d{4}$');