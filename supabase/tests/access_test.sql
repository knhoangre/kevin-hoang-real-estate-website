-- Assertions for 20261028120000_tighten_access, applied last, over every table
-- the earlier migrations in this suite created.
--
-- Run with: sh supabase/tests/run.sh
--
-- The point of the anon write revoke is that it holds for every table, present
-- and future, so that is what is asserted: no table in public grants the public
-- key a write, and a table created afterwards does not arrive with one.

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond THEN RAISE NOTICE 'ok   %', label;
  ELSE RAISE EXCEPTION 'FAIL %', label; END IF;
END; $$;

SELECT ok(NOT EXISTS (
            SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
               AND (has_table_privilege('anon', c.oid, 'INSERT')
                    OR has_table_privilege('anon', c.oid, 'UPDATE')
                    OR has_table_privilege('anon', c.oid, 'DELETE')
                    OR has_table_privilege('anon', c.oid, 'TRUNCATE'))),
          'the public key can write to no table in public');

SELECT ok(has_table_privilege('anon', 'public.idx_listings', 'SELECT'),
          'and still reads the listings, which are public');

CREATE TABLE access_test_new_table (id INT);
SELECT ok(NOT has_table_privilege('anon', 'access_test_new_table', 'INSERT')
          AND NOT has_table_privilege('anon', 'access_test_new_table', 'DELETE'),
          'a table created afterwards does not arrive with anon write grants');
SELECT ok(has_table_privilege('authenticated', 'access_test_new_table', 'INSERT'),
          'while signed-in grants are unchanged, left to each table''s RLS');
DROP TABLE access_test_new_table;
