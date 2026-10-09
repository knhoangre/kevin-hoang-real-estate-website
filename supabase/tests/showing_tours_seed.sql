-- Tours as they were BEFORE 20261008100000_showing_tour_people: one client, in
-- three columns. Applied between the two showing-tour migrations so the tests
-- can assert what the second one does to rows that already exist.

INSERT INTO auth.users (id, email, raw_app_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000d1', 'agent@example.com', '{"is_admin": true}'),
  ('00000000-0000-4000-8000-0000000000d2', 'visitor@example.com', '{}');

INSERT INTO showing_tours (id, client_name, client_email, client_phone, tour_date) VALUES
  ('00000000-0000-4000-8000-00000000aa01', '  Old   Client ', 'OLD@Example.com ', NULL, '2026-10-03'),
  ('00000000-0000-4000-8000-00000000aa02', 'Phone Only', NULL, '617-555-0101', '2026-10-04');
