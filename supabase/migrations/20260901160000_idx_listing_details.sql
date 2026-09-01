-- Detail fields for /search/<mls>, so a listing page says more than beds,
-- baths and a price.
--
-- ONLY numeric, boolean and free-text columns are added. Most of the feed's
-- descriptive fields are CODED — HEATING is "B,N", APPLIANCES is
-- "A,C,F,I,K,L", STYLE is "A" — and the lookup tables live in the Field
-- Reference behind the MLS PIN login. "Heating: B,N" tells a reader nothing,
-- and inventing expansions would be fabricating details about another
-- brokerage's listing. Those columns stay out until the codebook is to hand;
-- backfilling them later costs one hourly sync.
--
-- Fill rates measured on the live single-family feed (8,522 rows): rooms 100%,
-- lot size 98%, acreage 97%, garage 100%, basement 100%, taxes 94%, HOA 52%,
-- colour 57%, neighbourhood 15%.

ALTER TABLE idx_listings
  ADD COLUMN IF NOT EXISTS total_rooms INTEGER,
  -- NUMERIC, not INTEGER: real rows carry fractional square feet (3357.75).
  -- Separately, 861 rows across the active feeds have ACRES typed into this
  -- field (0.03, 0.94); the parser discards anything under 100 as impossible.
  ADD COLUMN IF NOT EXISTS lot_size NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS acres NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS garage_spaces INTEGER,
  ADD COLUMN IF NOT EXISTS parking_spaces INTEGER,
  -- Three-state on purpose: the feed's "U" means unknown, and on some columns
  -- that is a third of the rows. "No HOA" and "nobody said" are different
  -- claims and only one is safe to print, so U becomes NULL, not false.
  ADD COLUMN IF NOT EXISTS basement BOOLEAN,
  ADD COLUMN IF NOT EXISTS waterfront BOOLEAN,
  ADD COLUMN IF NOT EXISTS adult_community BOOLEAN,
  ADD COLUMN IF NOT EXISTS hoa BOOLEAN,
  ADD COLUMN IF NOT EXISTS hoa_fee NUMERIC(10, 2),
  -- Zero is stored as NULL for these: TAXES and LOT_SIZE are "0" on a large
  -- share of rows, which is the field being unfilled rather than a home with no
  -- lot and no tax bill.
  ADD COLUMN IF NOT EXISTS taxes NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS tax_year INTEGER,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS num_units INTEGER,
  ADD COLUMN IF NOT EXISTS unit_level INTEGER,
  ADD COLUMN IF NOT EXISTS date_available DATE,
  ADD COLUMN IF NOT EXISTS sqft_above_grade INTEGER,
  ADD COLUMN IF NOT EXISTS sqft_below_grade INTEGER;

-- Free-text search over address and town, for the "just type where you want to
-- live" box on /search.
--
-- pg_trgm rather than full-text search: this matches partial words as they are
-- typed ("wisw" finding "Wiswall Rd"), which tsvector cannot do — it indexes
-- whole lexemes. GIN over trigrams is what makes ILIKE '%…%' fast enough to
-- run against 22,000 rows on every search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_listings_address_trgm
  ON idx_listings USING GIN (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_town_trgm
  ON idx_listings USING GIN (town gin_trgm_ops);
