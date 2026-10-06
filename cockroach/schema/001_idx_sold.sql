-- Every closed sale MLS PIN has ever sent this site, kept.
--
-- THIS RUNS ON COCKROACHDB, NOT ON SUPABASE. Apply it with the cluster's SQL
-- console or `cockroach sql --url "$SOLD_DB_URL_ADMIN" -f <file>`; it is not in
-- supabase/migrations and `supabase db push` never sees it.
--
-- WHY A SECOND DATABASE.
--
-- MLS PIN's sold feed is a rolling twelve-month window. Supabase's free tier is
-- 500 MB shared with the CRM, so idx-sync has always DELETED sold rows as they
-- aged out, and the archive that outlives the window was cut down to seventeen
-- towns and a third of the columns to fit — 7,101 rows against the 98,921 the
-- feed held on 2026-10-06. Every night a day of closings in the other ~330
-- towns left for good.
--
-- CockroachDB's free allowance is 10 GiB. A year of sales statewide with every
-- column is about 0.2 GiB, so this table is the whole feed, every town, every
-- field, and nothing is ever deleted from it.
--
-- ONE TABLE REPLACES THREE THINGS on the Supabase side: the sold half of
-- idx_listings, idx_sold_archive, and the idx_comp_pool materialized view that
-- existed to union those two. With a single table there is nothing to union and
-- nothing to rebuild nightly.
--
-- THE COLUMNS ARE idx_listings' COLUMNS, name for name, so a row read from here
-- is the same shape the sold tab and the listing page already render. Four are
-- added:
--
--   row_hash        A hash of the feed's row. idx-sync writes a row only when
--                   this differs — see the note on request units below.
--   address_key     The normalised address idx_geocodes is keyed on.
--   lat / lon       Copied from idx_geocodes when the row is written, so the
--                   comp query filters on distance without a second database.
--
-- REQUEST UNITS ARE THE CONSTRAINT, NOT STORAGE. The free allowance is 50
-- million a month, and when it is spent the cluster is disabled until the next
-- one. Rewriting 99,000 rows a night the way the Supabase sync does (every row
-- upserted to stamp synced_at) would cost roughly twice that. So nothing here
-- is "touched": there is no synced_at, no retention sweep, and a night on which
-- nothing changed writes nothing.

CREATE TABLE IF NOT EXISTS idx_sold (
  mls_number STRING PRIMARY KEY,

  status STRING,
  prop_type STRING,
  prop_subtype STRING,
  style STRING,

  address STRING,
  street_no STRING,
  street_name STRING,
  unit_no STRING,
  town STRING,
  town_num STRING,
  state STRING,
  zip STRING,
  neighborhood STRING,

  list_price DECIMAL(12, 2),
  sale_price DECIMAL(12, 2),
  settled_date DATE,

  bedrooms INT8,
  full_baths INT8,
  half_baths INT8,
  total_rooms INT8,
  living_area INT8,
  sqft_above_grade INT8,
  sqft_below_grade INT8,
  lot_size DECIMAL(14, 2),
  acres DECIMAL(12, 2),
  year_built INT8,
  year_built_descrp STRING,
  garage_spaces INT8,
  parking_spaces INT8,
  num_units INT8,
  unit_level INT8,
  basement BOOL,
  waterfront BOOL,
  adult_community BOOL,
  hoa BOOL,
  hoa_fee DECIMAL(12, 2),
  taxes DECIMAL(12, 2),
  tax_year INT8,
  date_available DATE,

  -- Public marketing remarks and the coded feature fields. These are what the
  -- Supabase archive left behind to save space, and why a sale that had aged
  -- out of the feed could be a comp but never a page.
  remarks STRING,
  color STRING,
  heating STRING,
  cooling STRING,
  water STRING,
  sewer STRING,
  hot_water STRING,
  appliances STRING,
  flooring STRING,
  interior_features STRING,
  exterior_features STRING,
  exterior STRING,
  construction STRING,
  roof_material STRING,
  basement_feature STRING,
  garage_parking STRING,
  parking_feature STRING,
  lot_description STRING,
  electric_feature STRING,
  energy_features STRING,
  road_type STRING,
  laundry_features STRING,
  pets_allowed STRING,
  pool_description STRING,
  unit_placement STRING,
  waterfront_desc STRING,
  waterview_features STRING,

  -- Attribution. MLS PIN requires the listing office on every display.
  list_office_id STRING,
  list_agent_id STRING,
  photo_count INT8,

  row_hash STRING NOT NULL,
  address_key STRING,
  lat FLOAT8,
  lon FLOAT8,
  geocode_precision STRING,

  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The comp query: one property type, one state, one town, newest first. Every
-- predicate is an equality or a range on this index, which is the lesson of
-- 20260927110000_idx_comp_pool on the Supabase side — a comp lookup that walked
-- every sale of a type in the state took seven seconds with everything cached.
-- State is in the key because town names are not unique in the feed.
CREATE INDEX IF NOT EXISTS idx_sold_comps
  ON idx_sold (prop_type, state, town, settled_date DESC);

-- The sold tab's default order, and its per-town form. Rentals are a separate
-- choice on /search and are priced per month, so the sale index leaves them out.
CREATE INDEX IF NOT EXISTS idx_sold_recent
  ON idx_sold (settled_date DESC)
  WHERE prop_type != 'RN';

CREATE INDEX IF NOT EXISTS idx_sold_town_recent
  ON idx_sold (town, settled_date DESC);

-- "12 elm" in the search box. Trigrams are what make ILIKE '%…%' an index
-- lookup rather than a scan of every address ever sold.
CREATE INDEX IF NOT EXISTS idx_sold_address_trgm
  ON idx_sold USING GIN (address gin_trgm_ops);

-- The diff. idx-sync asks "what hash do you hold for these 500 numbers" before
-- writing anything, and answering that from the primary index means reading 500
-- whole rows — remarks and all — to return 500 short strings. This index holds
-- exactly the two columns the question needs.
CREATE INDEX IF NOT EXISTS idx_sold_hash
  ON idx_sold (mls_number) STORING (row_hash);

-- Pushing a newly-geocoded address onto the rows that share it.
CREATE INDEX IF NOT EXISTS idx_sold_address_key
  ON idx_sold (address_key)
  WHERE lat IS NULL;

-- One row per run that wrote here, success or failure — the same job
-- idx_sync_runs does on the Supabase side. Without it "has the archive been
-- receiving rows" can only be answered by counting them.
CREATE TABLE IF NOT EXISTS idx_sold_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source STRING NOT NULL,
  rows_seen INT8 NOT NULL DEFAULT 0,
  rows_written INT8 NOT NULL DEFAULT 0,
  ok BOOL NOT NULL DEFAULT true,
  error STRING
);

CREATE INDEX IF NOT EXISTS idx_sold_runs_recent ON idx_sold_runs (ran_at DESC);
