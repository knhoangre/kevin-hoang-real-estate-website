-- Make /search read the rows it shows, not the table they sit in.
--
-- WHAT A VISITOR SAW. The first search after a quiet spell took 7-8 seconds, or
-- failed at the 8-second statement timeout and was retried by withRetry, while
-- the identical search a moment later answered in 0.2 seconds. Measured against
-- the live project on 2026-09-27: the default search 8,314 ms (HTTP 500), then
-- 204 ms; the town dropdown 6,486 ms, then 243 ms.
--
-- WHY. The default search is "active, not a rental, available to buy, most
-- expensive first, 24 of them". There was no index in that order —
-- idx_listings_price is (list_price) ASCENDING, whose backward scan yields DESC
-- NULLS FIRST, and the query asks for DESC NULLS LAST — so Postgres fetched all
-- 15,526 matching rows, sorted them, and kept 24. That was 20,193 buffer reads,
-- ~160 MB: effectively the whole 174 MB table, whose active rows are scattered
-- across nearly every page because the sold feed is interleaved with them.
-- Warm, that is a sort in memory. Cold it is 20,000 random reads, and it is
-- cold often: shared_buffers is 224 MB against 256 MB of this table and its
-- indexes alone, and every sync rewrites ~24,000 rows through the same cache.
--
-- NOW, measured in a rolled-back transaction against the same data:
--   default search        20,193 buffers / 3,348 ms  ->  26 buffers / 2.6 ms
--   town = Newton                                     ->  26 buffers / 2.6 ms
--   town = Dover                                      ->  27 buffers / 1.4 ms
--   max $900k, SF                                     ->  46 buffers / 0.2 ms
-- The sold tab already had its index (settled_date DESC NULLS LAST): 61 buffers.

-- --- The result pages -------------------------------------------------------
--
-- Partial, on feed = 'active', because that is every browse query except the
-- sold tab, and it keeps each index to the ~24,000 rows it can ever serve rather
-- than all 125,000.
--
-- RENTALS GET THEIR OWN. With one index across both, the rent tab walked every
-- sale listing first — a $4,000 rent sorts below every house — and read 17,358
-- buffers to find 24 rentals. Split by the same predicate the query already
-- carries (prop_type = 'RN' / <> 'RN'), each walk starts at its own first row.
CREATE INDEX IF NOT EXISTS idx_listings_sale_price
  ON public.idx_listings (list_price DESC NULLS LAST)
  WHERE feed = 'active' AND prop_type <> 'RN';

CREATE INDEX IF NOT EXISTS idx_listings_rent_price
  ON public.idx_listings (list_price DESC NULLS LAST)
  WHERE feed = 'active' AND prop_type = 'RN';

-- A town search. idx_listings_town_price has the same backwards-order problem
-- and spans both feeds, so Newton's search read its 1,257 rows — a year of
-- sales included — to sort 259.
CREATE INDEX IF NOT EXISTS idx_listings_active_town_price
  ON public.idx_listings (town, list_price DESC NULLS LAST)
  WHERE feed = 'active';

-- --- The count --------------------------------------------------------------
--
-- "Showing 1-24 of 15,526" needs every match counted, and that is the one part
-- of a search no index ORDER can shortcut. Covering the three columns every
-- browse filter uses lets Postgres count from this index alone (an index-only
-- scan: 39 ms instead of 3.3 s, measured) — but only for pages the visibility
-- map marks all-visible, and that is what the autovacuum setting below is for.
--
-- The page no longer WAITS for the count: Search.tsx fetches the 24 rows and
-- the total separately and renders the rows as soon as they arrive. This index
-- is what makes the total arrive soon after.
CREATE INDEX IF NOT EXISTS idx_listings_active_count
  ON public.idx_listings (town, prop_type, status)
  WHERE feed = 'active';

