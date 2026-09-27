-- Archive the batch that was just written, not the whole archive every time.
--
-- WHAT BROKE. On the night of 2026-09-27 fifteen of the sixteen sold-feed runs
-- failed with `SF/sold archive: canceling statement due to statement timeout`
-- (and CC, RN, MF likewise). The upserts had already landed, and because the
-- archive step throws before the retention sweep, nothing was deleted — so no
-- sale was lost. But the archive did not grow, the prune did not run, and every
-- run was recorded as failed.
--
-- WHY. idx_archive_sold() took no arguments and copied EVERY in-scope sold row
-- on every call: ~7,000 archive rows rewritten, sixteen times a night, including
-- after the four rental slices it never archives anything from. Its own header
-- claimed "re-running it touches nothing that has not changed", which was not
-- true — ON CONFLICT DO UPDATE with no WHERE rewrites every conflicting row. The
-- smoke test on 2026-09-26 passed at 18 seconds of wall time against a quiet,
-- warm database; at 02:00, straight after an 8,000-row upsert had pushed the
-- relevant pages out of a 224 MB buffer cache, the same statement ran past the
-- 8-second `statement_timeout` that PostgREST's `authenticator` role carries,
-- which is what the service-role key runs under.
--
-- NOW. The function takes the MLS numbers of the batch idx-sync has just
-- upserted, so each call looks up at most 500 rows by primary key — rows that
-- are still in cache because they were written a moment earlier — and writes
-- the few dozen of them that fall in the served towns. The work per call no
-- longer grows with the size of the archive, which is the property the old
-- version lacked: it would have got slower every night for as long as the
-- archive exists.
--
-- NOTHING IS LOST BY SCOPING. Every sold row passes through an upsert batch on
-- every night it is in the feed window, so every row is offered to the archive
-- nightly, exactly as before. The retention sweep still runs after the copy.
--
-- The zero-argument form is kept, as a wrapper, for a manual full backfill and
-- for supabase/tests — it is what the old function did, and is the one form that
-- should never be on a schedule.

DROP FUNCTION IF EXISTS public.idx_archive_sold();

/**
 * Copy these sold rows, where in scope, into the archive.
 *
 * ON CONFLICT still UPDATES rather than DO NOTHING, because MLS PIN does correct
 * a closing after it records it, and the archive should carry the corrected
 * figure. The update is unconditional on purpose: `last_seen_at` means "still
 * in the feed as of", and a row the feed re-sent unchanged was still seen. At a
 * few dozen rows a call that costs nothing; at seven thousand it was the bug.
 * `first_archived_at` is the one column never rewritten.
 */
CREATE OR REPLACE FUNCTION public.idx_archive_sold(p_mls TEXT[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  copied INTEGER;
  /*
   * A DELIBERATE MIRROR of SITE.areaServed in src/lib/siteConfig.ts. Adding a
   * town to the site means adding it here too, and the cost of forgetting is
   * that the new town's sales are never archived — silent, and unrecoverable a
   * year later. See 20260920110000_idx_sold_archive.sql.
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
  -- The primary key, so this is an index lookup per MLS number rather than a
  -- scan of the sold feed.
  WHERE l.mls_number = ANY(p_mls)
    AND l.feed = 'sold'
    AND l.state = 'MA'
    AND l.town = ANY(served)
    -- Rentals are not sales.
    AND l.prop_type <> 'RN'
    -- A sold row with no price or no date is the feed withholding the figure,
    -- not a house that sold for nothing.
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

/**
 * Every sold row at once. For a manual backfill and for the SQL tests only —
 * this is the shape that timed out, and it must not go back on a schedule.
 */
CREATE OR REPLACE FUNCTION public.idx_archive_sold()
RETURNS INTEGER
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.idx_archive_sold(ARRAY(SELECT mls_number FROM idx_listings WHERE feed = 'sold'));
$$;

-- anon and authenticated BY NAME, not just PUBLIC. Supabase's default
-- privileges grant EXECUTE on every new function in `public` to both roles
-- directly, so `REVOKE ... FROM PUBLIC` alone — which is all the original
-- migration did — left the bulk copy callable by anyone holding the anon key
-- that ships in the site's JavaScript. Checked on the live project 2026-09-27:
-- proacl was {anon=X, authenticated=X, service_role=X}. RLS would have refused
-- the INSERT, but only after the full read of the sold feed had been paid for.
REVOKE ALL ON FUNCTION public.idx_archive_sold(TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.idx_archive_sold() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.idx_archive_sold(TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.idx_archive_sold() TO service_role;
