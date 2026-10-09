-- Assertions for the people on a showing tour.
--
-- Run with: sh supabase/tests/run.sh
--
-- What is worth asserting here is mostly what a save must NOT do:
--
--   * file the same person twice, or re-file everybody because a note changed;
--   * overwrite a contact the CRM already has — the couple sharing an email is
--     the case that decided p_prefer_new;
--   * trust a contactId the browser sent;
--   * fail because the CRM did;
--   * leave crm_upsert_contact() callable with the public key, which it was.
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

/* One person on one tour, by position. */
CREATE OR REPLACE FUNCTION person(tour UUID, i INT) RETURNS JSONB LANGUAGE sql AS $$
  SELECT clients -> i FROM showing_tours WHERE id = tour;
$$;

/* A contact as the CRM would show it. */
CREATE OR REPLACE VIEW crm AS
  SELECT c.id, f.first_name, l.last_name, e.email, p.phone, s.source
    FROM contacts c
    LEFT JOIN contact_first_names f ON f.id = c.first_name_id
    LEFT JOIN contact_last_names l ON l.id = c.last_name_id
    LEFT JOIN contact_emails e ON e.id = c.email_id
    LEFT JOIN contact_phones p ON p.id = c.phone_id
    LEFT JOIN contact_sources s ON s.id = c.source_id;

-- ---------------------------------------------------------------------------
-- The tours that already existed
-- ---------------------------------------------------------------------------

SELECT ok(NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'showing_tours' AND column_name LIKE 'client\_%'),
          'the three single-client columns are gone');
SELECT ok((SELECT jsonb_array_length(clients) = 1
                  AND clients -> 0 ->> 'name' = 'Old Client'
                  AND clients -> 0 ->> 'email' = 'old@example.com'
                  AND clients -> 0 -> 'phone' = 'null'::jsonb
                  AND length(clients -> 0 ->> 'id') > 0
             FROM showing_tours WHERE id = '00000000-0000-4000-8000-00000000aa01'),
          'an existing tour keeps its client, tidied, as the first person');
SELECT ok((SELECT clients -> 0 ->> 'phone' = '617-555-0101'
             FROM showing_tours WHERE id = '00000000-0000-4000-8000-00000000aa02'),
          'a client who only had a phone still has it');
SELECT ok((SELECT count(*) FROM contacts) = 0,
          'the migration itself filed nobody in the CRM');

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------

SELECT ok(NOT has_function_privilege('anon',
            'public.crm_upsert_contact(text,text,text,text,text,date,text,text,boolean,text,text)', 'EXECUTE'),
          'the public key can no longer call crm_upsert_contact');
SELECT ok(NOT has_function_privilege('authenticated',
            'public.crm_upsert_contact(text,text,text,text,text,date,text,text,boolean,text,text)', 'EXECUTE'),
          'nor can a signed-in visitor');
SELECT ok(has_function_privilege('service_role',
            'public.crm_upsert_contact(text,text,text,text,text,date,text,text,boolean,text,text)', 'EXECUTE'),
          'the service role still can');

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000d2');
SELECT ok(raises($$SELECT public.crm_upsert_contact('Mallory', 'Visitor', 'm@example.com')$$, '42501'),
          'a visitor calling it directly is refused');
SELECT ok((SELECT count(*) FROM showing_tours) = 0,
          'a visitor sees no tours');
SELECT ok(raises($$INSERT INTO showing_tours (tour_date, clients)
                   VALUES ('2026-10-10', '[{"name":"Mallory Visitor","email":"m@example.com"}]')$$, '42501'),
          'and cannot create one');
RESET ROLE;
SELECT ok((SELECT count(*) FROM contacts) = 0, 'none of which reached the CRM');

-- ---------------------------------------------------------------------------
-- Two people on one tour — as the admin, through RLS, the way the page does it
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000d1');

INSERT INTO showing_tours (id, tour_date, clients) VALUES (
  '00000000-0000-4000-8000-00000000bb01', '2026-10-10',
  '[{"id":"p-tammy","name":"  Tammy   Nguyen ","email":" Tammy@Example.com","phone":"774-222-0952","contactId":99999},
    {"id":"p-matt","name":"Matthew","email":null,"phone":"(617) 555-0142"},
    {"id":"","name":"","email":"","phone":""}]'
);
RESET ROLE;

