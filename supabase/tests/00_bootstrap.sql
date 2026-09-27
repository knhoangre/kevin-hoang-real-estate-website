-- Minimal stand-in for what Supabase provides, so the migrations run as written.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;

-- Supabase's default privileges, which are what make "REVOKE ... FROM PUBLIC"
-- insufficient: every new function in `public` is granted to anon and
-- authenticated BY NAME. Without these lines a missing revoke passes here and
-- ships as a function anyone with the anon key can call, which is exactly what
-- happened to idx_archive_sold() until 2026-09-27.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

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
