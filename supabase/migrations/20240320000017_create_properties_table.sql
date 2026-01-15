-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  mlsnum TEXT NOT NULL UNIQUE,
  property_type TEXT NOT NULL,
  address TEXT NOT NULL,
  town TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  sale_price DECIMAL(12, 2),
  bedrooms INTEGER,
  full_baths INTEGER,
  half_baths INTEGER,
  living_area INTEGER,
  photo_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_mlsnum ON properties (mlsnum);
CREATE INDEX IF NOT EXISTS idx_properties_town ON properties (town);
CREATE INDEX IF NOT EXISTS idx_properties_zip_code ON properties (zip_code);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties (is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to do everything
CREATE POLICY "Allow admins full access to properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE properties_id_seq TO authenticated;
