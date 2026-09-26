-- Candidate selection for the comparable-sales estimate.
--
-- WHY THIS IS AN RPC AND NOT A POSTGREST QUERY FROM THE BROWSER.
--
-- Three reasons, in order of how badly each one bites.
--
-- 1. THE UNORDERED-LIMIT TRAP, which this codebase has already paid for once.
--    similarListings() carries the full account: banding a price and taking
--    LIMIT 3 returned twelve listings at $865k-$899k against a $1,149,000
--    subject — every one the far edge of the band — because a LIMIT with no
--    ORDER BY returns whatever Postgres reaches first, and "sorting by
--    proximity afterwards cannot fix a slice that never contained the near
--    ones." A comp set chosen that way is not merely noisy, it is biased in the
--    direction that makes an estimate wrong. Here the ordering is settled_date
--    DESC, which is the one axis a price sample may be capped along without
--    skewing it — the same argument medianAskingRent() makes for its own cap.
--
-- 2. DISTANCE CANNOT BE EXPRESSED IN POSTGREST. Haversine against a bounding
--    box is a WHERE clause and an ORDER BY over a computed column. The
--    alternative is fetching the town and measuring in the browser, which is
--    the whole town over the wire to discard most of it.
--
-- 3. THE ANON TIMEOUT IS REAL AND CLOSE. Measured on the live project on
--    2026-09-20, an exact COUNT over the sold feed returns 57014 — cancelled by
--    statement timeout — at the 8s ceiling that 20260913110000 raised it to.
--    This query runs against idx_sold_archive instead, which is seven thousand
--    rows a year rather than a hundred thousand, and hits an index built for
--    exactly its shape.
--
-- The function does FILTERING ONLY. Every judgement — which tier was satisfied,
-- how each comp is adjusted, how they are weighted, what the estimate is and
-- whether there is one at all — lives in src/lib/valuation.ts, where it can be
-- read, argued with and tested without a database.

-- --- Address key ------------------------------------------------------------

/**
 * The join key between a listing and its coordinate.
 *
 * Normalised so that "228 Wiswall Rd." and "228 WISWALL RD" are one address.
 * IMMUTABLE so it can back a generated column and an index.
 *
 * Built from `address` rather than from street_no/street_name, deliberately:
 * `address` is 100% filled on the sold rows in the served towns (measured
 * 2026-09-20), the street parts are NULL until the next full sync, and a key
 * that changes value when those columns populate would orphan every geocode
 * already fetched. The street parts are still the better input to the GEOCODER,
 * which is a separate question from what identifies the row.
 */
