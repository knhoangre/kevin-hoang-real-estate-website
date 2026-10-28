-- Assertions for 20261028100000_close_public_crm_reads, applied over the live
-- state of these tables (04_crm_live_state.sql).
--
-- Run with: sh supabase/tests/run.sh
--
-- Three things must be true at once, and only together do they mean anything:
--
--   * the public key reads nothing and writes nothing, on every table and view;
--   * a signed-in visitor who is not the admin reads nothing either — two of
--     the holes (the sign-in policy, the owner-run views) were open to them;
--   * the admin still reads contacts_view WHOLE. The views now run with the
--     reader's own policies, so a table the admin had no policy on would come
--     back as a blank column in the CRM rather than as an error.
--
-- ok() raises on failure and the runner sets ON_ERROR_STOP.

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond THEN RAISE NOTICE 'ok   %', label;
  ELSE RAISE EXCEPTION 'FAIL %', label; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION ok(BOOLEAN, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION raises(sql TEXT, state TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE sql;
  RETURN FALSE;
EXCEPTION WHEN OTHERS THEN
  RETURN SQLSTATE = state;
END; $$;
GRANT EXECUTE ON FUNCTION raises(TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION become(who UUID) RETURNS VOID LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', COALESCE(who::TEXT, ''), FALSE);
$$;

/* Every table and view the migration covers. */
CREATE TEMP TABLE covered AS
  SELECT c.relname::TEXT AS name, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
   WHERE (c.relname LIKE 'contact%' OR c.relname LIKE 'pm\_%'
          OR c.relname IN ('open_house_sign_ins', 'event_sign_ins', 'admin_contact_messages_view'))
     AND c.relkind IN ('r', 'v');

SELECT ok((SELECT count(*) FROM covered) = 26,
          'the check covers 23 tables and 3 views');

-- ---------------------------------------------------------------------------
-- The public key
-- ---------------------------------------------------------------------------

SELECT ok(NOT EXISTS (SELECT 1 FROM covered
                       WHERE has_table_privilege('anon', 'public.' || quote_ident(name), 'SELECT')
                          OR has_table_privilege('anon', 'public.' || quote_ident(name), 'INSERT')
                          OR has_table_privilege('anon', 'public.' || quote_ident(name), 'UPDATE')
                          OR has_table_privilege('anon', 'public.' || quote_ident(name), 'DELETE')),
          'the public key holds no privilege on any of them');
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_policies
                       WHERE schemaname = 'public'
                         AND tablename IN (SELECT name FROM covered)
                         AND roles && ARRAY['anon', 'public']::name[]),
          'and no policy names anon or public');

SET ROLE anon;
SELECT ok(raises('SELECT * FROM contacts_view', '42501'),
          'the public key reading contacts_view is refused');
SELECT ok(raises('SELECT * FROM pm_users', '42501'),
          'and pm_users');
SELECT ok(raises($$UPDATE contact_emails SET email = 'attacker@example.com'$$, '42501'),
          'and it cannot change an email');
SELECT ok(raises($$INSERT INTO contact_messages (id, message) VALUES (99, 'spam')$$, '42501'),
          'or write a message straight into the table');
RESET ROLE;

-- ---------------------------------------------------------------------------
-- A signed-in visitor who is not the admin
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000e2');
SELECT ok((SELECT count(*) FROM contacts_view) = 0,
          'a signed-in visitor sees no contacts through the view');
SELECT ok((SELECT count(*) FROM contact_messages_view) = 0
          AND (SELECT count(*) FROM admin_contact_messages_view) = 0,
          'nor any message through either message view');
SELECT ok((SELECT count(*) FROM open_house_sign_ins) = 0,
          'nor an open-house guest');
SELECT ok((SELECT count(*) FROM pm_users) + (SELECT count(*) FROM pm_owners) = 0,
          'nor the property-management tables');
SELECT ok((SELECT count(*) FROM contact_sources) = 0,
          'nor the source list, now that RLS is on there');
RESET ROLE;

-- ---------------------------------------------------------------------------
-- The admin, through RLS, the way the CRM reads it
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000e1');
SELECT ok((SELECT first_name = 'Sarah' AND last_name = 'Lee' AND email = 'sarah@example.com'
                  AND phone = '617-555-0142' AND source = 'Website'
                  AND message_count = 1 AND open_house_count = 1
             FROM contacts_view WHERE contact_id = 1),
          'the admin reads a contact whole: name, email, phone, source and both counts');
SELECT ok((SELECT email = 'sarah@example.com' AND source = 'Website' FROM contact_messages_view WHERE id = 1),
          'and a message with who sent it');
SELECT ok((SELECT address FROM open_house_sign_ins WHERE id = 1) = '12 Elm St',
          'and the open-house sign-ins, which the kiosk lists addresses from');
SELECT ok((SELECT count(*) FROM pm_owners) = 1,
          'and the property-management tables');
UPDATE contact_messages SET is_read = TRUE WHERE id = 1;
SELECT ok((SELECT is_read FROM contact_messages WHERE id = 1),
          'and can still mark a message read');
RESET ROLE;

-- ---------------------------------------------------------------------------
-- What keeps it closed
-- ---------------------------------------------------------------------------

SELECT ok(NOT EXISTS (SELECT 1 FROM covered c
                        JOIN pg_class r ON r.relname = c.name AND r.relkind = 'r'
                       WHERE NOT r.relrowsecurity),
          'RLS is on for every table');
SELECT ok((SELECT bool_and(COALESCE(r.reloptions @> ARRAY['security_invoker=true'], FALSE))
             FROM covered c JOIN pg_class r ON r.relname = c.name AND r.relkind = 'v'),
          'every view runs as the reader — a CREATE OR REPLACE that drops this reopens them');