SELECT ok((SELECT jsonb_array_length(clients) FROM showing_tours
            WHERE id = '00000000-0000-4000-8000-00000000bb01') = 2,
          'a blank row on the form is dropped, not stored as a person');
SELECT ok(person('00000000-0000-4000-8000-00000000bb01', 0) ->> 'name' = 'Tammy Nguyen'
          AND person('00000000-0000-4000-8000-00000000bb01', 0) ->> 'email' = 'tammy@example.com',
          'names are trimmed and emails lower-cased');
SELECT ok((SELECT count(*) = 1 FROM crm
            WHERE first_name = 'Tammy' AND last_name = 'Nguyen' AND email = 'tammy@example.com'
              AND phone = '774-222-0952' AND source = 'Showing Tour'),
          'somebody new with a full name and a way to reach them is filed in the CRM');
SELECT ok((person('00000000-0000-4000-8000-00000000bb01', 0) ->> 'contactId')::INT
            = (SELECT id FROM crm WHERE email = 'tammy@example.com'),
          'contactId is the contact the database filed, not the 99999 the browser sent');
SELECT ok(person('00000000-0000-4000-8000-00000000bb01', 1) -> 'contactId' = 'null'::jsonb
          AND (SELECT count(*) FROM contacts) = 1,
          'a first name alone is on the tour and is not yet a CRM contact');

-- A note changes; the people do not.
UPDATE showing_tours
   SET note = 'Meet at the first house.',
       clients = clients
 WHERE id = '00000000-0000-4000-8000-00000000bb01';
SELECT ok((SELECT count(*) FROM contacts) = 1,
          'saving again without changing anybody files nobody twice');

-- Kevin deletes the contact from the CRM, then edits the tour's note again.
DELETE FROM contacts WHERE id = (SELECT id FROM crm WHERE email = 'tammy@example.com');
UPDATE showing_tours
   SET note = 'Parking is on the street.', clients = clients
 WHERE id = '00000000-0000-4000-8000-00000000bb01';
SELECT ok((SELECT count(*) FROM contacts) = 0,
          'a contact deleted from the CRM is not resurrected by an unrelated save');

-- Matthew gains a last name: the row that could not be filed now can.
UPDATE showing_tours
   SET clients = jsonb_set(clients, '{1,name}', '"Matthew Nguyen"')
 WHERE id = '00000000-0000-4000-8000-00000000bb01';
SELECT ok((SELECT count(*) = 1 FROM crm
            WHERE first_name = 'Matthew' AND last_name = 'Nguyen' AND phone = '617-555-0142'),
          'adding a last name later files that person');
SELECT ok(person('00000000-0000-4000-8000-00000000bb01', 1) ->> 'contactId' IS NOT NULL,
          'and the tour records which contact they became');

-- His phone is corrected. Same row id, so it is the same person.
UPDATE showing_tours
   SET clients = jsonb_set(clients, '{1,phone}', '"617-555-0199"')
 WHERE id = '00000000-0000-4000-8000-00000000bb01';
SELECT ok((SELECT count(*) FROM crm WHERE first_name = 'Matthew') = 1,
          'correcting a phone number does not file a second Matthew');
SELECT ok((SELECT phone FROM crm WHERE first_name = 'Matthew') = '617-555-0142',
          'and does not overwrite the number the CRM already had');

-- ---------------------------------------------------------------------------
-- The couple who share an email address
-- ---------------------------------------------------------------------------

TRUNCATE contacts RESTART IDENTITY CASCADE;
INSERT INTO showing_tours (id, tour_date, clients) VALUES (
  '00000000-0000-4000-8000-00000000bb02', '2026-10-11',
  '[{"id":"a","name":"Linh Tran","email":"thetrans@example.com","phone":null},
    {"id":"b","name":"David Tran","email":"thetrans@example.com","phone":null}]'
);
SELECT ok((SELECT count(*) FROM contacts) = 1,
          'two people with one email are one CRM contact, as everywhere else in the CRM');
SELECT ok((SELECT first_name FROM crm WHERE email = 'thetrans@example.com') = 'Linh',
          'and the second of them did not rename the first');

