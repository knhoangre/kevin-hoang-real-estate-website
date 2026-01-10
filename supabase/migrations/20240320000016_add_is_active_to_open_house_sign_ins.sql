-- Add is_active column to open_house_sign_ins table for soft deletes
ALTER TABLE open_house_sign_ins
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index on is_active for faster queries
CREATE INDEX IF NOT EXISTS idx_open_house_sign_ins_is_active ON open_house_sign_ins (is_active) WHERE is_active = TRUE;

-- Update RLS policies to filter by is_active
DROP POLICY IF EXISTS "Allow service role to read all open_house_sign_ins" ON open_house_sign_ins;

-- Create policy to allow service role to read active records only
CREATE POLICY "Allow service role to read active open_house_sign_ins"
  ON open_house_sign_ins
  FOR SELECT
  TO service_role
  USING (is_active = TRUE);

-- Note: The existing "Allow admins to update open_house_sign_ins" policy 
-- (created in migration 20240320000013) already covers updates including is_active
