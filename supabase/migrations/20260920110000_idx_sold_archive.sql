-- A sold-listing archive that outlives MLS PIN's feed window.
--
-- WHY THIS IS URGENT RATHER THAN NICE TO HAVE.
--
-- MLS PIN's sold feed is a rolling ONE-YEAR window and idx-sync models that with
-- a retention sweep: anything whose `synced_at` is more than three days stale is
-- DELETED. Measured on the live project on 2026-09-20, the sold rows in the
-- seventeen towns this site serves span 2025-09-17 to 2026-09-18 — twelve months
-- to the day. So every night, a day of closings is removed and nothing keeps a
-- copy. Today's oldest sale is the oldest this site will ever hold, and that
-- sentence stays true tomorrow.
--
-- A comparable-sales estimate wants two to three years of history, and wants it
-- most exactly where the feed gives least. Measured per town over the current
-- window: Needham 273 single-family closings, Newton 559, Quincy 352 — but Dover
-- 76, Somerville 74, Brookline 127, Belmont 134. At tier-0 comp bounds (half a
-- mile, six months, ±15% floor area) a Dover single-family has single digits to
-- draw on. Depth is the whole difference between an estimate and a guess, and it
-- can only be accumulated forward from the day this table exists.
--
-- WHAT IS DELIBERATELY NARROW.
--
--   * SEVENTEEN TOWNS, NOT 450. The original create_idx_tables migration said
--     that if sold data ever arrived it "should be narrowed to SITE.areaServed
--     rather than all 450 towns in the pool", and then the sold feeds were
--     ingested whole. This is that advice, applied where it still can be: the
--     archive grows forever, so it is the one table where unbounded scope
--     actually compounds. Measured cost of the scope: 7,495 rows a year
--     (SF 3,688 · CC 3,065 · MF 742) against 500 MB shared with the CRM.
--
--   * NO RENTALS. RN is 7,243 of the sold rows in those towns and none of them
--     is a sale. A rented apartment is not a comparable for a house at any
--     radius, and `sale_price` on those rows is a monthly figure.
--
--   * MODELLED COLUMNS ONLY. `remarks` and the twenty-six coded feature columns
--     stay behind. Remarks alone is most of the row's bytes, nothing in a comp
--     model reads prose, and the same argument the base migration made against a
--     `raw` JSONB column applies with more force to a table that never shrinks.
--
--   * STATE IS STORED AND FILTERED. Town names are not unique across MLS PIN's
--     coverage — "Dover" is 127 Massachusetts rows and 19 New Hampshire ones —
--     so the scope predicate is (town, state), never town alone. See the header
--     of 20260920100000 for the full measurement.
--
-- This table, not idx_listings, is the comp source of truth. Reading comps from
-- the live cache would mean reading a table that is rewritten wholesale every
-- night and whose rows are deleted out from under any join.

