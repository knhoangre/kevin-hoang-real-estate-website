-- Assertions for Send listings: who may touch a message, and filing its people.
--
-- Run with: sh supabase/tests/run.sh
--
-- It runs after showing_tours_test.sql, so `ok`, `raises`, `become` and the `crm`
-- view are already there, and so are that file's contacts and users.

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION send_person(send UUID, i INT) RETURNS JSONB LANGUAGE sql AS $$
  SELECT clients -> i FROM listing_sends WHERE id = send;
$$;

-- ---------------------------------------------------------------------------
-- Who may do what
-- ---------------------------------------------------------------------------

SELECT ok(NOT has_function_privilege('anon', 'public.listing_send_people()', 'EXECUTE'),
          'the public key cannot call the trigger function');
SELECT ok(NOT has_function_privilege('authenticated', 'public.listing_send_people()', 'EXECUTE'),
          'nor can a signed-in visitor');
SELECT ok(NOT has_table_privilege('anon', 'public.listing_sends', 'SELECT'),
          'the public key cannot read the table');

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000d2');
SELECT ok((SELECT count(*) FROM listing_sends) = 0, 'a visitor sees no messages');
SELECT ok(raises($$INSERT INTO listing_sends (homes, clients)
                   VALUES ('[{"mlsNumber":"73000001"}]',
                           '[{"name":"Mallory Visitor","email":"mallory@example.com"}]')$$, '42501'),
          'and cannot create one');
RESET ROLE;
SELECT ok((SELECT count(*) FROM crm WHERE email = 'mallory@example.com') = 0,
          'none of which reached the CRM');

-- ---------------------------------------------------------------------------
-- Somebody new, as the admin, through RLS
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000d1');

INSERT INTO listing_sends (id, homes, clients, note) VALUES (
  '00000000-0000-4000-8000-00000000cc01',
  '[{"mlsNumber":"73000001","address":"12 Elm St"},{"mlsNumber":"73000002","address":"9 Oak Ave"}]',
  '[{"id":"p-nadia","name":"  Nadia   Rahman ","email":" Nadia@Example.com","phone":"617-555-0190","contactId":99999},
    {"id":"","name":"","email":"","phone":""}]',
  'These just came on.'
);
RESET ROLE;

SELECT ok((SELECT jsonb_array_length(clients) FROM listing_sends
            WHERE id = '00000000-0000-4000-8000-00000000cc01') = 1,
          'a blank row on the form is dropped');
SELECT ok(send_person('00000000-0000-4000-8000-00000000cc01', 0) ->> 'name' = 'Nadia Rahman'
          AND send_person('00000000-0000-4000-8000-00000000cc01', 0) ->> 'email' = 'nadia@example.com',
          'names are trimmed and emails lower-cased');
SELECT ok((SELECT count(*) = 1 FROM crm
            WHERE first_name = 'Nadia' AND last_name = 'Rahman' AND email = 'nadia@example.com'
              AND phone = '617-555-0190' AND source = 'Sent Listings'),
          'somebody new is filed in the CRM, under where they came from');
SELECT ok((send_person('00000000-0000-4000-8000-00000000cc01', 0) ->> 'contactId')::INT
            = (SELECT id FROM crm WHERE email = 'nadia@example.com'),
          'contactId is the one the database filed, not the one the browser sent');
SELECT ok((SELECT homes -> 1 ->> 'address' = '9 Oak Ave' FROM listing_sends
            WHERE id = '00000000-0000-4000-8000-00000000cc01'),
          'the homes keep the order they were added in');

-- ---------------------------------------------------------------------------
-- What a save must not do
-- ---------------------------------------------------------------------------

UPDATE listing_sends SET note = 'One more thing.', sent_at = NOW()
 WHERE id = '00000000-0000-4000-8000-00000000cc01';
DELETE FROM contacts WHERE id = (SELECT id FROM crm WHERE email = 'nadia@example.com');
UPDATE listing_sends SET clients = clients
 WHERE id = '00000000-0000-4000-8000-00000000cc01';
SELECT ok((SELECT count(*) FROM crm WHERE email = 'nadia@example.com') = 0,
          'saving someone unchanged does not bring back a contact Kevin deleted');

