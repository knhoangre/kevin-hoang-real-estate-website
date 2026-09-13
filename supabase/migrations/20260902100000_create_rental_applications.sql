-- Rental applications.
--
-- The admin creates an invite, shares /apply/<token>, and the recipient creates
-- an account and fills the application. Two tables:
--
--   rental_application_invites  the shareable links, revocable and expirable
--   rental_applications         one draft-then-submitted document per invite
--
-- Deliberately absent: Social Security Number and bank account numbers. The
-- paper form this replaces (GBREB RH101) collects both; storing them here is
-- real breach and compliance exposure and nothing on this site needs them.

-- ---------------------------------------------------------------------------
-- Invites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_application_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The secret in the URL. 48 hex characters from gen_random_bytes, generated
  -- server-side: a client-generated token is only as unguessable as whatever
  -- the client happened to use, and this value is the entire access control on
  -- /apply/<token> before sign-in.
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),

  -- What the applicant is applying FOR. Shown on the landing page before they
  -- sign up, and prefilled into the application's tenancy section.
  label TEXT,
  property_address TEXT,
  unit TEXT,
  monthly_rent NUMERIC(10, 2),

  -- The admin's own note of who this went to. NOT used for access control —
  -- the token is the credential, and requiring a matching email would break
  -- the common case of a link forwarded to a co-applicant.
  invitee_email TEXT,

  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rental_invites_created_at
  ON rental_application_invites (created_at DESC);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  invite_id UUID REFERENCES rental_application_invites (id) ON DELETE SET NULL,
  applicant_user_id UUID NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users (id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'reviewing', 'approved', 'declined', 'withdrawn')),

  -- The whole answer set. Kept as jsonb rather than sixty columns because the
  -- shape will change as this is used, and every change would otherwise be a
  -- migration plus a types.ts regeneration. The real contract is the zod schema
  -- in src/lib/rentalApplication.ts.
  data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Denormalised out of `data` on write so the admin list renders without
  -- parsing jsonb for every row, and so the list can be sorted and searched.
  applicant_first_name TEXT,
  applicant_last_name TEXT,
  applicant_email TEXT,
  applicant_phone TEXT,

  -- The two consents, stamped at submit. Separate columns rather than flags
  -- inside `data`: they are the record that a specific authorisation was given
  -- at a specific time, which is the part that has to survive a schema change.
  certified_at TIMESTAMPTZ,
  credit_auth_at TIMESTAMPTZ,

  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One application per invite. A second person opening a forwarded link gets the
-- generic "no longer available" page rather than a competing blank form.
CREATE UNIQUE INDEX IF NOT EXISTS idx_rental_applications_invite
  ON rental_applications (invite_id) WHERE invite_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rental_applications_applicant
  ON rental_applications (applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_status
  ON rental_applications (status, submitted_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_rental_application()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rental_applications_touch ON rental_applications;
CREATE TRIGGER trg_rental_applications_touch
  BEFORE UPDATE ON rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_rental_application();

-- ---------------------------------------------------------------------------
-- What an applicant may change about their own application
-- ---------------------------------------------------------------------------
-- This is a trigger rather than an RLS predicate on purpose. As RLS it would
-- make the row silently invisible to UPDATE — the applicant would see a
-- successful save that changed nothing. As a trigger they get an error the UI
-- can show, and the admin can still move the status along.
--
-- Two rules, and the second matters as much as the first: the RLS UPDATE policy
-- above is scoped by ROW, not by column, so without this an applicant could
-- perfectly well set their own status to 'approved'.
CREATE OR REPLACE FUNCTION public.guard_submitted_rental_application()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- 1. Once it leaves draft it is a record, not a document in progress.
  IF OLD.status <> 'draft' THEN
    RAISE EXCEPTION 'This application has already been submitted and can no longer be edited.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2. The applicant may submit or withdraw. Every other status is a decision
  --    the admin makes about them.
  IF NEW.status NOT IN ('draft', 'submitted', 'withdrawn') THEN
    RAISE EXCEPTION 'Only an administrator can set an application to %.', NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3. The invite and the owner are assigned once, by the edge function.
  IF NEW.invite_id IS DISTINCT FROM OLD.invite_id
     OR NEW.applicant_user_id IS DISTINCT FROM OLD.applicant_user_id THEN
    RAISE EXCEPTION 'An application cannot be reassigned.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_rental_applications_guard ON rental_applications;
CREATE TRIGGER trg_rental_applications_guard
  BEFORE UPDATE ON rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_submitted_rental_application();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE rental_application_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_applications ENABLE ROW LEVEL SECURITY;

-- Invites are admin-only, with NO anon or authenticated read. Resolving a token
-- happens in the rental-application-invite edge function under the service-role
-- key, which returns only the label and property — a SELECT policy here, even
-- one filtered by token, would let anyone enumerate the table.
CREATE POLICY "Allow admins full access to rental application invites"
  ON rental_application_invites
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins full access to rental applications"
  ON rental_applications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- The applicant sees and edits their own, and nobody else's.
CREATE POLICY "Allow applicants to read their own rental application"
  ON rental_applications
  FOR SELECT
  TO authenticated
  USING (applicant_user_id = auth.uid());

CREATE POLICY "Allow applicants to update their own rental application"
  ON rental_applications
  FOR UPDATE
  TO authenticated
  USING (applicant_user_id = auth.uid())
  WITH CHECK (applicant_user_id = auth.uid());

-- No applicant INSERT policy. Rows are created by the edge function, which is
-- the only thing that can verify the invite token — an INSERT policy here would
-- let any signed-in user create an application with no invite at all.

GRANT SELECT, INSERT, UPDATE, DELETE ON rental_application_invites TO authenticated;
GRANT SELECT, UPDATE ON rental_applications TO authenticated;
