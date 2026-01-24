-- Allow public read access to distinct addresses from open_house_sign_ins
-- This enables users to select from previous addresses when creating new open house sign-ins

CREATE POLICY "Allow public read distinct addresses from open_house_sign_ins"
  ON open_house_sign_ins
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);
