-- Comparable sales for EVERY town, not just the seventeen the archive keeps.
--
-- WHAT WAS WRONG. idx_comparable_sales read only idx_sold_archive, and the
-- archive is scoped to SITE.areaServed. So an estimate could only ever appear
-- on a listing in one of those seventeen towns. Measured on the live feed on
-- 2026-09-26, that is 935 of 9,680 active single-families and 986 of 5,706
-- condos — about 12% of what /search shows. Every other listing got no comps,
-- a refusal, and a page with nothing on it, which is indistinguishable from the
-- feature not existing. The brief was an estimate on every listing someone
-- opens from a search.
--
-- WHY NOT WIDEN THE ARCHIVE INSTEAD. The archive grows forever, so its scope
-- compounds: all towns is roughly 70,000 sales a year against a 500 MB free
-- tier shared with the CRM. It exists to give the towns Kevin actually works in
-- a history deeper than MLS PIN's twelve-month window, and it stays that.
--
-- WHAT THIS DOES. Reads BOTH sources. The live sold feed (idx_listings,
-- feed='sold') covers every town in MLS PIN's coverage for the last twelve
-- months; the archive adds anything older in the seventeen towns. A sale present
-- in both is taken once, from the archive — the NOT EXISTS on the archive's
-- primary key is what enforces that, and it is not cosmetic: counting one
-- closing twice would give it double weight in a weighted median.
--
-- Also returns prop_subtype, which the estimator now needs for multi-family:
-- MLS PIN's MF_TYPE encodes the unit count (A = 2 family, B = 3 family …), and a
-- two-family is only comparable to another two-family.

-- The access path for comps drawn from the live feed. Partial on feed='sold' so
-- it costs nothing on the active rows /search queries all day, and ordered by
-- settled_date to match the ORDER BY below, which is what makes the capped
-- sample unbiased with respect to price.
CREATE INDEX IF NOT EXISTS idx_listings_sold_comps
  ON idx_listings (prop_type, state, town, settled_date DESC)
  WHERE feed = 'sold';

-- The return type changes (prop_subtype is added), and CREATE OR REPLACE cannot
-- change a function's result columns. Dropped and recreated in one migration,
-- so there is no window in which the page calls a function that is not there.
DROP FUNCTION IF EXISTS public.idx_comparable_sales(
  TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION,
  INTEGER, INTEGER, INTEGER, TEXT, INTEGER
);

/**
 * Comparable closed sales for one subject property. See 20260920130000 for why
 * this is an RPC and why its ordering is recency; nothing about those reasons
 * has changed. What changed is where the rows come from.
 */