CREATE TABLE IF NOT EXISTS idx_sold_archive (
  mls_number TEXT PRIMARY KEY,

  -- What kind of building, and in which architectural style. `style` holds the
  -- feed's RAW comma-separated codes ("A,D" is a real value — Colonial and
  -- Contemporary on one listing), and the codes COLLIDE across property types:
  -- "A" is Colonial on a single-family and Detached on a condo. Anything reading
  -- this must key on (prop_type, style), and must treat it as a SET.
  prop_type TEXT,
  prop_subtype TEXT,
  style TEXT,
  status TEXT,

  address TEXT,
  street_no TEXT,
  street_name TEXT,
  unit_no TEXT,
  town TEXT,
  town_num TEXT,
  state TEXT,
  zip TEXT,
  neighborhood TEXT,

  -- The transaction. `list_price` is the LAST OBSERVED ask, not necessarily the
  -- original one, which is why a list-to-sale ratio derived from it is a floor
  -- rather than a fact. `sale_price` is what it closed at and is the only
  -- number a comp model may use as a price.
  list_price NUMERIC(12, 2),
  sale_price NUMERIC(12, 2),
  settled_date DATE,

  bedrooms INTEGER,
  full_baths INTEGER,
  half_baths INTEGER,
  living_area INTEGER,
  sqft_above_grade INTEGER,
  sqft_below_grade INTEGER,
  lot_size NUMERIC(12, 2),
  acres NUMERIC(10, 2),
  year_built INTEGER,
  total_rooms INTEGER,
  garage_spaces INTEGER,
  parking_spaces INTEGER,
  -- Three-state on purpose, as on idx_listings: the feed's "U" means nobody
  -- said, and that is not the same claim as "no basement".
  basement BOOLEAN,
  waterfront BOOLEAN,
  hoa BOOLEAN,
  hoa_fee NUMERIC(10, 2),
  taxes NUMERIC(12, 2),
  tax_year INTEGER,

  photo_count INTEGER,

  -- When this row first entered the archive, and when the feed last confirmed
  -- it. first_archived_at is never rewritten: it bounds every claim the archive
  -- makes about its own depth, the same way first_seen_at does on idx_listings.
  first_archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The comp query's access path: everything it filters on before it measures
-- distance. settled_date descending because recency is both a filter and the
-- ordering that makes a capped candidate sample unbiased with respect to price.
CREATE INDEX IF NOT EXISTS idx_sold_archive_comps
  ON idx_sold_archive (prop_type, state, town, settled_date DESC);

CREATE INDEX IF NOT EXISTS idx_sold_archive_street
  ON idx_sold_archive (town, street_name)
  WHERE street_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sold_archive_settled
  ON idx_sold_archive (settled_date DESC);

-- --- The copy ---------------------------------------------------------------

/**
 * Copy every in-scope sold row out of the live cache and into the archive.
 *
 * Called by idx-sync BEFORE its retention sweep, so a row is preserved on the
 * run that would otherwise be the last one to see it. Idempotent: re-running it
 * touches nothing that has not changed, which is what makes it safe to call on
 * every sold slice rather than only once.
 *
 * ON CONFLICT UPDATES rather than DO NOTHING, because MLS PIN does correct a
 * closing after it records — a sale price entered wrong, a settled date moved.
 * The archive should carry the corrected figure. `first_archived_at` is the one
 * column never rewritten.
 *
 * SECURITY INVOKER, and EXECUTE is granted only to service_role. The caller is
 * idx-sync under the service-role key, which bypasses RLS anyway; there is no
 * reason for a browser to be able to invoke a bulk copy.
 */
CREATE OR REPLACE FUNCTION public.idx_archive_sold()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  copied INTEGER;
  /*
   * A DELIBERATE MIRROR of SITE.areaServed in src/lib/siteConfig.ts.
   *
   * The same arrangement as formatProperty(), which the rental-application edge
   * function re-implements so the address in the email cannot disagree with the
   * address on the page, and as the town/ZIP normalisation shared between
   * sync-listings.mjs and fromRow(). Adding a town to the site means adding it
   * here too, and the cost of forgetting is that the new town's sales are never
   * archived — silent, and unrecoverable a year later. That is the reason this
   * list is in a commented constant rather than inlined into the WHERE clause.
   */
  served TEXT[] := ARRAY[
    'Needham', 'Newton', 'Wellesley', 'Weston', 'Dover', 'Lexington', 'Concord',
    'Cambridge', 'Somerville', 'Waltham', 'Medford', 'Malden', 'Quincy',
    'Braintree', 'Brookline', 'Belmont', 'Winchester'
  ];
