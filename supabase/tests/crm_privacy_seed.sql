-- One of everything the CRM privacy tests read: an admin and a visitor, one
-- contact with a name, email, phone and source, a contact-form message, an
-- open-house sign-in, and a row in two of the property-management tables.
-- Inserted as the owner, so it is in place whatever the policies say.

INSERT INTO auth.users (id, email, raw_app_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000e1', 'agent@example.com', '{"is_admin": true}'),
  ('00000000-0000-4000-8000-0000000000e2', 'visitor@example.com', '{}');

INSERT INTO contact_first_names (id, first_name) VALUES (1, 'Sarah');
INSERT INTO contact_last_names (id, last_name) VALUES (1, 'Lee');
INSERT INTO contact_emails (id, email) VALUES (1, 'sarah@example.com');
INSERT INTO contact_phones (id, phone) VALUES (1, '617-555-0142');
INSERT INTO contact_sources (id, source) VALUES (1, 'Website');
INSERT INTO contacts (id, first_name_id, last_name_id, email_id, phone_id, source_id, is_active)
  VALUES (1, 1, 1, 1, 1, 1, TRUE);

INSERT INTO contact_messages (id, first_name_id, last_name_id, email_id, phone_id, source_id, message, is_active)
  VALUES (1, 1, 1, 1, 1, 1, 'Is the house on Elm St still available?', TRUE);

INSERT INTO open_house_sign_ins (id, address, first_name_id, last_name_id, email_id, phone_id, is_active)
  VALUES (1, '12 Elm St', 1, 1, 1, 1, TRUE);

INSERT INTO pm_users (id, username, email, password_hash, first_name, last_name)
  VALUES (1, 'owner', 'owner@example.com', 'not-a-real-hash', 'Pat', 'Owner');
INSERT INTO pm_owners (id, first_name, last_name, email)
  VALUES (1, 'Pat', 'Owner', 'owner@example.com');
