-- Allow public read access to active properties
-- This allows everyone (including anonymous users) to view active properties
CREATE POLICY "Allow public read access to active properties"
  ON properties
  FOR SELECT
  TO public
  USING (is_active = TRUE);

-- Grant SELECT permission to anonymous users
GRANT SELECT ON properties TO anon;