BEGIN
  INSERT INTO idx_sold_archive (
    mls_number, prop_type, prop_subtype, style, status,
    address, street_no, street_name, unit_no, town, town_num, state, zip, neighborhood,
    list_price, sale_price, settled_date,
    bedrooms, full_baths, half_baths, living_area, sqft_above_grade, sqft_below_grade,
    lot_size, acres, year_built, total_rooms, garage_spaces, parking_spaces,
    basement, waterfront, hoa, hoa_fee, taxes, tax_year, photo_count
  )
  SELECT
    l.mls_number, l.prop_type, l.prop_subtype, l.style, l.status,
    l.address, l.street_no, l.street_name, l.unit_no, l.town, l.town_num, l.state, l.zip, l.neighborhood,
    l.list_price, l.sale_price, l.settled_date,
    l.bedrooms, l.full_baths, l.half_baths, l.living_area, l.sqft_above_grade, l.sqft_below_grade,
    l.lot_size, l.acres, l.year_built, l.total_rooms, l.garage_spaces, l.parking_spaces,
    l.basement, l.waterfront, l.hoa, l.hoa_fee, l.taxes, l.tax_year, l.photo_count
  FROM idx_listings l
  WHERE l.feed = 'sold'
    AND l.state = 'MA'
    AND l.town = ANY(served)
    -- Rentals are not sales. See the header.
    AND l.prop_type <> 'RN'
    -- A sold row with no price or no date is not evidence of anything. 8.5% of
    -- sold single-family rows in these towns carry neither, measured 2026-09-20;
    -- they are the feed withholding the figure, not a house that sold for nothing.
    AND l.sale_price IS NOT NULL
    AND l.sale_price > 0
    AND l.settled_date IS NOT NULL
  ON CONFLICT (mls_number) DO UPDATE SET
    prop_type = EXCLUDED.prop_type,
    prop_subtype = EXCLUDED.prop_subtype,
    style = EXCLUDED.style,
    status = EXCLUDED.status,
    address = EXCLUDED.address,
    street_no = EXCLUDED.street_no,
    street_name = EXCLUDED.street_name,
    unit_no = EXCLUDED.unit_no,
    town = EXCLUDED.town,
    town_num = EXCLUDED.town_num,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    neighborhood = EXCLUDED.neighborhood,
    list_price = EXCLUDED.list_price,
    sale_price = EXCLUDED.sale_price,
    settled_date = EXCLUDED.settled_date,
    bedrooms = EXCLUDED.bedrooms,
    full_baths = EXCLUDED.full_baths,
    half_baths = EXCLUDED.half_baths,
    living_area = EXCLUDED.living_area,
    sqft_above_grade = EXCLUDED.sqft_above_grade,
    sqft_below_grade = EXCLUDED.sqft_below_grade,
    lot_size = EXCLUDED.lot_size,
    acres = EXCLUDED.acres,
    year_built = EXCLUDED.year_built,
    total_rooms = EXCLUDED.total_rooms,
    garage_spaces = EXCLUDED.garage_spaces,
    parking_spaces = EXCLUDED.parking_spaces,
    basement = EXCLUDED.basement,
    waterfront = EXCLUDED.waterfront,
    hoa = EXCLUDED.hoa,
    hoa_fee = EXCLUDED.hoa_fee,
    taxes = EXCLUDED.taxes,
    tax_year = EXCLUDED.tax_year,
    photo_count = EXCLUDED.photo_count,
    last_seen_at = NOW();

  GET DIAGNOSTICS copied = ROW_COUNT;
  RETURN copied;
END;
$$;

-- --- RLS --------------------------------------------------------------------
--
-- Public READ, exactly as idx_listings. The archive holds the same MLS PIN sold
-- data the search already displays, under the same IDX terms, and the pages that
-- read it are the same noindex /search pages. Nothing client-side may write it.

ALTER TABLE idx_sold_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read idx_sold_archive" ON idx_sold_archive;
CREATE POLICY "Public read idx_sold_archive" ON idx_sold_archive
  FOR SELECT TO anon, authenticated USING (TRUE);

GRANT SELECT ON idx_sold_archive TO anon, authenticated;

REVOKE ALL ON FUNCTION public.idx_archive_sold() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.idx_archive_sold() TO service_role;
