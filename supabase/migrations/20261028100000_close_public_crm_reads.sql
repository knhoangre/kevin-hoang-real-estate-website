-- The CRM, the contact-form messages, the sign-in sheets and the property-
-- management tables were readable — and most of them writable — by anyone
-- holding the public key that ships in every browser.
--
-- Measured against the live project on 2026-10-28 with counts only, no fields:
-- with the anon key, contacts_view returned 539 rows, contact_emails 465,
-- contact_phones 429, contact_messages 10, open_house_sign_ins 97, and every
-- pm_* table (pm_users has a password_hash column, pm_owners a tax_id). Four
-- causes, and only the first is in this repo's history:
--
--   * Anon policies from 20240320000004/5/27 — "Allow anonymous selects from
--     contact_emails" and the rest, written when the contact forms inserted
--     from the browser. They no longer do: all three forms post to edge
--     functions that use the service-role key, which RLS does not apply to.
--   * "Allow all operations on contact_<x>" TO anon USING (true) on the four
--     name/email/phone tables and contact_messages. No migration creates
--     these; they were added in the dashboard. They let the anon key UPDATE
--     and DELETE the CRM, not just read it.
--   * RLS was OFF on contact_sources and on all nine pm_* tables, so their
--     table grants — Supabase grants every new table to anon by default — were
--     the only check. The pm_* tables have no migration at all.
--   * contacts_view and the two message views were not security_invoker. A
--     view runs as its owner (postgres) by default, and the owner is not
--     subject to RLS — so even with every table above closed, the views would
--     still have handed the whole CRM to anon, and to any signed-in visitor.
--
-- Nothing public reads these. Every browser reader is an admin page — the CRM,
-- the follow-up lists, the unread counts, and the two kiosks, which fetch only
-- once isAdmin is true — and those read through the "Allow admins to view all
-- <x>" policies, which stay. The forms write as the service role.
--
-- What this does NOT do: delete anything, or decide what the pm_* tables are
-- for. They are locked to the admin, and whether they hold real data is
-- Kevin's to say.

-- ---------------------------------------------------------------------------
-- The policies that let anon (or any signed-in visitor) in
-- ---------------------------------------------------------------------------
-- By name, from `supabase db dump` of the live project. The DO block at the
-- end is what catches one this list missed.

DROP POLICY IF EXISTS "Allow all operations on contact_first_names" ON contact_first_names;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_first_names" ON contact_first_names;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_first_names" ON contact_first_names;

DROP POLICY IF EXISTS "Allow all operations on contact_last_names" ON contact_last_names;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_last_names" ON contact_last_names;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_last_names" ON contact_last_names;

DROP POLICY IF EXISTS "Allow all operations on contact_emails" ON contact_emails;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_emails" ON contact_emails;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_emails" ON contact_emails;

DROP POLICY IF EXISTS "Allow all operations on contact_phones" ON contact_phones;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_phones" ON contact_phones;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_phones" ON contact_phones;

DROP POLICY IF EXISTS "Allow all operations on contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow anonymous inserts to contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow anonymous selects from contact_messages" ON contact_messages;

DROP POLICY IF EXISTS "Allow anonymous inserts to contacts" ON contacts;
DROP POLICY IF EXISTS "Allow anonymous selects from contacts" ON contacts;

-- TO anon, authenticated: the second let any signed-in visitor — a rental
-- applicant, someone who saved a home — read every open-house guest's name,
-- email and phone. It was for the kiosk's list of previous addresses, which
-- the kiosk now fetches only as the admin.
DROP POLICY IF EXISTS "Allow public insert on open_house_sign_ins" ON open_house_sign_ins;
DROP POLICY IF EXISTS "Allow public read distinct addresses from open_house_sign_ins" ON open_house_sign_ins;

-- ---------------------------------------------------------------------------
-- RLS on, and the admin's policy where a table had none
-- ---------------------------------------------------------------------------
-- contact_sources already has "Allow admins to view/insert contact_sources",
-- which did nothing while RLS was off; turning it on is what makes them apply.
-- The pm_* tables have no policies, so the admin gets one FOR ALL — as RLS-on
-- with no policy they would be closed to him too.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'contact_first_names', 'contact_last_names', 'contact_emails', 'contact_phones',
    'contact_sources', 'contacts', 'contact_messages', 'contact_addresses',
    'contact_birthdays', 'contact_home_anniversaries', 'contact_tags',
    'contact_tag_assignments', 'open_house_sign_ins', 'event_sign_ins'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'pm_activities', 'pm_documents', 'pm_expenses', 'pm_maintenance', 'pm_owners',
    'pm_payments', 'pm_properties', 'pm_tenants', 'pm_users'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin manages %s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "Admin manages %s" ON public.%I FOR ALL TO authenticated '
      'USING (public.is_admin()) WITH CHECK (public.is_admin())', t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- The views read as the person asking
-- ---------------------------------------------------------------------------
-- With security_invoker the admin reads contacts_view through his own policies
-- on each of the twelve tables it joins, all of which he has. Any later
-- CREATE OR REPLACE VIEW of these must restate WITH (security_invoker = true):
-- the test asserts it, because a view that drops it reopens everything above
-- without a single policy changing.

ALTER VIEW public.contacts_view SET (security_invoker = true);
ALTER VIEW public.contact_messages_view SET (security_invoker = true);
ALTER VIEW public.admin_contact_messages_view SET (security_invoker = true);
REVOKE ALL ON public.contacts_view FROM anon;
REVOKE ALL ON public.contact_messages_view FROM anon;
REVOKE ALL ON public.admin_contact_messages_view FROM anon;

-- ---------------------------------------------------------------------------
-- Refuse to finish with a door still open
-- ---------------------------------------------------------------------------
-- A policy this file did not name — made in the dashboard after the dump —
-- would otherwise survive silently. Fail the migration instead.

DO $$
DECLARE
  leftover TEXT;
BEGIN
  SELECT string_agg(format('%s on %s', policyname, tablename), ', ')
    INTO leftover
    FROM pg_policies
   WHERE schemaname = 'public'
     AND (tablename LIKE 'contact%' OR tablename LIKE 'pm\_%'
          OR tablename IN ('open_house_sign_ins', 'event_sign_ins'))
     AND (roles && ARRAY['anon', 'public']::name[]);
  IF leftover IS NOT NULL THEN
    RAISE EXCEPTION 'policies still open to anon/public: %', leftover;
  END IF;

  SELECT string_agg(c.relname, ', ')
    INTO leftover
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
   WHERE (c.relname LIKE 'contact%' OR c.relname LIKE 'pm\_%'
          OR c.relname IN ('open_house_sign_ins', 'event_sign_ins'))
     AND c.relkind IN ('r', 'v')
     AND has_table_privilege('anon', c.oid, 'SELECT');
  IF leftover IS NOT NULL THEN
    RAISE EXCEPTION 'anon can still read: %', leftover;
  END IF;
END $$;
