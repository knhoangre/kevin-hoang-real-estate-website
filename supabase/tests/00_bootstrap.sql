-- Minimal stand-in for what Supabase provides, so the migrations run as written.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;

CREATE TABLE idx_listings (
  mls_number TEXT PRIMARY KEY,
  status TEXT, prop_type TEXT, prop_subtype TEXT, style TEXT,
  address TEXT, town TEXT, state TEXT, zip TEXT, neighborhood TEXT,
  list_price NUMERIC(12,2), sale_price NUMERIC(12,2), settled_date DATE,
  bedrooms INTEGER, full_baths INTEGER, half_baths INTEGER,
  living_area INTEGER, sqft_above_grade INTEGER, sqft_below_grade INTEGER,
  lot_size NUMERIC(12,2), acres NUMERIC(10,2), year_built INTEGER,
  total_rooms INTEGER, garage_spaces INTEGER, parking_spaces INTEGER,
  basement BOOLEAN, waterfront BOOLEAN, hoa BOOLEAN, hoa_fee NUMERIC(10,2),
  taxes NUMERIC(12,2), tax_year INTEGER, photo_count INTEGER,
  feed TEXT NOT NULL DEFAULT 'active',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
