-- Coordinates for listing addresses.
--
-- WHY A SEPARATE TABLE RATHER THAN lat/lon COLUMNS ON idx_listings.
--
-- Because idx_listings rows do not survive. The active feeds are diffed against
-- the file on every run and anything absent is deleted; a listing that sells is
-- re-inserted from the sold feed; the sold retention sweep deletes a day of
-- closings every night. idx_price_history already learned this the expensive way
-- and carries ON DELETE CASCADE with a comment saying a listing that sells
-- "starts its history over". A coordinate stored on that table would be thrown
-- away and re-fetched on the same schedule, for a value that cannot change: the
-- corner of the earth an address sits on does not depend on whether the house is
-- currently for sale.
--
-- So the key is the ADDRESS, not the MLS number. One geocode serves the active
-- listing, the sold row it becomes, and the archived copy that outlives both —
-- and a house that sells twice in three years is geocoded once.
--
-- WHY THE US CENSUS GEOCODER. It is free, needs no API key, imposes no usage
-- terms on the results, and covers every US address; the backfill is roughly
-- 25,000 active listings plus the archive, which at 10,000 addresses per batch
-- is a handful of calls. Nominatim — already used once in this codebase, to
-- place the office in siteConfig.geo — asks for one request per second and is
-- not built for a bulk backfill. Geocoding is done by scripts/geocode-listings.mjs
-- rather than an Edge Function: it is a long backfill, the output is durable,
-- and the Edge Function ceiling on this project is a measured 8,000 rows.
--
-- WHAT A NULL COORDINATE MEANS, AND WHAT MUST HAPPEN THEN. Some addresses will
-- not resolve — a new subdivision, a rural route, a typo in the feed. `precision`
-- records which, and a row stamped 'failed' is NOT retried forever. The comp
-- ladder must therefore work without coordinates at all: it falls back to
-- street, then ZIP, then town. That is not a degraded mode bolted on afterwards,
-- it is the mode the whole feature runs in until the backfill finishes.

CREATE TABLE IF NOT EXISTS idx_geocodes (
  -- Normalised "<street>|<town>|<state>|<zip5>", lower-cased, punctuation
  -- stripped, whitespace collapsed. Built by addressKey() in
  -- src/lib/valuation.ts and mirrored in scripts/geocode-listings.mjs — the same
  -- deliberate mirror as the town/ZIP normalisation shared between
  -- sync-listings.mjs and fromRow(). If the two ever disagree, the symptom is a
  -- silent cache miss and a re-geocode, not a wrong coordinate.
  address_key TEXT PRIMARY KEY,

  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,

  -- 'rooftop'      — the geocoder matched the address itself.
  -- 'interpolated' — matched along the street segment. Good to a house or two,
  --                  which is well inside the half-mile the tightest comp tier
  --                  asks for, so it is used without apology.
  -- 'zip'          — nothing matched; only the ZIP centroid is known. Stored so
  --                  the ladder can skip distance for this row rather than
  --                  measuring to the middle of a postcode and calling it near.
  -- 'failed'       — nothing at all. lat and lon stay NULL.
  precision TEXT NOT NULL DEFAULT 'failed',

  geocoded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT idx_geocodes_precision_check
    CHECK (precision IN ('rooftop', 'interpolated', 'zip', 'failed')),
  -- A usable coordinate and a usable precision have to agree. Without this a
  -- 'failed' row with a stale lat/lon would read as a real location.
  CONSTRAINT idx_geocodes_coords_present
    CHECK ((precision = 'failed') = (lat IS NULL OR lon IS NULL))
);

-- The bounding-box scan the comp query runs. Partial, because the failed rows
-- are dead weight in an index whose only purpose is finding things near a point.
CREATE INDEX IF NOT EXISTS idx_geocodes_latlon
  ON idx_geocodes (lat, lon)
  WHERE lat IS NOT NULL AND lon IS NOT NULL;

-- --- RLS --------------------------------------------------------------------
--
-- Public read. These are coordinates of addresses already displayed on the IDX
-- pages, derived from a public federal service; there is nothing here that is
-- not on the listing itself. Writes come from the backfill script under the
-- service role.

ALTER TABLE idx_geocodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read idx_geocodes" ON idx_geocodes;
CREATE POLICY "Public read idx_geocodes" ON idx_geocodes
  FOR SELECT TO anon, authenticated USING (TRUE);

GRANT SELECT ON idx_geocodes TO anon, authenticated;