CREATE OR REPLACE FUNCTION public.idx_address_key(
  p_address TEXT,
  p_town TEXT,
  p_state TEXT,
  p_zip TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  /*
   * TRIM AFTER COLLAPSING, not before. Trailing punctuation is the whole
   * problem this normalisation exists for — "10 Elm St." and "10 Elm St" have to
   * land on the same key — and trimming first turns the full stop into a
   * trailing space that the trim has already run past. Caught by the migration
   * test before it could quietly halve the geocode hit rate.
   */
  SELECT trim(regexp_replace(lower(coalesce(p_address, '')), '[^a-z0-9]+', ' ', 'g'))
    || '|' || trim(regexp_replace(lower(coalesce(p_town, '')), '[^a-z0-9]+', ' ', 'g'))
    || '|' || trim(regexp_replace(lower(coalesce(p_state, '')), '[^a-z0-9]+', '', 'g'))
    -- ZIP+4 truncated to five: the feed carries both forms and they are the
    -- same postcode. Digits only, so a leading zero survives — every
    -- Massachusetts ZIP has one, and losing it is the import bug that once
    -- rendered "Newton, MA 2459".
    || '|' || substring(regexp_replace(coalesce(p_zip, ''), '[^0-9]', '', 'g') from 1 for 5);
$$;

ALTER TABLE idx_sold_archive
  ADD COLUMN IF NOT EXISTS address_key TEXT
  GENERATED ALWAYS AS (public.idx_address_key(address, town, state, zip)) STORED;

CREATE INDEX IF NOT EXISTS idx_sold_archive_address_key
  ON idx_sold_archive (address_key);

-- --- Distance ---------------------------------------------------------------

/**
 * Great-circle distance in kilometres.
 *
 * Haversine rather than PostGIS, because PostGIS is not enabled on this project
 * and enabling an extension to measure a handful of two-mile hops is not a
 * trade worth making. Accurate to well under a percent at these distances,
 * which is far tighter than the comp tiers care about — the tightest asks for
 * half a mile and the data underneath it is street-segment interpolation.
 */
CREATE OR REPLACE FUNCTION public.idx_distance_km(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT 6371.0088 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

-- --- The candidate query ----------------------------------------------------

/**
 * Comparable closed sales for one subject property.
 *
 * Every parameter is a BOUND, not a preference: the caller widens them tier by
 * tier and stops at the first tier that yields enough. Nothing here scores or
 * ranks by similarity, because a similarity score computed in SQL is one nobody
 * reading the page can audit.
 *
 * p_radius_km NULL means "do not filter on distance" — which is both the widest
 * tier and the mode the whole feature runs in until the geocode backfill lands.
 * A row whose coordinate is unknown is INCLUDED when p_radius_km is NULL and
 * excluded when it is set: absent distance cannot satisfy a distance bound, and
 * treating unknown as near is how a comp from the wrong side of a town ends up
 * in a half-mile radius.
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
  WITH bounds AS (
    SELECT
      /*
       * A bounding box, so the partial index on (lat, lon) can be used before
       * haversine runs. Without it every candidate row is a trig call. One
       * degree of latitude is 111.32 km everywhere; one degree of longitude is
       * that scaled by cos(latitude), and the GREATEST guard keeps the division
       * finite if this is ever called near a pole, which it will not be.
       */
      p_lat - (p_radius_km / 111.32) AS min_lat,
      p_lat + (p_radius_km / 111.32) AS max_lat,
      p_lon - (p_radius_km / GREATEST(111.32 * cos(radians(p_lat)), 0.000001)) AS min_lon,
      p_lon + (p_radius_km / GREATEST(111.32 * cos(radians(p_lat)), 0.000001)) AS max_lon
  )
  SELECT
    a.mls_number,
    a.address,
    a.street_name,
    a.town,
    a.zip,
    a.prop_type,
    a.style,
    a.sale_price,
    a.list_price,
    a.settled_date,
    a.bedrooms,
    a.full_baths,
    a.half_baths,
    a.living_area,
    a.lot_size,
    a.acres,
    a.year_built,
    a.garage_spaces,
    a.basement,
    a.photo_count,
    g.lat,
    g.lon,
    g.precision AS geocode_precision,
    CASE
      WHEN p_lat IS NULL OR g.lat IS NULL THEN NULL
      ELSE public.idx_distance_km(p_lat, p_lon, g.lat, g.lon)
    END AS distance_km
  FROM idx_sold_archive a
  LEFT JOIN idx_geocodes g
    ON g.address_key = a.address_key
   AND g.lat IS NOT NULL
  CROSS JOIN bounds b
  WHERE a.prop_type = p_prop_type
    -- State is not optional. Town names are not unique across MLS PIN's
    -- coverage: "Dover" is 127 Massachusetts rows and 19 New Hampshire ones,
    -- "Concord" 336 and 5. A comp set that silently spans two states is worse
    -- than no comp set. See the header of 20260920100000.
    AND a.state = p_state
    AND (p_town IS NULL OR a.town = p_town)
    AND a.settled_date >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)
    AND (p_exclude_mls IS NULL OR a.mls_number <> p_exclude_mls)
    -- Sanity bands. living_area and year_built get NO filtering at ingest, and
    -- the live data carries three sold rows at or below zero square feet and two
    -- above fifteen thousand (measured 2026-09-20). Three rows cannot move a
    -- median, but one of them can destroy a regression slope, and the slope is
    -- what every dollar adjustment is derived from.
    AND a.living_area IS NOT NULL
    AND a.living_area BETWEEN 300 AND 15000
    AND a.sale_price IS NOT NULL
    AND a.sale_price > 0
    AND (p_min_sqft IS NULL OR a.living_area >= p_min_sqft)
    AND (p_max_sqft IS NULL OR a.living_area <= p_max_sqft)
    AND (
      p_radius_km IS NULL
      OR (
        g.lat BETWEEN b.min_lat AND b.max_lat
        AND g.lon BETWEEN b.min_lon AND b.max_lon
        AND public.idx_distance_km(p_lat, p_lon, g.lat, g.lon) <= p_radius_km
      )
    )
  -- Recency, not price. See reason 1 in the header: this is the ordering that
  -- makes a capped sample unbiased with respect to what the caller measures.
  ORDER BY a.settled_date DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
$$;

-- Called from the browser on /search/<mls>, so anon needs EXECUTE. It reads only
-- idx_sold_archive and idx_geocodes, both of which already carry a public SELECT
-- policy, so this grants no reach the anon role did not already have — it is a
-- faster, better-ordered path to the same rows.
REVOKE ALL ON FUNCTION public.idx_comparable_sales(
  TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION,
  INTEGER, INTEGER, INTEGER, TEXT, INTEGER
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.idx_comparable_sales(
  TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION,
  INTEGER, INTEGER, INTEGER, TEXT, INTEGER
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.idx_address_key(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.idx_distance_km(
  DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION
) TO anon, authenticated;
