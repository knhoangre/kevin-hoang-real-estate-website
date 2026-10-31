-- /search can now show any mix of for sale, coming soon, contingent and under
-- agreement, and under agreement is the problem. MLS PIN files those homes in
-- the SOLD feed, so a mix spans two feeds and none of the indexes from
-- 20260927100000_idx_search_speed can serve it: each is partial on one feed.
-- Without these, `status = 'UAG' ORDER BY list_price DESC` hit the 8-second
-- statement timeout on the live table (measured 2026-10-30), having to read and
-- sort every matching row to return 24.
--
-- A search with no under-agreement homes in it still filters on feed = 'active'
-- and keeps using the older indexes, so the default search's plan does not move.

-- A page of results, statewide. Any subset of these statuses implies this
-- predicate, so one index serves every mix. Status is included so a count can
-- be answered from the index without reading the table.
CREATE INDEX IF NOT EXISTS idx_listings_market_price
  ON public.idx_listings (list_price DESC NULLS LAST)
  INCLUDE (status)
  WHERE prop_type <> 'RN'
    AND status IN ('ACT', 'NEW', 'BOM', 'PCG', 'EXT', 'RAC', 'CSO', 'CTG', 'UAG');

-- The same, in one town.
CREATE INDEX IF NOT EXISTS idx_listings_market_town_price
  ON public.idx_listings (town, list_price DESC NULLS LAST)
  INCLUDE (status)
  WHERE prop_type <> 'RN'
    AND status IN ('ACT', 'NEW', 'BOM', 'PCG', 'EXT', 'RAC', 'CSO', 'CTG', 'UAG');

-- The Sold list's total. That list now asks for status = 'SLD', because the
-- 6,976 under-agreement homes in the same feed were being counted as sales and
-- shown after the last of them. idx_listings_feed_type cannot answer the new
-- question without going to the table for all 62,000 rows.
CREATE INDEX IF NOT EXISTS idx_listings_closed_count
  ON public.idx_listings (town, prop_type)
  WHERE feed = 'sold' AND status = 'SLD';
