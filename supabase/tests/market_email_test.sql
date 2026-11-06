-- Assertions for 20261106100000_market_email.
--
-- Run with: sh supabase/tests/run.sh (which applies the migration twice, so the
-- schedule surviving a re-run is checked too). It runs after the showing
-- reminders, so `ok`, `raises`, `become` and the admin and visitor accounts
-- from showing_tours_seed.sql are already there.
--
-- A subscriber list is email addresses: nobody with a browser key may read it
-- but the admin, and nobody may write it but the edge function.

\set ON_ERROR_STOP on

INSERT INTO market_subscribers (id, email, towns, confirmed_at) VALUES
  ('00000000-0000-4000-8000-0000000000e1', 'reader@example.com', ARRAY['newton-ma', 'needham-ma'], now());

SELECT ok(raises($$INSERT INTO market_subscribers (email, towns) VALUES ('Reader2@Example.com', ARRAY['newton-ma'])$$, '23514'),
          'an address that is not lower-cased is refused: it is the de-duplication key');
SELECT ok(raises($$INSERT INTO market_subscribers (email, towns) VALUES ('nobody', ARRAY['newton-ma'])$$, '23514'),
          'something with no @ is not an address');
SELECT ok(raises($$INSERT INTO market_subscribers (email, towns) VALUES ('none@example.com', ARRAY[]::TEXT[])$$, '23514'),
          'a subscription to no towns is refused');
SELECT ok(raises($$INSERT INTO market_subscribers (email, towns) VALUES ('reader@example.com', ARRAY['weston-ma'])$$, '23505'),
          'one row per address');
SELECT ok((SELECT token IS NOT NULL FROM market_subscribers WHERE email = 'reader@example.com'),
          'every subscriber gets a token for their links');

-- The claim: what the run does before each email.
CREATE OR REPLACE FUNCTION claim_month(p_sub UUID, p_month TEXT) RETURNS INT LANGUAGE sql AS $$
  WITH claimed AS (
    INSERT INTO market_email_sends (subscriber_id, month) VALUES (p_sub, p_month)
    ON CONFLICT DO NOTHING RETURNING 1
  )
  SELECT count(*)::INT FROM claimed;
$$;
SELECT ok(claim_month('00000000-0000-4000-8000-0000000000e1', '2026-10') = 1, 'the first claim for a month gets the row');
SELECT ok(claim_month('00000000-0000-4000-8000-0000000000e1', '2026-10') = 0, 'a second claim the same month gets nothing');
SELECT ok(claim_month('00000000-0000-4000-8000-0000000000e1', '2026-11') = 1, 'next month is its own email');
SELECT ok(raises($$INSERT INTO market_email_sends (subscriber_id, month) VALUES ('00000000-0000-4000-8000-0000000000e1', 'October')$$, '23514'),
          'a month is YYYY-MM');

-- ---------------------------------------------------------------------------
-- Who may do what
-- ---------------------------------------------------------------------------

SELECT ok(NOT has_table_privilege('anon', 'public.market_subscribers', 'SELECT')
          AND NOT has_table_privilege('anon', 'public.market_subscribers', 'INSERT')
          AND NOT has_table_privilege('anon', 'public.market_email_sends', 'SELECT'),
          'the public key can neither read nor add a subscriber');
SELECT ok(NOT has_table_privilege('authenticated', 'public.market_subscribers', 'INSERT')
          AND NOT has_table_privilege('authenticated', 'public.market_subscribers', 'UPDATE')
          AND NOT has_table_privilege('authenticated', 'public.market_subscribers', 'DELETE')
          AND NOT has_table_privilege('authenticated', 'public.market_email_sends', 'INSERT'),
          'a signed-in browser cannot write either table, admin or not');

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000d2');
SELECT ok((SELECT count(*) FROM market_subscribers) = 0, 'a signed-in visitor sees no subscribers');
SELECT ok((SELECT count(*) FROM market_email_sends) = 0, 'nor what was sent');
SELECT become('00000000-0000-4000-8000-0000000000d1');
SELECT ok((SELECT count(*) FROM market_subscribers) = 1, 'the admin reads the list');
SELECT ok((SELECT count(*) FROM market_email_sends) = 2, 'and what went to whom');
RESET ROLE;

SELECT ok(NOT has_function_privilege('anon', 'public.trigger_market_email()', 'EXECUTE')
          AND NOT has_function_privilege('authenticated', 'public.trigger_market_email()', 'EXECUTE'),
          'nobody with a browser key can set off the monthly send');
SELECT ok((SELECT count(*) FROM cron.job WHERE jobname = 'market-email') = 1,
          'applied twice, the run is scheduled once');
SELECT ok((SELECT schedule FROM cron.job WHERE jobname = 'market-email') = '0 15 * * *',
          'daily at 15:00 UTC, after the reports are deployed on the 3rd');
