-- Backfill contacts from existing contact_messages and open_house_sign_ins
-- This ensures all existing messages and open house sign-ins have corresponding contacts
-- This migration is idempotent and can be run multiple times safely

-- Backfill contacts from contact_messages
-- This ensures all existing messages have corresponding contacts
INSERT INTO contacts (first_name_id, last_name_id, email_id, phone_id, source_id, created_at, updated_at, is_active)
SELECT DISTINCT ON (cm.email_id, cm.phone_id)
  cm.first_name_id,
  cm.last_name_id,
  cm.email_id,
  cm.phone_id,
  COALESCE(cm.source_id, (SELECT id FROM contact_sources WHERE source = 'Website' LIMIT 1)),
  cm.created_at,
  COALESCE(cm.updated_at, cm.created_at),
  TRUE
FROM contact_messages cm
WHERE (cm.is_active = TRUE OR cm.is_active IS NULL)
  AND (cm.email_id IS NOT NULL OR cm.phone_id IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM contacts c 
    WHERE (
      (c.email_id = cm.email_id OR (c.email_id IS NULL AND cm.email_id IS NULL))
      AND (c.phone_id = cm.phone_id OR (c.phone_id IS NULL AND cm.phone_id IS NULL))
    )
  )
ORDER BY cm.email_id, cm.phone_id, cm.created_at;

-- Backfill contacts from open_house_sign_ins
-- This ensures all existing open house sign-ins have corresponding contacts
INSERT INTO contacts (first_name_id, last_name_id, email_id, phone_id, source_id, created_at, updated_at, is_active)
SELECT DISTINCT ON (ohs.email_id, ohs.phone_id)
  ohs.first_name_id,
  ohs.last_name_id,
  ohs.email_id,
  ohs.phone_id,
  COALESCE(ohs.source_id, (SELECT id FROM contact_sources WHERE source LIKE 'Open House%' LIMIT 1)),
  ohs.created_at,
  COALESCE(ohs.updated_at, ohs.created_at),
  TRUE
FROM open_house_sign_ins ohs
WHERE (ohs.is_active = TRUE OR ohs.is_active IS NULL)
  AND (ohs.email_id IS NOT NULL OR ohs.phone_id IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM contacts c 
    WHERE (
      (c.email_id = ohs.email_id OR (c.email_id IS NULL AND ohs.email_id IS NULL))
      AND (c.phone_id = ohs.phone_id OR (c.phone_id IS NULL AND ohs.phone_id IS NULL))
    )
  )
ORDER BY ohs.email_id, ohs.phone_id, ohs.created_at;
