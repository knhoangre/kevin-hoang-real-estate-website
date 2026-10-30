-- Assertions for which form an application link asks for
-- (20261030130000_rental_application_form).
--
-- Run with: sh supabase/tests/run.sh
--
-- Runs over the stand-in rental tables from 02_crm_bootstrap.sql. What is
-- asserted:
--
--   * Every existing link and application is the full form.
--   * Only 'full' and 'documents' are forms.
--   * The applicant cannot switch their own application between the two —
--     Kevin can, and so can the edge function that copies the link's choice
--     onto the application when it is claimed.
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

CREATE OR REPLACE FUNCTION become(who UUID) RETURNS VOID LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', COALESCE(who::TEXT, ''), FALSE);
$$;

INSERT INTO auth.users (id, email, raw_app_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000a9', 'applicant-form@example.com', '{}'),
  ('00000000-0000-4000-8000-0000000000c9', 'kevin-form@example.com', '{"is_admin": true}')
ON CONFLICT (id) DO NOTHING;

-- The stand-in tables carry no grants or RLS of their own; the applicant's
-- real UPDATE policy is not what is under test, the trigger is.
GRANT SELECT, UPDATE ON rental_applications TO authenticated, service_role;

SELECT ok((SELECT count(*) FROM rental_applications WHERE form <> 'full') = 0,
          'every application already there is the full form');

INSERT INTO rental_application_invites (id, property_address, form)
VALUES ('00000000-0000-4000-8000-00000000b901', '42 Newman St', 'documents');
INSERT INTO rental_applications (id, invite_id, form)
VALUES ('00000000-0000-4000-8000-00000000b902', '00000000-0000-4000-8000-00000000b901', 'documents');

SELECT ok(raises($$INSERT INTO rental_application_invites (property_address, form) VALUES ('x', 'short')$$, '23514'),
          'a form that is not full or documents is refused');
INSERT INTO rental_application_invites (id, property_address)
VALUES ('00000000-0000-4000-8000-00000000b903', '7 Elm St');
SELECT ok((SELECT form = 'full' FROM rental_application_invites
            WHERE id = '00000000-0000-4000-8000-00000000b903'),
          'a link made without saying is the full form');

-- --- The applicant -----------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000a9');

SELECT ok(raises($$UPDATE rental_applications SET form = 'full'
                    WHERE id = '00000000-0000-4000-8000-00000000b902'$$, '42501'),
          'the applicant cannot switch their application to the other form');
SELECT ok(NOT raises($$UPDATE rental_applications SET applicant_first_name = 'Jane'
                        WHERE id = '00000000-0000-4000-8000-00000000b902'$$, '42501'),
          'and saving their answers, which leaves the form alone, still works');

RESET ROLE;

-- --- Kevin -------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000c9');
UPDATE rental_applications SET form = 'full' WHERE id = '00000000-0000-4000-8000-00000000b902';
RESET ROLE;
SELECT ok((SELECT form = 'full' FROM rental_applications WHERE id = '00000000-0000-4000-8000-00000000b902'),
          'the admin can switch it');

-- --- The edge function, under the service role ------------------------------

SET ROLE service_role;
SELECT become(NULL);
UPDATE rental_applications SET form = 'documents' WHERE id = '00000000-0000-4000-8000-00000000b902';
RESET ROLE;
SELECT ok((SELECT form = 'documents' FROM rental_applications WHERE id = '00000000-0000-4000-8000-00000000b902'),
          'the service role can set it');

SELECT ok(NOT has_function_privilege('anon', 'public.guard_rental_application_form()', 'EXECUTE')
          AND NOT has_function_privilege('authenticated', 'public.guard_rental_application_form()', 'EXECUTE'),
          'the trigger function is not callable with a browser''s key');
