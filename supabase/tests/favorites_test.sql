-- Assertions for saved homes and viewing history.
--
-- Run with: sh supabase/tests/run.sh
--
-- These two tables are about PEOPLE, and the browser holds a key that can talk
-- to them directly, so what is asserted here is mostly what must NOT be
-- possible:
--
--   * One account cannot read, or remove, another's saved homes or history.
--   * Nothing a browser sends becomes the snapshot. The address and price on a
--     saved home are the database's copy of the listing — and the list Kevin
--     reads as "what this client is looking at" is built from them.
--   * A view is recorded only by record_listing_view(). There is no write
--     policy on listing_views to forge a count through.
--   * The admin's summary refuses anyone who is not the admin, even though it
--     runs with the definer's rights once past that line.
--
-- ok() raises on failure and the runner sets ON_ERROR_STOP.

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond THEN RAISE NOTICE 'ok   %', label;
  ELSE RAISE EXCEPTION 'FAIL %', label; END IF;
END; $$;

/* True when running `sql` raises the given SQLSTATE; false if it succeeds or raises another. */
CREATE OR REPLACE FUNCTION raises(sql TEXT, state TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE sql;
  RETURN FALSE;
EXCEPTION WHEN OTHERS THEN
  RETURN SQLSTATE = state;
END; $$;

/* Become a signed-in user, the way a request does. */
CREATE OR REPLACE FUNCTION become(who UUID) RETURNS VOID LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', COALESCE(who::TEXT, ''), FALSE);
$$;

TRUNCATE idx_listings;
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-00000000000a', 'ann@example.com', '{}', '{"full_name":"Ann Buyer"}'),
  ('00000000-0000-4000-8000-00000000000b', 'bob@example.com', '{}', '{}'),
  ('00000000-0000-4000-8000-00000000000c', 'kevin@example.com', '{"is_admin": true}', '{}');

INSERT INTO idx_listings (mls_number, feed, status, prop_type, state, town, address, zip,
  list_price, bedrooms, full_baths, half_baths, living_area, photo_count)
VALUES
  ('7000001', 'active', 'ACT', 'SF', 'MA', 'Newton',  '1 Maple St', '02458',  900000, 3, 2, 1, 1800, 12),
  ('7000002', 'active', 'ACT', 'CC', 'MA', 'Needham', '2 Oak St',   '02492',  650000, 2, 1, 0, 1100,  8);

-- ---------------------------------------------------------------------------
-- Saving
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000a');

-- Ann saves a home while claiming to be Bob and sending a forged snapshot.
INSERT INTO listing_favorites (user_id, mls_number, address, town, list_price)
VALUES ('00000000-0000-4000-8000-00000000000b', '7000001', 'FORGED ADDRESS', 'Nowhere', 1);

RESET ROLE;
SELECT ok((SELECT count(*) FROM listing_favorites
            WHERE user_id = '00000000-0000-4000-8000-00000000000a' AND mls_number = '7000001') = 1,
          'a saved home belongs to the caller, whatever user_id was sent');
SELECT ok(NOT EXISTS (SELECT 1 FROM listing_favorites
                       WHERE user_id = '00000000-0000-4000-8000-00000000000b'),
          'nothing was saved under the account that was claimed');
SELECT ok((SELECT address = '1 Maple St' AND town = 'Newton' AND list_price = 900000
                  AND bedrooms = 3 AND photo_count = 12
             FROM listing_favorites WHERE mls_number = '7000001'),
          'the snapshot is the database''s copy of the listing, not what the browser sent');

SET ROLE authenticated;
SELECT ok(raises($$INSERT INTO listing_favorites (mls_number) VALUES ('7999999')$$, '23514'),
          'a number that is not a listing cannot be saved');
SELECT ok(raises($$INSERT INTO listing_favorites (mls_number) VALUES ('1 OR 1=1')$$, '23514'),
          'an MLS number is digits');
SELECT ok(raises($$UPDATE listing_favorites SET address = 'edited'$$, '42501'),
          'a saved home cannot be edited — there is no UPDATE grant at all');

-- Bob.
SELECT become('00000000-0000-4000-8000-00000000000b');
SELECT ok((SELECT count(*) FROM listing_favorites) = 0, 'another account sees none of them');
DELETE FROM listing_favorites WHERE mls_number = '7000001';
RESET ROLE;
SELECT ok((SELECT count(*) FROM listing_favorites) = 1, 'and cannot remove one');

-- The admin reads, and only reads.
SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000c');
SELECT ok((SELECT count(*) FROM listing_favorites) = 1, 'the admin sees every saved home');
DELETE FROM listing_favorites WHERE mls_number = '7000001';
RESET ROLE;
SELECT ok((SELECT count(*) FROM listing_favorites) = 1, 'but cannot remove a client''s');

SET ROLE anon;
SELECT become(NULL);
SELECT ok(raises($$SELECT 1 FROM listing_favorites$$, '42501'), 'anon cannot read saved homes');
SELECT ok(raises($$INSERT INTO listing_favorites (mls_number) VALUES ('7000001')$$, '42501'),
          'anon cannot save one');
RESET ROLE;

-- Ann removes her own.
SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000a');
DELETE FROM listing_favorites WHERE mls_number = '7000001';
RESET ROLE;
SELECT ok((SELECT count(*) FROM listing_favorites) = 0, 'the owner can remove their own');

-- The ceiling. Rows are placed directly, with the trigger off, to get to 500.
ALTER TABLE listing_favorites DISABLE TRIGGER trg_fill_listing_favorite;
INSERT INTO listing_favorites (user_id, mls_number)
SELECT '00000000-0000-4000-8000-00000000000b', (8000000 + n)::TEXT FROM generate_series(1, 500) n;
ALTER TABLE listing_favorites ENABLE TRIGGER trg_fill_listing_favorite;
SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000b');
SELECT ok(raises($$INSERT INTO listing_favorites (mls_number) VALUES ('7000002')$$, '23514'),
          'the 501st saved home is refused');
SELECT become('00000000-0000-4000-8000-00000000000a');
INSERT INTO listing_favorites (mls_number) VALUES ('7000002');
SELECT ok((SELECT count(*) FROM listing_favorites) = 1,
          'and that ceiling is per account — somebody else can still save');
RESET ROLE;

-- ---------------------------------------------------------------------------
-- Viewing
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000a');
SELECT public.record_listing_view('7000001');
SELECT public.record_listing_view('7000001');
SELECT public.record_listing_view('7999999');   -- not a listing
SELECT public.record_listing_view('nonsense');  -- not a number
SELECT public.record_listing_view(NULL);

SELECT ok((SELECT view_count = 2 AND address = '1 Maple St' AND list_price = 900000
             FROM listing_views WHERE mls_number = '7000001'),
          'two visits are one row counted twice, with the listing''s own details');
SELECT ok((SELECT count(*) FROM listing_views) = 1,
          'an unknown or malformed number records nothing and raises nothing');
SELECT ok(raises($$INSERT INTO listing_views (user_id, mls_number, view_count)
                   VALUES ('00000000-0000-4000-8000-00000000000a', '7000002', 999)$$, '42501'),
          'a view cannot be written directly');
SELECT ok(raises($$UPDATE listing_views SET view_count = 999$$, '42501'),
          'or have its count edited');

SELECT become('00000000-0000-4000-8000-00000000000b');
SELECT ok((SELECT count(*) FROM listing_views) = 0, 'another account sees none of the history');
SELECT become('00000000-0000-4000-8000-00000000000c');
SELECT ok((SELECT count(*) FROM listing_views) = 1, 'the admin sees it');
RESET ROLE;

-- A price cut between visits shows on the next one.
UPDATE idx_listings SET list_price = 850000 WHERE mls_number = '7000001';
SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000a');
SELECT public.record_listing_view('7000001');
RESET ROLE;
SELECT ok((SELECT list_price = 850000 AND view_count = 3 FROM listing_views WHERE mls_number = '7000001'),
          'a repeat visit refreshes the snapshot');

-- Signed out: a no-op, not an error. It is called in the background.
SELECT become(NULL);
SELECT public.record_listing_view('7000002');
SELECT ok((SELECT count(*) FROM listing_views) = 1, 'no caller, no row');

-- The history is capped at the 400 most recent.
INSERT INTO idx_listings (mls_number, feed, status, prop_type, state, town, address, list_price)
SELECT (9000000 + n)::TEXT, 'active', 'ACT', 'SF', 'MA', 'Newton', n || ' Cap Rd', 500000
  FROM generate_series(1, 405) n;
INSERT INTO listing_views (user_id, mls_number, last_viewed_at)
SELECT '00000000-0000-4000-8000-00000000000b', (9000000 + n)::TEXT, NOW() - (n || ' minutes')::INTERVAL
  FROM generate_series(1, 404) n;
SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000b');
SELECT public.record_listing_view('9000405');
RESET ROLE;
SELECT ok((SELECT count(*) FROM listing_views WHERE user_id = '00000000-0000-4000-8000-00000000000b') = 400,
          'an account keeps its 400 most recent views');
SELECT ok(EXISTS (SELECT 1 FROM listing_views WHERE mls_number = '9000405')
          AND NOT EXISTS (SELECT 1 FROM listing_views WHERE mls_number = '9000404'),
          'the newest is kept and the oldest is what goes');
SELECT ok((SELECT count(*) FROM listing_views WHERE user_id = '00000000-0000-4000-8000-00000000000a') = 1,
          'pruning one account does not touch another''s');

-- ---------------------------------------------------------------------------
-- The admin's summary
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000a');
SELECT ok(raises($$SELECT * FROM public.admin_client_activity()$$, '42501'),
          'the summary refuses a signed-in non-admin');
SELECT become('00000000-0000-4000-8000-00000000000c');
SELECT ok((SELECT saved_count = 1 AND viewed_count = 1 AND full_name = 'Ann Buyer'
             FROM public.admin_client_activity() WHERE email = 'ann@example.com'),
          'the admin gets each client''s name and counts');
SELECT ok((SELECT count(*) FROM public.admin_client_activity()) = 2,
          'only people with activity are listed — not the admin, who has none');
RESET ROLE;
SELECT become(NULL);

-- Supabase grants every new function to anon and authenticated by name; the
-- bootstrap reproduces that, so a missing REVOKE fails here.
SELECT ok(NOT has_function_privilege('anon', 'public.record_listing_view(text)', 'execute')
      AND NOT has_function_privilege('anon', 'public.admin_client_activity()', 'execute'),
          'anon can execute neither function');
SELECT ok(has_function_privilege('authenticated', 'public.record_listing_view(text)', 'execute'),
          'a signed-in user can record a view');