-- Vacuum after each sync rather than every few. Default autovacuum waits for
-- 20% of the table to be dead (~25,000 rows); one active sync rewrites ~24,000,
-- so the table sat just under the trigger and the visibility map stayed stale —
-- measured at 9,715 of 21,646 pages all-visible, which sent the count above back
-- to the table for 11,645 of its 15,526 rows. A vacuum only visits pages that
-- are not already all-visible, so running it more often costs roughly the same
-- work in smaller pieces.
ALTER TABLE public.idx_listings SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 1000
);

-- --- The town dropdown ------------------------------------------------------
--
-- idx_towns_with_listings() grouped the WHOLE table by town on every visit to
-- /search. It was written when the table held only the active feed; once the
-- sold feed was added it silently began counting a year of closings too, so the
-- dropdown offered "Newton (1,257)" beside a search that then found 259.
--
-- Towns and their counts move a few times a day, when a sync lands, so they are
-- computed then and read from a 463-row table in between.
--
-- `listings` counts what the DEFAULT tab shows — active, not a rental, in one
-- of the statuses you can still buy — so choosing "Newton (259)" produces "of
-- 259". Those statuses are a DELIBERATE MIRROR of AVAILABLE_STATUSES in
-- src/lib/idxSearch.ts; change one, change the other. Towns with no home for
-- sale today are kept (with 0, which the page does not print), because the same
-- dropdown serves the sold and under-agreement tabs.
DROP MATERIALIZED VIEW IF EXISTS public.idx_town_counts;
CREATE MATERIALIZED VIEW public.idx_town_counts AS
  SELECT
    l.town,
    COUNT(*) FILTER (
      WHERE l.feed = 'active'
        AND l.status IN ('ACT', 'NEW', 'BOM', 'PCG', 'EXT', 'RAC')
    )::BIGINT AS listings
  FROM public.idx_listings l
  WHERE l.town IS NOT NULL
    AND l.prop_type <> 'RN'
  GROUP BY l.town;

-- Unique, because REFRESH ... CONCURRENTLY requires one — and concurrently
-- because a plain refresh locks the view against reads for its duration.
CREATE UNIQUE INDEX idx_town_counts_town ON public.idx_town_counts (town);

-- Read only through the function. A materialized view cannot carry RLS, and
-- Supabase's default privileges would otherwise publish it on the REST API.
REVOKE ALL ON public.idx_town_counts FROM PUBLIC, anon, authenticated;

-- Same name, same signature, so the page needs no change to call it. SECURITY
-- DEFINER is what lets it read the view the caller cannot; it reads one view,
-- takes no arguments, and pins search_path, which is the whole of the risk.
CREATE OR REPLACE FUNCTION public.idx_towns_with_listings()
RETURNS TABLE (town TEXT, listings BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.town, c.listings
  FROM public.idx_town_counts c
  ORDER BY c.town;
$$;

GRANT EXECUTE ON FUNCTION public.idx_towns_with_listings() TO anon, authenticated;

-- Refreshed after the syncs that change it: five minutes after the last active
-- feed starts (MF at :50, which finishes in ~15 seconds), and after the nightly
-- sold prune at 05:30. IF THE SYNC SCHEDULE MOVES, MOVE THESE — see
-- 20260903120000_idx_sync_every_six_hours.sql. A missed refresh leaves counts up
-- to six hours stale, which a dropdown can afford; it never hides a listing,
-- because the search itself does not read this view.
DO $$
DECLARE
  job_name TEXT;
BEGIN
  FOREACH job_name IN ARRAY ARRAY['idx-town-counts', 'idx-town-counts-sold'] LOOP
    IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = job_name) THEN
      PERFORM cron.unschedule(job_name);
    END IF;
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'idx-town-counts',
  '55 0,6,12,18 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY public.idx_town_counts$$
);

SELECT cron.schedule(
  'idx-town-counts-sold',
  '45 5 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY public.idx_town_counts$$
);
