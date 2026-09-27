-- Make the price estimate's one query cheap enough to always answer.
--
-- WHAT A VISITOR SAW. On some listings the estimate never appeared. Measured on
-- 2026-09-27 against 139 Webster St, Needham: the browser's call to
-- idx_comparable_sales returned 57014 (statement timeout) at 8 seconds, and the
-- summary line under the price — which renders nothing while it waits — stayed
-- empty. Kevin's own question was "where is the estimator for the property?".
--
-- WHY. Called as a FUNCTION, the query read 45,764 buffers and took 7.4 seconds
-- with every one of them already in cache. The same SQL with its parameters
-- written in as literals read 1,620 and took 23 ms. A LANGUAGE sql function with
-- a SET clause is never inlined, so its body is planned once, generically, with
-- the parameters as unknowns — and `(p_town IS NULL OR town = p_town)` cannot be
-- used as an index condition when the planner cannot see whether p_town is
-- null. So it walked every single-family sale in Massachusetts, computed
-- idx_address_key() — four regular expressions — on each of the ~35,000 live-feed
-- rows to find its geocode, and only then threw away every town but Needham.
-- Warm it squeaked in under the 8-second timeout; under any load it did not.
--
-- NOW. The comp pool is computed once a night, after the sold feed lands:
-- archive and live feed deduplicated, the sanity bands applied, the geocode
-- joined on, and the rows written in (prop_type, state, town, settled_date DESC)
-- order, so one town's recent sales of one type sit on a handful of adjacent
-- pages. The function reads that, with `town = p_town` as a plain equality the
-- generic plan CAN index — p_town is now required, as it always was in practice:
-- comparableCandidates() returns [] before calling when a listing has no town.
--
-- STALENESS. At most a day, which is the cadence of the sold feed itself: it is
-- synced once a night, so a sale cannot reach the pool later than it reaches the
-- database. A new geocode reaches it at the next refresh.
--
-- SIZE. ~77,000 rows of modelled columns, about 15 MB with its index, against
-- 346 MB used of the 500 MB free tier.

DROP MATERIALIZED VIEW IF EXISTS public.idx_comp_pool CASCADE;

CREATE MATERIALIZED VIEW public.idx_comp_pool AS
  WITH sales AS (
    -- The seventeen served towns, with history past the feed window.
    SELECT
      a.mls_number, a.address, a.street_name, a.town, a.state, a.zip, a.prop_type,
      a.prop_subtype, a.style, a.sale_price, a.list_price, a.settled_date,
      a.bedrooms, a.full_baths, a.half_baths, a.living_area, a.lot_size,
      a.acres, a.year_built, a.garage_spaces, a.basement, a.photo_count,
      a.address_key
    FROM public.idx_sold_archive a
    UNION ALL
    -- Every town, the feed's twelve months, minus what the archive already
    -- holds: a sale counted twice would carry double weight in the median.
    -- Rentals are never a comp, and are 30,000 of the feed's 100,000 rows.
    SELECT
      l.mls_number, l.address, l.street_name, l.town, l.state, l.zip, l.prop_type,
      l.prop_subtype, l.style, l.sale_price, l.list_price, l.settled_date,
      l.bedrooms, l.full_baths, l.half_baths, l.living_area, l.lot_size,
      l.acres, l.year_built, l.garage_spaces, l.basement, l.photo_count,
      public.idx_address_key(l.address, l.town, l.state, l.zip)
    FROM public.idx_listings l
    WHERE l.feed = 'sold'
      AND l.prop_type <> 'RN'
      AND NOT EXISTS (
        SELECT 1 FROM public.idx_sold_archive x WHERE x.mls_number = l.mls_number
      )
  )
  SELECT
    s.mls_number, s.address, s.street_name, s.town, s.state, s.zip, s.prop_type,
    s.prop_subtype, s.style, s.sale_price, s.list_price, s.settled_date,
    s.bedrooms, s.full_baths, s.half_baths, s.living_area, s.lot_size,
    s.acres, s.year_built, s.garage_spaces, s.basement, s.photo_count,
    g.lat,
    g.lon,
    g.precision AS geocode_precision
  FROM sales s
  LEFT JOIN public.idx_geocodes g
    ON g.address_key = s.address_key
   AND g.lat IS NOT NULL
  -- The sanity bands of 20260920130000, applied once here rather than per call.
  -- living_area and year_built get no filtering at ingest, and one absurd row
  -- can wreck a regression slope.
  WHERE s.settled_date IS NOT NULL
    AND s.living_area BETWEEN 300 AND 15000
    AND s.sale_price > 0
  -- THE ORDER IS THE POINT. A plain (non-concurrent) refresh rewrites the view in
  -- this order, so a lookup's rows are physically together. REFRESH ...
  -- CONCURRENTLY would apply a diff and let that order decay, which is why the
  -- refresh below is not concurrent.
  ORDER BY s.prop_type, s.state, s.town, s.settled_date DESC;

