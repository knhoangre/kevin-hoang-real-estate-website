-- Create lockboxes table
CREATE TABLE IF NOT EXISTS lockboxes (
  id SERIAL PRIMARY KEY,
  lockbox_type TEXT NOT NULL,
  location TEXT NOT NULL,
  code TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_lockboxes_is_active ON lockboxes (is_active);
CREATE INDEX IF NOT EXISTS idx_lockboxes_status ON lockboxes (status);

-- Enable RLS (Row Level Security)
ALTER TABLE lockboxes ENABLE ROW LEVEL SECURITY;

-- Admins only, for every operation. Unlike `properties`, this table is never
-- opened up for public read: it holds access codes, so this policy is the whole
-- security boundary. The client-side isAdmin check is a UX gate, not a control.
CREATE POLICY "Allow admins full access to lockboxes"
  ON lockboxes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON lockboxes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE lockboxes_id_seq TO authenticated;