CREATE OR REPLACE FUNCTION public.idx_comparable_sales(
  p_prop_type TEXT,
  p_town TEXT,
  p_state TEXT DEFAULT 'MA',
  p_lat DOUBLE PRECISION DEFAULT NULL,
  p_lon DOUBLE PRECISION DEFAULT NULL,
  p_radius_km DOUBLE PRECISION DEFAULT NULL,
  p_months INTEGER DEFAULT 18,
  p_min_sqft INTEGER DEFAULT NULL,
  p_max_sqft INTEGER DEFAULT NULL,
  p_exclude_mls TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 250
)
RETURNS TABLE (
  mls_number TEXT,
  address TEXT,
  street_name TEXT,
  town TEXT,
  zip TEXT,
  prop_type TEXT,
  prop_subtype TEXT,
  style TEXT,
  sale_price NUMERIC,
  list_price NUMERIC,
  settled_date DATE,
  bedrooms INTEGER,
  full_baths INTEGER,
  half_baths INTEGER,
  living_area INTEGER,
  lot_size NUMERIC,
  acres NUMERIC,
  year_built INTEGER,
  garage_spaces INTEGER,
  basement BOOLEAN,
  photo_count INTEGER,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  geocode_precision TEXT,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH sales AS (
    -- The seventeen served towns, with history past the feed window.
    SELECT
      a.mls_number, a.address, a.street_name, a.town, a.zip, a.prop_type,
      a.prop_subtype, a.style, a.sale_price, a.list_price, a.settled_date,
      a.bedrooms, a.full_baths, a.half_baths, a.living_area, a.lot_size,
      a.acres, a.year_built, a.garage_spaces, a.basement, a.photo_count,
      a.address_key
    FROM idx_sold_archive a
    WHERE a.prop_type = p_prop_type
      AND a.state = p_state
      AND (p_town IS NULL OR a.town = p_town)
      AND a.settled_date >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)

    UNION ALL

    -- Every town, last twelve months, minus anything the archive already
    -- returned above.
    SELECT
      l.mls_number, l.address, l.street_name, l.town, l.zip, l.prop_type,
      l.prop_subtype, l.style, l.sale_price, l.list_price, l.settled_date,
      l.bedrooms, l.full_baths, l.half_baths, l.living_area, l.lot_size,
      l.acres, l.year_built, l.garage_spaces, l.basement, l.photo_count,
      public.idx_address_key(l.address, l.town, l.state, l.zip)
    FROM idx_listings l
    WHERE l.feed = 'sold'
      AND l.prop_type = p_prop_type
      -- State is not optional. "Dover" is 127 Massachusetts rows and 19 New
      -- Hampshire ones. See the header of 20260920100000.
      AND l.state = p_state
      AND (p_town IS NULL OR l.town = p_town)
      AND l.settled_date >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)
      AND NOT EXISTS (
        SELECT 1 FROM idx_sold_archive x WHERE x.mls_number = l.mls_number
      )
  ),
  bounds AS (
    SELECT
      p_lat - (p_radius_km / 111.32) AS min_lat,
      p_lat + (p_radius_km / 111.32) AS max_lat,
      p_lon - (p_radius_km / GREATEST(111.32 * cos(radians(p_lat)), 0.000001)) AS min_lon,
      p_lon + (p_radius_km / GREATEST(111.32 * cos(radians(p_lat)), 0.000001)) AS max_lon
  )
  SELECT
    s.mls_number, s.address, s.street_name, s.town, s.zip, s.prop_type,
    s.prop_subtype, s.style, s.sale_price, s.list_price, s.settled_date,
    s.bedrooms, s.full_baths, s.half_baths, s.living_area, s.lot_size,
    s.acres, s.year_built, s.garage_spaces, s.basement, s.photo_count,
    g.lat,
    g.lon,
    g.precision AS geocode_precision,
    CASE
      WHEN p_lat IS NULL OR g.lat IS NULL THEN NULL
      ELSE public.idx_distance_km(p_lat, p_lon, g.lat, g.lon)
    END AS distance_km
  FROM sales s
  LEFT JOIN idx_geocodes g
    ON g.address_key = s.address_key
   AND g.lat IS NOT NULL
  CROSS JOIN bounds b
  WHERE (p_exclude_mls IS NULL OR s.mls_number <> p_exclude_mls)
    -- Sanity bands; see 20260920130000. living_area and year_built get no
    -- filtering at ingest, and one absurd row can wreck a regression slope.
    AND s.living_area IS NOT NULL
    AND s.living_area BETWEEN 300 AND 15000
    AND s.sale_price IS NOT NULL
    AND s.sale_price > 0
    AND (p_min_sqft IS NULL OR s.living_area >= p_min_sqft)
    AND (p_max_sqft IS NULL OR s.living_area <= p_max_sqft)
    AND (
      p_radius_km IS NULL
      OR (
        g.lat BETWEEN b.min_lat AND b.max_lat
        AND g.lon BETWEEN b.min_lon AND b.max_lon
        AND public.idx_distance_km(p_lat, p_lon, g.lat, g.lon) <= p_radius_km
      )
    )
  ORDER BY s.settled_date DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
$$;

REVOKE ALL ON FUNCTION public.idx_comparable_sales(
  TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION,
  INTEGER, INTEGER, INTEGER, TEXT, INTEGER
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.idx_comparable_sales(
  TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION,
  INTEGER, INTEGER, INTEGER, TEXT, INTEGER
) TO anon, authenticated;
