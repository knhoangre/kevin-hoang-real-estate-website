-- The leak, reproduced, BEFORE 20261028100000_close_public_crm_reads runs.
--
-- Run with: sh supabase/tests/run.sh
--
-- This is what makes 04_crm_live_state.sql worth trusting: if the fixture did
-- not reproduce the live database, these would fail, and crm_privacy_test.sql
-- passing afterwards would prove nothing. Each matches a count measured with
-- the anon key against the live project on 2026-10-28.

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond THEN RAISE NOTICE 'ok   %', label;
  ELSE RAISE EXCEPTION 'FAIL %', label; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION ok(BOOLEAN, TEXT) TO anon, authenticated;

SET ROLE anon;
SELECT ok((SELECT email FROM contacts_view) = 'sarah@example.com',
          'before: the public key reads a contact''s email through contacts_view');
SELECT ok((SELECT count(*) FROM contact_phones) = 1,
          'before: and the phone table directly');
SELECT ok((SELECT count(*) FROM pm_users) = 1,
          'before: and pm_users, which has no RLS at all');
RESET ROLE;

-- "Allow all operations" lets anon rewrite the CRM, not only read it. Inside a
-- transaction that is rolled back, so the row is there for the tests after.
BEGIN;
SET LOCAL ROLE anon;
UPDATE contact_emails SET email = 'attacker@example.com' WHERE id = 1;
RESET ROLE;
SELECT ok((SELECT email FROM contact_emails WHERE id = 1) = 'attacker@example.com',
          'before: the public key can change a contact''s email');
ROLLBACK;
