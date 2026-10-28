-- Assertions for 20261028110000_showing_reminders.
--
-- Run with: sh supabase/tests/run.sh (which applies the migration twice, so
-- re-running it is checked too).
--
-- The table is the thing that makes a reminder go out ONCE, so most of this is
-- about the claim: a second claim for the same showing on the same day gets
-- nothing back, and nothing the browser holds can read or forge a row.

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

/* What the edge function does before it sends: claim, and send only if a row came back. */
CREATE OR REPLACE FUNCTION claim(p_day DATE, p_kind TEXT, p_key TEXT) RETURNS INT LANGUAGE sql AS $$
  WITH claimed AS (
    INSERT INTO showing_reminders (day, kind, source_key, recipients)
    VALUES (p_day, p_kind, p_key, ARRAY['sarah@example.com'])
    ON CONFLICT (day, kind, source_key) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::INT FROM claimed;
$$;

SELECT ok(claim('2026-10-28', 'client', 'cal:sarah@google.com') = 1,
          'the first claim for a showing gets the row');
SELECT ok(claim('2026-10-28', 'client', 'cal:sarah@google.com') = 0,
          'a second claim the same day gets nothing, so nothing is sent twice');
SELECT ok(claim('2026-10-29', 'client', 'cal:sarah@google.com') = 1,
          'the same event on another day is its own reminder');
SELECT ok(claim('2026-10-28', 'digest', 'digest') = 1 AND claim('2026-10-28', 'digest', 'digest') = 0,
          'Kevin''s summary is claimed the same way, once a day');
SELECT ok(raises($$INSERT INTO showing_reminders (day, kind, source_key) VALUES ('2026-10-28', 'sms', 'x')$$, '23514'),
          'a kind other than client or digest is refused');

SELECT ok(NOT has_table_privilege('anon', 'public.showing_reminders', 'SELECT')
          AND NOT has_table_privilege('anon', 'public.showing_reminders', 'INSERT'),
          'the public key can neither read nor claim');
SELECT ok(NOT has_table_privilege('authenticated', 'public.showing_reminders', 'SELECT')
          AND NOT has_table_privilege('authenticated', 'public.showing_reminders', 'INSERT')
          AND NOT has_table_privilege('authenticated', 'public.showing_reminders', 'UPDATE'),
          'nor can a signed-in browser, admin or not: the edge function reads it for the page');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE relname = 'showing_reminders'),
          'RLS is on, with no policy, as a second lock');

SELECT ok(NOT has_function_privilege('anon', 'public.trigger_showing_reminders()', 'EXECUTE')
          AND NOT has_function_privilege('authenticated', 'public.trigger_showing_reminders()', 'EXECUTE'),
          'nobody with a browser key can set off the morning run');

SELECT ok((SELECT count(*) FROM cron.job WHERE jobname = 'showing-reminders') = 1,
          'applied twice, the run is scheduled once');
SELECT ok((SELECT schedule FROM cron.job WHERE jobname = 'showing-reminders') = '0 12,13 * * *',
          'at 12:00 and 13:00 UTC, one of which is 8 AM in Boston');
