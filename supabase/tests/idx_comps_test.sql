-- Assertions for the comparable-sales migrations.
--
-- Run with: sh supabase/tests/run.sh
--
-- Every assertion here is a claim the estimator depends on and that nothing else
-- checks. The two worth naming, because they are the ones a careless change
-- would break silently:
--
--   * A COMP QUERY CANNOT CROSS A STATE LINE. MLS PIN town names are not unique
--     — Dover is 127 Massachusetts rows and 19 New Hampshire ones on the live
--     feed — so a comp set banded on town alone silently mixes two markets.
--
--   * AN UNKNOWN DISTANCE IS NOT A NEAR ONE. A row with no geocode is included
--     when no radius is asked for and excluded when one is, because the
--     alternative is a comp from the far side of town inside a half-mile band.
--
-- ok() raises on failure and the runner sets ON_ERROR_STOP, so the first broken
-- assertion stops the run and names itself.

\set ON_ERROR_STOP on
TRUNCATE idx_listings, idx_sold_archive, idx_geocodes;
CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond THEN RAISE NOTICE 'ok   %', label;
  ELSE RAISE EXCEPTION 'FAIL %', label; END IF;
END; $$;

-- Needham centre, and points at known offsets from it.
-- 0.008988 deg latitude = 1.000 km. 0.012100 deg longitude at 42.28N ~= 1.000 km.
INSERT INTO idx_listings (mls_number, feed, prop_type, state, town, address, zip,
  sale_price, list_price, settled_date, living_area, bedrooms, full_baths, half_baths, style, acres, year_built)
VALUES
  ('A1','sold','SF','MA','Needham','10 Elm St','02492',  1000000, 1050000, CURRENT_DATE - 30,  2000,3,2,1,'A',0.25,1960),
  ('A2','sold','SF','MA','Needham','12 Elm St','02492',  1100000, 1100000, CURRENT_DATE - 90,  2200,4,2,1,'A',0.30,1965),
  ('A3','sold','SF','MA','Needham','400 Far Rd','02492', 1200000, 1200000, CURRENT_DATE - 120, 2400,4,3,0,'C',0.40,1970),
  -- Out of scope, each for exactly one reason:
  ('B1','sold','SF','NH','Needham','1 Granite Way','03000', 900000, 900000, CURRENT_DATE - 30, 2000,3,2,0,'A',0.2,1960), -- wrong state
  ('B2','sold','RN','MA','Needham','9 Rent Rd','02492',      3200,   3200, CURRENT_DATE - 30,  900,2,1,0,'A',NULL,1980), -- rental
  ('B3','sold','SF','MA','Pittsfield','2 Away St','01201', 400000, 400000, CURRENT_DATE - 30, 2000,3,2,0,'A',0.5,1950),   -- unserved town
  ('B4','sold','SF','MA','Needham','5 NoPrice St','02492',   NULL, 800000, CURRENT_DATE - 30, 2000,3,2,0,'A',0.2,1960),  -- no sale price
  ('B5','sold','SF','MA','Needham','7 NoDate St','02492',  900000, 900000, NULL,              2000,3,2,0,'A',0.2,1960),  -- no settled date
  ('B6','active','SF','MA','Needham','3 Live St','02492',    NULL, 999000, NULL,              2000,3,2,0,'A',0.2,1960),  -- active, not sold
  -- Sanity-band offenders (in scope for the archive, must be excluded by the RPC):
  ('C1','sold','SF','MA','Needham','1 Zero St','02492',   1000000, 1000000, CURRENT_DATE - 30,     0,3,2,0,'A',0.2,1960),
  ('C2','sold','SF','MA','Needham','2 Huge St','02492',  90000000,90000000, CURRENT_DATE - 30, 99999,9,9,0,'A',9.0,1960),
  -- Too old for an 18-month window:
  ('D1','sold','SF','MA','Needham','8 Old Rd','02492',    800000, 800000, CURRENT_DATE - 900, 2000,3,2,0,'A',0.2,1960);

