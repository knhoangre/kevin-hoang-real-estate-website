-- Leases, made on /admin/applications from a property and the applicants
-- chosen for it.
--
-- Kevin asked on 2026-10-29 to select applicants on a property's page and have
-- the lease made from them — the property, the people, the rent — and opened
-- for him to work on. This is where a lease is kept between visits: it is
-- started on a Tuesday, the landlord answers about the deposit on Thursday,
-- and it is printed for signing on Saturday.
--
-- ONE ROW IS ONE LEASE, AND `doc` IS ALL OF IT. src/lib/lease.ts is the
-- contract for its shape, the way rentalApplication.ts is for an application's
-- and marketing.ts for a booklet's. The columns beside it are copies written at
-- save time, so a property's page can list its leases without opening each:
--
--   title            the address, for the list
--   tenant_names     "Jane Doe and John Smith"
--   property_key     propertyKey() of the property it was made for — the
--                    fallback for filing a lease whose tenants were all typed
--                    in by hand
--   application_ids  the applications its tenants came from. This is what
--                    files a lease under its property (leasesForProperty): an
--                    application moves with its link when the property's
--                    address is corrected, so the lease follows it there.
--
-- NO FOREIGN KEY on application_ids. An array cannot carry one, and a lease is
-- a document Kevin may already have had signed: it must outlive the
-- application it was started from, never be deleted with it.

CREATE TABLE IF NOT EXISTS rental_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT NOT NULL DEFAULT '',
  tenant_names TEXT NOT NULL DEFAULT '',
  property_key TEXT NOT NULL DEFAULT '',
  application_ids UUID[] NOT NULL DEFAULT '{}',

  doc JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(doc) = 'object'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rental_leases_recent ON rental_leases (updated_at DESC);

-- `updated_at` is what the list sorts by, so it is the database's to write —
-- the same rule as marketing_documents and an application's `submitted_at`.
CREATE OR REPLACE FUNCTION public.touch_rental_lease()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

-- Supabase grants every new function to anon and authenticated BY NAME.
REVOKE ALL ON FUNCTION public.touch_rental_lease() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_touch_rental_lease ON rental_leases;
CREATE TRIGGER trg_touch_rental_lease
  BEFORE UPDATE ON rental_leases
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_rental_lease();

-- --- RLS ------------------------------------------------------------------
--
-- Admin only. A lease names its tenants, their phone numbers and the rent, and
-- in draft it is the landlord's terms before anyone has agreed to them. An
-- applicant does not read the lease here; it is printed or sent to them.

ALTER TABLE rental_leases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages leases" ON rental_leases;
CREATE POLICY "Admin manages leases"
  ON rental_leases
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS refuses anon anyway — there is no anon policy — but it should not be the
-- only layer. 20261028120000_tighten_access already withholds writes from anon
-- on every new table; this withholds reads too.
REVOKE ALL ON rental_leases FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON rental_leases TO authenticated;
