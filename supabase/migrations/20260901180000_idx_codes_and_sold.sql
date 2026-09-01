-- Coded feed columns, and the sold/under-agreement feeds.
--
-- CODED COLUMNS store the feed's RAW codes ("B,N", "A,C,F,I,K,L"), not their
-- expansions. src/lib/idx-codes.ts decodes them in the browser. Storing the
-- labels instead would add roughly 400 bytes a row across 124,000 rows for text
-- that is fully reconstructible, and would mean a codebook correction required a
-- complete re-sync rather than a deploy.
--
-- The codes are meaningless without the property type: HEATING "C" is "Gas" on
-- a rental, "Hot Air Gravity" on a single-family and "Hot Water Baseboard" on a
-- condo. Anything rendering these must pass prop_type alongside.

ALTER TABLE idx_listings
  ADD COLUMN IF NOT EXISTS heating TEXT,
  ADD COLUMN IF NOT EXISTS cooling TEXT,
  ADD COLUMN IF NOT EXISTS water TEXT,
  ADD COLUMN IF NOT EXISTS sewer TEXT,
  ADD COLUMN IF NOT EXISTS hot_water TEXT,
  ADD COLUMN IF NOT EXISTS appliances TEXT,
  ADD COLUMN IF NOT EXISTS flooring TEXT,
  ADD COLUMN IF NOT EXISTS interior_features TEXT,
  ADD COLUMN IF NOT EXISTS exterior_features TEXT,
  ADD COLUMN IF NOT EXISTS exterior TEXT,
  ADD COLUMN IF NOT EXISTS construction TEXT,
  ADD COLUMN IF NOT EXISTS roof_material TEXT,
  ADD COLUMN IF NOT EXISTS basement_feature TEXT,
  ADD COLUMN IF NOT EXISTS garage_parking TEXT,
  ADD COLUMN IF NOT EXISTS parking_feature TEXT,
  ADD COLUMN IF NOT EXISTS lot_description TEXT,
  ADD COLUMN IF NOT EXISTS electric_feature TEXT,
  ADD COLUMN IF NOT EXISTS energy_features TEXT,
  ADD COLUMN IF NOT EXISTS road_type TEXT,
  ADD COLUMN IF NOT EXISTS laundry_features TEXT,
  ADD COLUMN IF NOT EXISTS pets_allowed TEXT,
  ADD COLUMN IF NOT EXISTS pool_description TEXT,
  ADD COLUMN IF NOT EXISTS unit_placement TEXT,
  ADD COLUMN IF NOT EXISTS waterfront_desc TEXT,
  ADD COLUMN IF NOT EXISTS waterview_features TEXT,
  ADD COLUMN IF NOT EXISTS year_built_descrp TEXT,
  -- SF_TYPE / CC_TYPE / MF_TYPE / RN_TYPE, whichever the feed carries.
  ADD COLUMN IF NOT EXISTS prop_subtype TEXT;

-- WHICH FEED A ROW CAME FROM.
--
-- This is what makes sold listings safe to ingest. Deletion works by stamping
-- synced_at on everything a run touched and removing what it did not — scoped
-- to the property type, or a single-family run would delete every condo. Once
-- the same property type arrives from TWO feeds, that scope is no longer
-- enough: syncing active SF would delete every sold SF, because the active run
-- never saw them. The scope becomes (prop_type, feed).
--
-- Existing rows are all from the active feeds, hence the default and the
-- backfill implied by NOT NULL DEFAULT.
ALTER TABLE idx_listings
  ADD COLUMN IF NOT EXISTS feed TEXT NOT NULL DEFAULT 'active';

ALTER TABLE idx_listings
  DROP CONSTRAINT IF EXISTS idx_listings_feed_check;
ALTER TABLE idx_listings
  ADD CONSTRAINT idx_listings_feed_check CHECK (feed IN ('active', 'sold'));

-- The delete scope, and the "for sale vs sold" split every search runs.
CREATE INDEX IF NOT EXISTS idx_listings_feed_type ON idx_listings (feed, prop_type);
-- Sold results are ordered by when they closed, not by price.
CREATE INDEX IF NOT EXISTS idx_listings_settled_date ON idx_listings (settled_date DESC NULLS LAST);
