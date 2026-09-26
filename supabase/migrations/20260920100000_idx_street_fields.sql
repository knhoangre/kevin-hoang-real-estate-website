-- The street parts the parser already had and threw away.
--
-- `_shared/idx.ts` reads STREET_NO, STREET_NAME and UNIT_NO out of every feed
-- row, joins them into one `address` string in buildAddress(), and discards the
-- parts. TOWN_NUM is likewise resolved to a name and the stable numeric code
-- dropped. That was right while `address` was only ever printed; it is wrong now
-- that two other things need the parts:
--
--   1. GEOCODING. The US Census batch geocoder takes a street line separate from
--      the city, state and ZIP. Feeding it "228 Wiswall Rd Unit 3" as the street
--      line lowers the match rate for no reason, when the feed handed us
--      "228" and "Wiswall Rd" separately in the first place. Re-parsing a
--      concatenation this codebase performed itself is work to undo work.
--
--   2. SAME-STREET COMPS. The strongest comparable for a house is another sale
--      on the same street, and that is a `street_name` equality test. Against
--      the composed `address` it is a LIKE with a leading wildcard, which cannot
--      use an index and matches "Wiswall Rd" inside "North Wiswall Rd".
--
-- `address` keeps being built exactly as before and nothing that reads it
-- changes. These columns are additive and nullable, so rows ingested before the
-- next sync simply carry NULL and the geocoder falls back to splitting
-- `address` itself.
--
-- TOWN_NUM is stored because the town NAME is not unique. MLS PIN's town table
-- is TOWN_NUM|LONG|COUNTY|STATE and generate-idx-towns.mjs keeps only the first
-- two, so "Dover" resolves the same whether the row is Dover, Massachusetts or
-- Dover, New Hampshire. Measured on the live feed on 2026-09-20: Dover carries
-- 127 MA rows and 19 NH ones, Concord 336 and 5, Belmont 521 and 7, Winchester
-- 479 and 2, Newton 997 and 3, Brookline 998 and 2. Every one of those is a town
-- this site claims to serve. The numeric code disambiguates without a re-import
-- of the town table; until anything reads it, `state` is the working fix and
-- every comp query filters on it.

ALTER TABLE idx_listings
  ADD COLUMN IF NOT EXISTS street_no TEXT,
  ADD COLUMN IF NOT EXISTS street_name TEXT,
  ADD COLUMN IF NOT EXISTS unit_no TEXT,
  ADD COLUMN IF NOT EXISTS town_num TEXT;

-- Same-street lookup within a town. Partial on NOT NULL because the column is
-- empty until the next full sync and stays empty for any row whose feed line
-- carried no STREET_NAME.
CREATE INDEX IF NOT EXISTS idx_listings_street
  ON idx_listings (town, street_name)
  WHERE street_name IS NOT NULL;