-- A couple sharing an email: the second matches the first, and must not rename them.
INSERT INTO listing_sends (id, homes, clients) VALUES (
  '00000000-0000-4000-8000-00000000cc02', '[{"mlsNumber":"73000001"}]',
  '[{"id":"a","name":"Linh Tran","email":"family@example.com"},
    {"id":"b","name":"Minh Tran","email":"family@example.com"}]'
);
SELECT ok((SELECT count(*) = 1 AND min(first_name) = 'Linh' FROM crm WHERE email = 'family@example.com'),
          'a couple sharing an email does not rename the contact');

-- A corrected address finds the contact the old one made.
INSERT INTO listing_sends (id, homes, clients) VALUES (
  '00000000-0000-4000-8000-00000000cc03', '[{"mlsNumber":"73000001"}]',
  '[{"id":"c","name":"Omar Haddad","email":"omar@exmaple.com"}]'
);
UPDATE listing_sends
   SET clients = '[{"id":"c","name":"Omar Haddad","email":"omar@example.com"}]'
 WHERE id = '00000000-0000-4000-8000-00000000cc03';
SELECT ok((SELECT count(*) FROM crm WHERE first_name = 'Omar') = 1,
          'correcting an email does not file a second contact');

-- ---------------------------------------------------------------------------
-- What a message may and may not be
-- ---------------------------------------------------------------------------

INSERT INTO listing_sends (id, homes) VALUES (
  '00000000-0000-4000-8000-00000000cc04', '[{"mlsNumber":"73000001"}]'
);
SELECT ok((SELECT clients = '[]'::jsonb FROM listing_sends
            WHERE id = '00000000-0000-4000-8000-00000000cc04'),
          'a message may have nobody on it, for pasting into a chat');

INSERT INTO listing_sends (id, homes, clients) VALUES (
  '00000000-0000-4000-8000-00000000cc05', '[{"mlsNumber":"73000001"}]',
  '[{"id":"d","name":"Priya"}]'
);
SELECT ok(send_person('00000000-0000-4000-8000-00000000cc05', 0) ->> 'name' = 'Priya'
          AND send_person('00000000-0000-4000-8000-00000000cc05', 0) -> 'contactId' = 'null'::jsonb,
          'a first name and nothing else is fine on a message, and is not filed');

SELECT ok(raises($$INSERT INTO listing_sends (homes) VALUES ('[]')$$, '23514'),
          'a message needs at least one home');
SELECT ok(raises($$INSERT INTO listing_sends (homes) VALUES ('{"mlsNumber":"73000001"}')$$, '23514'),
          'homes must be a list');
SELECT ok(raises($$INSERT INTO listing_sends (homes, clients)
                   VALUES ('[{"mlsNumber":"73000001"}]', '[{"email":"nobody@example.com"}]')$$, '23514'),
          'a row with an address and no name is refused, in the database''s own words');

-- ---------------------------------------------------------------------------
-- A CRM failure is not a failed save
-- ---------------------------------------------------------------------------

ALTER TABLE contacts RENAME TO contacts_broken;
INSERT INTO listing_sends (id, homes, clients) VALUES (
  '00000000-0000-4000-8000-00000000cc06', '[{"mlsNumber":"73000001"}]',
  '[{"id":"e","name":"Grace Kim","email":"grace@example.com"}]'
);
ALTER TABLE contacts_broken RENAME TO contacts;
SELECT ok(send_person('00000000-0000-4000-8000-00000000cc06', 0) ->> 'name' = 'Grace Kim'
          AND send_person('00000000-0000-4000-8000-00000000cc06', 0) -> 'contactId' = 'null'::jsonb,
          'with the CRM broken the message still saves, unfiled');

UPDATE listing_sends SET sent_at = NOW() WHERE id = '00000000-0000-4000-8000-00000000cc06';
SELECT ok(send_person('00000000-0000-4000-8000-00000000cc06', 0) -> 'contactId' = 'null'::jsonb,
          'stamping sent_at does not run the CRM filing');

UPDATE listing_sends SET clients = clients WHERE id = '00000000-0000-4000-8000-00000000cc06';
SELECT ok(send_person('00000000-0000-4000-8000-00000000cc06', 0) ->> 'contactId' IS NOT NULL,
          'and the next save, with the CRM back, files them');
