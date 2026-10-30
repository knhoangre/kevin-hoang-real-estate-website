-- Assertions for leases (20261030120000_rental_leases).
--
-- Run with: sh supabase/tests/run.sh
--
-- A lease names its tenants, their phone numbers and the rent, and the browser
-- holds a key that can talk to the table directly, so what is asserted is
-- mostly what must NOT be possible:
--
--   * Nobody but the admin reads, writes, changes or deletes a lease — not a
--     signed-out visitor, and not a signed-in client, who may well be one of
--     the tenants on it.
--   * `updated_at` is the database's. The list sorts by it.
--
-- ok() raises on failure and the runner sets ON_ERROR_STOP.

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond THEN RAISE NOTICE 'ok   %', label;
  ELSE RAISE EXCEPTION 'FAIL %', label; END IF;
END; $$;

CREATE OR REPLACE FUNCTION raises(sql TEXT, state TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE sql;
  RETURN FALSE;
EXCEPTION WHEN OTHERS THEN
  RETURN SQLSTATE = state;
END; $$;

CREATE OR REPLACE FUNCTION affected(sql TEXT) RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE n BIGINT;
BEGIN
  EXECUTE sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

CREATE OR REPLACE FUNCTION become(who UUID) RETURNS VOID LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', COALESCE(who::TEXT, ''), FALSE);
$$;

INSERT INTO auth.users (id, email, raw_app_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000a7', 'tenant@example.com', '{}'),
  ('00000000-0000-4000-8000-0000000000c7', 'kevin-leases@example.com', '{"is_admin": true}')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- A signed-out visitor
-- ---------------------------------------------------------------------------

SET ROLE anon;
SELECT become(NULL);

SELECT ok(raises($$SELECT count(*) FROM rental_leases$$, '42501'),
          'a signed-out visitor cannot read leases');
SELECT ok(raises($$INSERT INTO rental_leases (title) VALUES ('x')$$, '42501'),
          'a signed-out visitor cannot create one');

RESET ROLE;

-- ---------------------------------------------------------------------------
-- The admin
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000c7');

INSERT INTO rental_leases (id, title, tenant_names, property_key, application_ids, doc, updated_at)
VALUES ('00000000-0000-4000-8000-00000000e001', '42 Newman St · Unit 3, Malden, MA 02148',
        'Jane Doe and John Smith', '42 newman st|3|malden',
        ARRAY['00000000-0000-4000-8000-00000000f001']::UUID[],
        '{"rent":"$2,400"}', '2001-01-01');

SELECT ok((SELECT count(*) FROM rental_leases) = 1, 'the admin can create and read a lease');
SELECT ok(raises($$INSERT INTO rental_leases (doc) VALUES ('[]')$$, '23514'),
          'the lease itself must be an object');
SELECT ok((SELECT application_ids = ARRAY['00000000-0000-4000-8000-00000000f001']::UUID[]
             FROM rental_leases WHERE id = '00000000-0000-4000-8000-00000000e001'),
          'the applications it was made from are kept');

UPDATE rental_leases
   SET doc = '{"rent":"$2,450"}', updated_at = '2001-01-01', created_at = '1999-01-01'
 WHERE id = '00000000-0000-4000-8000-00000000e001';

SELECT ok((SELECT updated_at > NOW() - INTERVAL '1 minute' FROM rental_leases
            WHERE id = '00000000-0000-4000-8000-00000000e001'),
          'saving stamps updated_at with the database''s clock, whatever was sent');
SELECT ok((SELECT created_at > NOW() - INTERVAL '1 minute' FROM rental_leases
            WHERE id = '00000000-0000-4000-8000-00000000e001'),
          'created_at cannot be rewritten by a save');
SELECT ok((SELECT doc->>'rent' = '$2,450' FROM rental_leases
            WHERE id = '00000000-0000-4000-8000-00000000e001'),
          'and the save itself went through');

RESET ROLE;

-- ---------------------------------------------------------------------------
-- A signed-in client who is not the admin — possibly a tenant on the lease
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000a7');

SELECT ok((SELECT count(*) FROM rental_leases) = 0, 'a signed-in client sees no leases');
SELECT ok(raises($$INSERT INTO rental_leases (title) VALUES ('mine')$$, '42501'),
          'a signed-in client cannot create one');
SELECT ok(affected($$UPDATE rental_leases SET doc = '{"rent":"$1"}'$$) = 0,
          'a signed-in client cannot change one');
SELECT ok(affected($$DELETE FROM rental_leases$$) = 0,
          'a signed-in client cannot delete one');

RESET ROLE;

SELECT ok((SELECT doc->>'rent' = '$2,450' FROM rental_leases
            WHERE id = '00000000-0000-4000-8000-00000000e001'),
          'the lease is as the admin left it');

-- ---------------------------------------------------------------------------
-- The admin, deleting
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000c7');
SELECT ok(affected($$DELETE FROM rental_leases$$) = 1, 'the admin can delete a lease');
RESET ROLE;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

SELECT ok(NOT has_function_privilege('anon', 'public.touch_rental_lease()', 'EXECUTE')
          AND NOT has_function_privilege('authenticated', 'public.touch_rental_lease()', 'EXECUTE'),
          'the trigger function is not callable with a browser''s key');
SELECT ok(NOT has_table_privilege('anon', 'rental_leases', 'SELECT'),
          'anon holds no privilege on the table at all');
