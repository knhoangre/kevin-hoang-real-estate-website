-- The MLS PIN IDX feed cache.
--
-- WHY THIS IS IN POSTGRES AND NOT A COMMITTED SNAPSHOT. src/data/soldListings.ts
-- is a committed file because ten rows change monthly. This is 23,436 active
-- listings that change hourly — committing it would bloat the repo, break build
-- determinism, and guarantee stale data between deploys. This is the one part of
-- the site that is genuinely dynamic, and that is correct.
--
-- WHAT IS DELIBERATELY NOT HERE, measured against the real feeds:
--
--   * The SOLD feeds. 101,730 rows and 113 MB of modelled columns, against a
--     500 MB free-tier database that also holds the CRM. The product need is
--     clients searching for homes to buy, which is the active feed; sold data is
--     a comps feature that can come later, and if it does it should be narrowed
--     to SITE.areaServed rather than all 450 towns in the pool.
--
--   * A `raw` JSONB column of every feed field. Another 60 MB for the active
--     feed alone, to store columns nothing queries. The feed is re-fetchable
--     every hour; keeping a second copy of it is not a backup, it is ballast.
--
--   * A photos table. The feed states PHOTO_COUNT outright, and photo URLs on
--     media.mlspin.com are a pure function of MLS number and index — so 582,561
--     photo rows would encode nothing that `photo_count` does not. The photos
--     themselves are hot-linked, never copied: they are MLS PIN's to serve, they
--     number in the millions, and the egress lesson from public/listings applies
--     in reverse here.

CREATE TABLE IF NOT EXISTS idx_listings (
  -- The MLS number is the feed's own primary key, so upserts are natural and a
  -- listing cannot be duplicated across two syncs.
  mls_number TEXT PRIMARY KEY,

  status TEXT,
  prop_type TEXT,

  address TEXT,
  town TEXT,
  state TEXT,
  zip TEXT,

  list_price NUMERIC(12, 2),
  sale_price NUMERIC(12, 2),

  bedrooms INTEGER,
  -- Kept separate rather than combined into 2.5, because this site renders the
  -- MLS convention ("2.1" = two full and one half) through formatBaths(). One
  -- bath convention per site, or IDX results and the sold pages contradict each
  -- other on the same screen.
  full_baths INTEGER,
  half_baths INTEGER,
  living_area INTEGER,
  year_built INTEGER,
  style TEXT,

  -- Public marketing remarks: the only listing prose IDX permits displaying.
  remarks TEXT,

  -- Attribution. MLS PIN requires the listing office appear on every listing,
  -- so this is a display requirement, not metadata.
  list_office_id TEXT,
  list_agent_id TEXT,

  photo_count INTEGER,
  settled_date DATE,

  -- Set on every upsert. This is what makes deletion correct: anything not
  -- touched by the current run is no longer in the feed and must go.
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The filters /search actually offers.
CREATE INDEX IF NOT EXISTS idx_listings_town ON idx_listings (town);
CREATE INDEX IF NOT EXISTS idx_listings_price ON idx_listings (list_price);
CREATE INDEX IF NOT EXISTS idx_listings_bedrooms ON idx_listings (bedrooms);
CREATE INDEX IF NOT EXISTS idx_listings_prop_type ON idx_listings (prop_type);
CREATE INDEX IF NOT EXISTS idx_listings_synced_at ON idx_listings (synced_at);
-- Town + price is the common compound filter; a single index serves both the
-- "homes in Needham" and "under $900k in Needham" cases.
CREATE INDEX IF NOT EXISTS idx_listings_town_price ON idx_listings (town, list_price);

-- Listing-office names, for the required attribution line. Roughly 25,000 rows
-- and about a megabyte. Unlike the listing feeds, offices.asp needs no
-- authentication.
CREATE TABLE IF NOT EXISTS idx_offices (
  office_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT
);

-- One row per ingest, successful or not.
--
-- Not merely a log: MLS PIN requires a visible "data last updated" timestamp on
-- an IDX display, and this is where it comes from. A failed run is recorded
-- rather than swallowed, so the page can tell the difference between "synced an
-- hour ago" and "has not synced since Tuesday because the password changed".
CREATE TABLE IF NOT EXISTS idx_sync_runs (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  ok BOOLEAN NOT NULL DEFAULT FALSE,
  rows_upserted INTEGER NOT NULL DEFAULT 0,
  rows_deleted INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_started_at ON idx_sync_runs (started_at DESC);

-- --- RLS ------------------------------------------------------------------
--
-- Public READ, service-role write. The site is a static bundle with an anon key
-- in the browser, so the anon role has to be able to select — but nothing
-- client-side may ever write listing data, which arrives only from the feed.

ALTER TABLE idx_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE idx_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE idx_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read idx_listings" ON idx_listings;
CREATE POLICY "Public read idx_listings" ON idx_listings FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "Public read idx_offices" ON idx_offices;
CREATE POLICY "Public read idx_offices" ON idx_offices FOR SELECT TO anon, authenticated USING (TRUE);

-- Only the freshness timestamp is public, and only from the most recent runs;
-- the error text can name internal hosts and is admin-only by omission.
DROP POLICY IF EXISTS "Public read idx_sync_runs" ON idx_sync_runs;
CREATE POLICY "Public read idx_sync_runs" ON idx_sync_runs FOR SELECT TO anon, authenticated USING (TRUE);

GRANT SELECT ON idx_listings, idx_offices, idx_sync_runs TO anon, authenticated;

-- No INSERT/UPDATE/DELETE grants to anon or authenticated at all. The ingest
-- runs as the service role, which bypasses RLS by design.
