-- Add is_read and read_at columns to open_house_sign_ins table
ALTER TABLE open_house_sign_ins
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create index on is_read for faster queries
CREATE INDEX IF NOT EXISTS idx_open_house_sign_ins_is_read ON open_house_sign_ins (is_read) WHERE is_read = FALSE;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow admins to update open_house_sign_ins" ON open_house_sign_ins;

-- Add policy to allow admins to update is_read status
CREATE POLICY "Allow admins to update open_house_sign_ins"
  ON open_house_sign_ins FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