-- The archive keeps the RAW record: age and sanity bands are query concerns,
-- not archival ones. Six rows qualify (A1-A3, C1, C2, D1); the B* rows each
-- fail exactly one scope test.
SELECT ok(public.idx_archive_sold() = 6, 'archive copies exactly the 6 in-scope sold rows');
SELECT ok((SELECT count(*) FROM idx_sold_archive) = 6, 'archive holds 6 rows (A1,A2,A3,C1,C2,D1)');
SELECT ok(NOT EXISTS(SELECT 1 FROM idx_sold_archive WHERE mls_number IN ('B1','B2','B3','B4','B5','B6')), 'no out-of-scope row archived');

-- The batch form idx-sync actually calls: only the MLS numbers it is handed,
-- and the scope rules still apply inside the batch. An unknown number is not an
-- error — a batch can race a deletion.
TRUNCATE idx_sold_archive;
SELECT ok(public.idx_archive_sold(ARRAY['A1','B2','B3','NOPE']) = 1,
  'batch: of A1, a rental, an unserved town and an unknown number, only A1 is copied');
SELECT ok((SELECT count(*) FROM idx_sold_archive) = 1, 'batch: nothing outside the batch was touched');
SELECT ok(public.idx_archive_sold(ARRAY[]::TEXT[]) = 0, 'batch: an empty batch copies nothing');
SELECT ok(public.idx_archive_sold() = 6, 'the no-argument form still copies all six in-scope rows');

-- Only the sync may run the copy. With Supabase's default privileges in the
-- bootstrap, a REVOKE FROM PUBLIC alone would leave both of these true.
SELECT ok(NOT has_function_privilege('anon', 'public.idx_archive_sold(text[])', 'execute')
      AND NOT has_function_privilege('anon', 'public.idx_archive_sold()', 'execute')
      AND NOT has_function_privilege('authenticated', 'public.idx_archive_sold(text[])', 'execute')
      AND NOT has_function_privilege('authenticated', 'public.idx_archive_sold()', 'execute'),
  'neither archive function is callable with the anon key or a user session');
SELECT ok(has_function_privilege('service_role', 'public.idx_archive_sold(text[])', 'execute'),
  'the service role can call the batch form');

-- Idempotency + first_archived_at preservation + correction propagation.
UPDATE idx_sold_archive SET first_archived_at = NOW() - INTERVAL '10 days';
UPDATE idx_listings SET sale_price = 1234567 WHERE mls_number = 'A1';
SELECT public.idx_archive_sold();
SELECT ok((SELECT count(*) FROM idx_sold_archive) = 6, 're-run does not duplicate');
SELECT ok((SELECT sale_price FROM idx_sold_archive WHERE mls_number='A1') = 1234567, 'correction propagates to archive');
SELECT ok((SELECT first_archived_at FROM idx_sold_archive WHERE mls_number='A1') < NOW() - INTERVAL '9 days', 'first_archived_at is never rewritten');
UPDATE idx_listings SET sale_price = 1000000 WHERE mls_number = 'A1';
SELECT public.idx_archive_sold();

-- address_key generated column, and the geocode join.
SELECT ok(public.idx_address_key('10 Elm St.','Needham','MA','02492-1234') = public.idx_address_key('10  ELM   ST','needham','ma','02492'), 'address_key normalises punctuation, case, spacing and ZIP+4');
INSERT INTO idx_geocodes (address_key, lat, lon, precision) VALUES
  (public.idx_address_key('10 Elm St','Needham','MA','02492'), 42.280900, -71.237800, 'rooftop'),
  (public.idx_address_key('12 Elm St','Needham','MA','02492'), 42.289888, -71.237800, 'rooftop'),     -- 1.000 km N
  (public.idx_address_key('400 Far Rd','Needham','MA','02492'), 42.370780, -71.237800, 'interpolated'); -- 10.0 km N
-- D1, C1, C2 deliberately left ungeocoded.

SELECT ok(round(public.idx_distance_km(42.2809,-71.2378, 42.289888,-71.2378)::numeric, 3) BETWEEN 0.995 AND 1.005, 'haversine: 1 km north measures 1 km');

