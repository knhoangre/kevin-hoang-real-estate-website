-- Assertions for 20261030110000_drop_property_management, run in the
-- crm_privacy database, whose pm_* tables are copied from the live schema with
-- the foreign keys between them left out (see 04_crm_live_state.sql). What
-- matters is that the nine go and nothing beside them does.

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond THEN RAISE NOTICE 'ok   %', label;
  ELSE RAISE EXCEPTION 'FAIL %', label; END IF;
END; $$;

SELECT ok(NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                       WHERE n.nspname = 'public' AND c.relname LIKE 'pm\_%'),
          'all nine property-management tables are gone');
SELECT ok((SELECT count(*) FROM contacts) = 1 AND (SELECT count(*) FROM contacts_view) = 1,
          'and the CRM beside them is untouched');