CREATE INDEX idx_comp_pool_lookup
  ON public.idx_comp_pool (prop_type, state, town, settled_date DESC);

-- Read only through idx_comparable_sales. A materialized view cannot carry RLS,
-- and Supabase's default privileges would otherwise publish it on the REST API.
REVOKE ALL ON public.idx_comp_pool FROM PUBLIC, anon, authenticated;

/**
 * Rebuild the pool. Called by pg_cron after the sold feed and by the SQL tests.
 *
 * NOT concurrent — see the ORDER BY above. That takes an exclusive lock for the
 * few seconds the rebuild runs, so an estimate requested at that moment waits
 * rather than fails; the schedule puts it at 01:55 Boston time.
 */
CREATE OR REPLACE FUNCTION public.idx_refresh_comp_pool()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  REFRESH MATERIALIZED VIEW public.idx_comp_pool;
$$;

REVOKE ALL ON FUNCTION public.idx_refresh_comp_pool() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.idx_refresh_comp_pool() TO service_role;

/**
 * Comparable closed sales for one subject property.
 *
 * Same name, same arguments, same columns as before, so the page needs no
 * change. SECURITY DEFINER because the pool is not readable by the caller; the
 * function takes only scalar arguments, pins search_path, and returns public
 * MLS sold data the caller could already read from idx_listings.
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
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      p_lat - (p_radius_km / 111.32) AS min_lat,
      p_lat + (p_radius_km / 111.32) AS max_lat,
      p_lon - (p_radius_km / GREATEST(111.32 * cos(radians(p_lat)), 0.000001)) AS min_lon,
      p_lon + (p_radius_km / GREATEST(111.32 * cos(radians(p_lat)), 0.000001)) AS max_lon
  )
  SELECT
    c.mls_number, c.address, c.street_name, c.town, c.zip, c.prop_type,
    c.prop_subtype, c.style, c.sale_price, c.list_price, c.settled_date,
    c.bedrooms, c.full_baths, c.half_baths, c.living_area, c.lot_size,
    c.acres, c.year_built, c.garage_spaces, c.basement, c.photo_count,
    c.lat,
    c.lon,
    c.geocode_precision,
    CASE
      WHEN p_lat IS NULL OR c.lat IS NULL THEN NULL
      ELSE public.idx_distance_km(p_lat, p_lon, c.lat, c.lon)
    END AS distance_km
  FROM idx_comp_pool c
  CROSS JOIN bounds b
  -- All four of these are index conditions on idx_comp_pool_lookup, in a
  -- generic plan as well as a custom one. Do not reintroduce an
  -- `(p_x IS NULL OR col = p_x)` form on any of them; that is what made this
  -- function read the whole state.
  WHERE c.prop_type = p_prop_type
    -- State is not optional. "Dover" is 127 Massachusetts rows and 19 New
    -- Hampshire ones. See the header of 20260920100000.
    AND c.state = p_state
    AND c.town = p_town
    AND c.settled_date >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)
    AND (p_exclude_mls IS NULL OR c.mls_number <> p_exclude_mls)
    AND (p_min_sqft IS NULL OR c.living_area >= p_min_sqft)
    AND (p_max_sqft IS NULL OR c.living_area <= p_max_sqft)
    -- An unknown distance is not a near one: with a radius, an ungeocoded row
    -- is excluded. See 20260920130000.
    AND (
      p_radius_km IS NULL
      OR (
        c.lat BETWEEN b.min_lat AND b.max_lat
        AND c.lon BETWEEN b.min_lon AND b.max_lon
        AND public.idx_distance_km(p_lat, p_lon, c.lat, c.lon) <= p_radius_km
      )
    )
  -- Recency, which is uncorrelated with price, so a capped sample is not
  -- biased toward one end of the band. The index already returns this order.
  ORDER BY c.settled_date DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
$$;

GRANT EXECUTE ON FUNCTION public.idx_comparable_sales(
  TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION,
  INTEGER, INTEGER, INTEGER, TEXT, INTEGER
) TO anon, authenticated;

-- After the nightly sold feed: the last sold slice starts at 04:40 and the
-- prune at 05:30 UTC; the town counts refresh at 05:45. IF THE SOLD SCHEDULE
-- MOVES, MOVE THIS — see 20260901200000_schedule_idx_sold.sql.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = 'idx-comp-pool') THEN
    PERFORM cron.unschedule('idx-comp-pool');
  END IF;
END;
$$;

SELECT cron.schedule(
  'idx-comp-pool',
  '55 5 * * *',
  $$SELECT public.idx_refresh_comp_pool()$$
);
