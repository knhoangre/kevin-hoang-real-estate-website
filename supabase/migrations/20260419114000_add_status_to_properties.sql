-- Add status column to properties for listing badges (e.g. SOLD, UNDER AGREEMENT)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS status TEXT;

-- Optional index for filtering/sorting by status in admin/public listing
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status);