-- The RPC.
-- Of the six archived rows: A1 is the subject, C1 and C2 fail the sanity band,
-- D1 is 900 days old and outside an 18-month window. A2 and A3 remain.
SELECT ok((SELECT count(*) FROM public.idx_comparable_sales('SF','Needham','MA',42.2809,-71.2378,NULL,18,NULL,NULL,'A1',250)) = 2,
  'no radius: self, both sanity-band offenders and the out-of-window sale are all dropped');
SELECT ok(NOT EXISTS(SELECT 1 FROM public.idx_comparable_sales('SF','Needham','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,250) WHERE mls_number IN ('C1','C2')),
  'sanity bands exclude 0 sqft and 99999 sqft');
SELECT ok(NOT EXISTS(SELECT 1 FROM public.idx_comparable_sales('SF','Needham','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,250) WHERE mls_number = 'D1'),
  '18-month window excludes a 900-day-old sale');
SELECT ok(NOT EXISTS(SELECT 1 FROM public.idx_comparable_sales('SF','Needham','MA',NULL,NULL,NULL,18,NULL,NULL,'A1',250) WHERE mls_number = 'A1'),
  'p_exclude_mls excludes the subject itself');

-- Radius behaviour, including the "unknown distance is not near" rule.
SELECT ok((SELECT count(*) FROM public.idx_comparable_sales('SF','Needham','MA',42.2809,-71.2378,2.0,18,NULL,NULL,'A1',250)) = 1,
  '2 km radius keeps only A2 (1 km), drops A3 (10 km) and every ungeocoded row');
SELECT ok((SELECT mls_number FROM public.idx_comparable_sales('SF','Needham','MA',42.2809,-71.2378,2.0,18,NULL,NULL,'A1',250)) = 'A2',
  'and the one it keeps is the near one');
SELECT ok((SELECT round(distance_km::numeric,2) FROM public.idx_comparable_sales('SF','Needham','MA',42.2809,-71.2378,2.0,18,NULL,NULL,'A1',250)) = 1.00,
  'distance_km is reported, not just filtered on');
SELECT ok((SELECT count(*) FROM public.idx_comparable_sales('SF','Needham','MA',42.2809,-71.2378,20.0,18,NULL,NULL,'A1',250)) = 2,
  '20 km radius reaches A3 as well');

-- State isolation: the bug this whole design exists to avoid.
INSERT INTO idx_listings (mls_number, feed, prop_type, state, town, address, zip, sale_price, list_price, settled_date, living_area, bedrooms, full_baths, style)
VALUES ('NH1','sold','SF','NH','Dover','5 Main St','03820', 500000, 500000, CURRENT_DATE - 10, 2000, 3, 2, 'A');
INSERT INTO idx_listings (mls_number, feed, prop_type, state, town, address, zip, sale_price, list_price, settled_date, living_area, bedrooms, full_baths, style)
VALUES ('MA1','sold','SF','MA','Dover','5 Main St','02030', 2000000, 2000000, CURRENT_DATE - 10, 2000, 3, 2, 'A');
SELECT public.idx_archive_sold();
SELECT ok((SELECT count(*) FROM idx_sold_archive WHERE town='Dover') = 1, 'Dover NH is not archived; Dover MA is');
SELECT ok((SELECT count(*) FROM public.idx_comparable_sales('SF','Dover','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,250)) = 1,
  'a Dover comp query cannot return New Hampshire');

-- sqft bounds.
SELECT ok((SELECT count(*) FROM public.idx_comparable_sales('SF','Needham','MA',NULL,NULL,NULL,18,2100,2500,NULL,250)) = 2,
  'sqft bounds select A2 (2200) and A3 (2400), not A1 (2000)');

-- Ordering is recency, and the cap is clamped.
SELECT ok((SELECT mls_number FROM public.idx_comparable_sales('SF','Needham','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,1)) = 'A1',
  'ordered by settled_date DESC, so LIMIT 1 gives the most recent sale');
SELECT ok((SELECT count(*) FROM public.idx_comparable_sales('SF','Needham','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,-5)) >= 1,
  'a nonsense limit is clamped rather than returning nothing');

-- The geocode CHECK constraints.
DO $$ BEGIN
  BEGIN
    INSERT INTO idx_geocodes (address_key, lat, lon, precision) VALUES ('x', NULL, NULL, 'rooftop');
    RAISE EXCEPTION 'FAIL a rooftop geocode with no coordinates was accepted';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok   rooftop with NULL coords is rejected';
  END;
  BEGIN
    INSERT INTO idx_geocodes (address_key, lat, lon, precision) VALUES ('y', 42.0, -71.0, 'failed');
    RAISE EXCEPTION 'FAIL a failed geocode carrying coordinates was accepted';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok   failed with coords is rejected';
  END;
  BEGIN
    INSERT INTO idx_geocodes (address_key, precision) VALUES ('z', 'guessed');
    RAISE EXCEPTION 'FAIL an unknown precision value was accepted';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok   unknown precision is rejected';
  END;
END $$;

-- --- 20260926100000: comps from every town, not just the archive -----------

-- A sale in a town the archive does not keep. Before this migration it was
-- invisible to every estimate; now the live sold feed supplies it.
INSERT INTO idx_listings (mls_number, feed, prop_type, prop_subtype, state, town, address, zip,
  sale_price, list_price, settled_date, living_area, bedrooms, full_baths, style)
VALUES ('FR1','sold','SF',NULL,'MA','Framingham','9 Pond St','01701', 650000, 660000, CURRENT_DATE - 20, 1900, 3, 2, 'A');
SELECT public.idx_archive_sold();
SELECT ok(NOT EXISTS(SELECT 1 FROM idx_sold_archive WHERE mls_number = 'FR1'),
  'an unserved town is still not archived');
SELECT ok((SELECT count(*) FROM public.idx_comparable_sales('SF','Framingham','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,250)) = 1,
  'but it is now returned as a comp, from the live sold feed');

-- A sale present in BOTH sources must come back exactly once. Counted twice it
-- would carry double weight in the weighted median, silently.
SELECT ok(EXISTS(SELECT 1 FROM idx_listings WHERE mls_number = 'A2' AND feed = 'sold')
      AND EXISTS(SELECT 1 FROM idx_sold_archive WHERE mls_number = 'A2'),
  'A2 is in both the feed and the archive');
SELECT ok((SELECT count(*) FROM public.idx_comparable_sales('SF','Needham','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,250) WHERE mls_number = 'A2') = 1,
  'a sale in both sources is returned once, not twice');

-- The archive still supplies what the feed has lost. Delete A3 from the live
-- feed, as the retention sweep would once it ages out: it must still be a comp.
DELETE FROM idx_listings WHERE mls_number = 'A3';
SELECT ok(EXISTS(SELECT 1 FROM public.idx_comparable_sales('SF','Needham','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,250) WHERE mls_number = 'A3'),
  'a sale pruned from the feed survives as a comp through the archive');

-- Multi-family needs its unit count, which MF_TYPE encodes.
INSERT INTO idx_listings (mls_number, feed, prop_type, prop_subtype, state, town, address, zip,
  sale_price, list_price, settled_date, living_area, bedrooms, full_baths, style)
VALUES ('MF1','sold','MF','G','MA','Framingham','3 Two Fam Rd','01701', 800000, 810000, CURRENT_DATE - 40, 2400, 5, 2, NULL);
SELECT ok((SELECT prop_subtype FROM public.idx_comparable_sales('MF','Framingham','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,250) WHERE mls_number = 'MF1') = 'G',
  'prop_subtype is returned, so a two-family can be matched to two-families');

-- State isolation holds on the new source too.
INSERT INTO idx_listings (mls_number, feed, prop_type, state, town, address, zip,
  sale_price, list_price, settled_date, living_area, bedrooms, full_baths, style)
VALUES ('NH2','sold','SF','NH','Framingham','1 Wrong State Rd','03000', 300000, 300000, CURRENT_DATE - 5, 1900, 3, 2, 'A');
SELECT ok(NOT EXISTS(SELECT 1 FROM public.idx_comparable_sales('SF','Framingham','MA',NULL,NULL,NULL,18,NULL,NULL,NULL,250) WHERE mls_number = 'NH2'),
  'the live-feed branch cannot cross a state line either');
