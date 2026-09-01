-- Distinct towns that currently have listings, for the /search town filter.
--
-- PostgREST exposes no DISTINCT, so without this the page would fetch the town
-- column for all ~22,000 rows and dedupe in the browser — a ~300 KB response to
-- populate a dropdown of a few hundred entries, on every visit. Postgres can
-- answer this from the town index.
--
-- Rentals are excluded to match the default search view, which separates them
-- because they are priced per month and would otherwise sort against sale
-- prices.
CREATE OR REPLACE FUNCTION public.idx_towns_with_listings()
RETURNS TABLE (town TEXT, listings BIGINT)
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT l.town, COUNT(*) AS listings
  FROM public.idx_listings l
  WHERE l.town IS NOT NULL AND l.prop_type <> 'RN'
  GROUP BY l.town
  ORDER BY l.town;
$$;

GRANT EXECUTE ON FUNCTION public.idx_towns_with_listings() TO anon, authenticated;