-- Somebody already in the CRM, with a phone the tour does not have.
TRUNCATE contacts RESTART IDENTITY CASCADE;
SELECT public.crm_upsert_contact('Sarah', 'Chen', 'sarah@example.com', '508-555-0110', 'Open House & 1 Elm St') \gset existing_
INSERT INTO showing_tours (id, tour_date, clients) VALUES (
  '00000000-0000-4000-8000-00000000bb03', '2026-10-12',
  '[{"id":"s","name":"Sara Chen","email":"sarah@example.com","phone":"508-555-0999"}]'
);
SELECT ok((SELECT count(*) FROM contacts) = 1
          AND (person('00000000-0000-4000-8000-00000000bb03', 0) ->> 'contactId')::INT = :existing_crm_upsert_contact,
          'somebody already in the CRM is matched, not duplicated');
SELECT ok((SELECT first_name = 'Sarah' AND phone = '508-555-0110' AND source = 'Open House & 1 Elm St'
             FROM crm WHERE id = :existing_crm_upsert_contact),
          'and their name, phone and original source are left exactly as they were');

-- ---------------------------------------------------------------------------
-- What a tour must have
-- ---------------------------------------------------------------------------

SELECT ok(raises($$INSERT INTO showing_tours (tour_date) VALUES ('2026-10-13')$$, '23514'),
          'a tour with nobody on it is refused');
SELECT ok(raises($$INSERT INTO showing_tours (tour_date, clients)
                   VALUES ('2026-10-13', '[{"name":"","email":"x@example.com"}]')$$, '23514'),
          'a person with an email and no name is refused');
SELECT ok(raises($$INSERT INTO showing_tours (tour_date, clients)
                   VALUES ('2026-10-13', '[{"name":"Tammy"},{"name":"Matthew"}]')$$, '23514'),
          'a tour where nobody can be reached is refused');
SELECT ok(raises($$INSERT INTO showing_tours (tour_date, clients)
                   VALUES ('2026-10-13', '{"name":"Tammy Nguyen","phone":"774-222-0952"}')$$, '23514'),
          'people must be a list');
SELECT ok(raises($$UPDATE showing_tours SET clients = '[]'
                    WHERE id = '00000000-0000-4000-8000-00000000bb01'$$, '23514'),
          'everybody cannot be removed from a tour');

-- Two rows sent with the same id still come out as two people.
INSERT INTO showing_tours (id, tour_date, clients) VALUES (
  '00000000-0000-4000-8000-00000000bb04', '2026-10-14',
  '[{"id":"same","name":"One","phone":"617-555-0001"},{"id":"same","name":"Two"}]'
);
SELECT ok(person('00000000-0000-4000-8000-00000000bb04', 0) ->> 'id'
            <> person('00000000-0000-4000-8000-00000000bb04', 1) ->> 'id',
          'a duplicated row id is replaced rather than shared');

-- ---------------------------------------------------------------------------
-- A CRM failure is not a failed save
-- ---------------------------------------------------------------------------

ALTER TABLE contacts RENAME TO contacts_broken;
INSERT INTO showing_tours (id, tour_date, clients) VALUES (
  '00000000-0000-4000-8000-00000000bb05', '2026-10-15',
  '[{"id":"z","name":"Zoe Park","email":"zoe@example.com"}]'
);
ALTER TABLE contacts_broken RENAME TO contacts;
SELECT ok(person('00000000-0000-4000-8000-00000000bb05', 0) ->> 'name' = 'Zoe Park'
          AND person('00000000-0000-4000-8000-00000000bb05', 0) -> 'contactId' = 'null'::jsonb,
          'with the CRM broken the tour still saves, unfiled');

-- Stamping sent_at is what the email function does, and it is not an edit to
-- who is on the tour. Zoe is unfiled and fileable, so if the trigger ran here
-- she would come out of it with a contactId.
UPDATE showing_tours SET sent_at = NOW() WHERE id = '00000000-0000-4000-8000-00000000bb05';
SELECT ok(person('00000000-0000-4000-8000-00000000bb05', 0) -> 'contactId' = 'null'::jsonb,
          'stamping sent_at does not run the CRM filing');

UPDATE showing_tours SET clients = clients WHERE id = '00000000-0000-4000-8000-00000000bb05';
SELECT ok(person('00000000-0000-4000-8000-00000000bb05', 0) ->> 'contactId' IS NOT NULL,
          'and the next save, with the CRM back, files them');
