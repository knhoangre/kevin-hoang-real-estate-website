-- Update deal stages from old stages to new stages
-- Old: lead, qualification, proposal, closed-won, closed-lost
-- New: lead, client, under-contract, closed, lost

-- First, update existing deals to map old stages to new stages
UPDATE deals
SET stage = CASE
  WHEN stage = 'qualification' THEN 'client'
  WHEN stage = 'proposal' THEN 'under-contract'
  WHEN stage = 'closed-won' THEN 'closed'
  WHEN stage = 'closed-lost' THEN 'lost'
  ELSE stage
END
WHERE stage IN ('qualification', 'proposal', 'closed-won', 'closed-lost');

-- Drop the old CHECK constraint
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;

-- Add new CHECK constraint with updated stages
ALTER TABLE deals
ADD CONSTRAINT deals_stage_check 
CHECK (stage IN ('lead', 'client', 'under-contract', 'closed', 'lost'));

-- Update contact_id column to reference contacts.id (INTEGER) instead of TEXT
-- First, drop the old index if it exists
DROP INDEX IF EXISTS idx_deals_contact_id;

-- Change the column type from TEXT to INTEGER
-- Note: This will fail if there are existing TEXT values that can't be converted
-- We'll need to handle this by clearing invalid contact_ids first
UPDATE deals SET contact_id = NULL WHERE contact_id IS NOT NULL AND contact_id !~ '^[0-9]+$';

-- Now alter the column type
ALTER TABLE deals 
  ALTER COLUMN contact_id TYPE INTEGER USING CASE 
    WHEN contact_id ~ '^[0-9]+$' THEN contact_id::INTEGER 
    ELSE NULL 
  END;

-- Add foreign key constraint to contacts table
ALTER TABLE deals
  ADD CONSTRAINT deals_contact_id_fkey 
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals (contact_id);
