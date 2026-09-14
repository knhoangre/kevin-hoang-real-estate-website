-- Tell the admin when an application is submitted.
--
-- Until now the only way to learn that somebody had finished was to open
-- /admin/applications and look. The email is sent by the
-- `rental-application-submitted` edge function under the service-role key; this
-- migration adds the one piece of state that function needs.
--
-- WHY A COLUMN AND NOT NOTHING. The function is called by the applicant's
-- browser, which is the same arrangement as every other mail on this site — and
-- a browser can call it twice. A submitted application can also be edited and
-- sent again, which IS worth a second email, but not thirty seconds after the
-- first. `admin_notified_at` is what makes the difference between those two
-- cases knowable.

ALTER TABLE rental_applications
  ADD COLUMN IF NOT EXISTS admin_notified_at TIMESTAMPTZ;

COMMENT ON COLUMN rental_applications.admin_notified_at IS
  'When the admin was last emailed about a submission. Written only by the '
  'rental-application-submitted edge function; see rule 6 of '
  'guard_submitted_rental_application.';

-- ---------------------------------------------------------------------------
-- The guard gains one rule
-- ---------------------------------------------------------------------------
-- RLS is scoped by ROW, not by column — the same lesson as the status column
-- next door. The applicant's UPDATE policy covers their whole row, so without
-- this they could stamp `admin_notified_at` themselves and every later
-- submission would look already-notified. Suppressing the email announcing your
-- own application is a self-defeating thing to want, which is exactly why it
-- would never be noticed.
--
-- Rules 1-5 are unchanged from 20260913100000; the body is restated in full
-- because CREATE OR REPLACE FUNCTION has no other form.
CREATE OR REPLACE FUNCTION public.guard_submitted_rental_application()
RETURNS TRIGGER AS $$
BEGIN
  -- `service_role` is new here, and rule 6 below is why it had to be. An edge
  -- function running under the service-role key bypasses RLS but NOT triggers,
  -- and public.is_admin() resolves auth.uid(), which is NULL in that context —
  -- so every rule below would have applied to our own server, and rule 6 would
  -- have silently discarded the stamp the notifier had just written. Silently:
  -- the UPDATE reports success, because a BEFORE trigger assigning to NEW is not
  -- a failure. The guard exists to constrain the applicant's browser; the
  -- service role is the trusted side of that line.
  IF public.is_admin() OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 1. Up to the point where Kevin starts reading it, it is theirs.
  IF OLD.status NOT IN ('draft', 'submitted') THEN
    RAISE EXCEPTION 'This application is being reviewed and can no longer be edited.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2. The applicant may submit or withdraw. Every other status is a decision
  --    the admin makes about them.
  IF NEW.status NOT IN ('draft', 'submitted', 'withdrawn') THEN
    RAISE EXCEPTION 'Only an administrator can set an application to %.', NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3. No un-submitting. Going back to draft would take a submitted application
  --    out of the admin's list without saying so; withdrawing is how somebody
  --    stops an application, and it is visible.
  IF OLD.status = 'submitted' AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'An application that has been sent cannot be returned to draft. Withdraw it instead.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 4. The invite and the owner are assigned once, by the edge function.
  IF NEW.invite_id IS DISTINCT FROM OLD.invite_id
     OR NEW.applicant_user_id IS DISTINCT FROM OLD.applicant_user_id THEN
    RAISE EXCEPTION 'An application cannot be reassigned.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 5. The first submission is when it was sent, and editing afterwards does not
  --    change that. Enforced here rather than in submitApplication because the
  --    client cannot be the thing that decides what a timestamp means, and every
  --    later save would otherwise move the date the admin sorts the list by.
  IF OLD.submitted_at IS NOT NULL THEN
    NEW.submitted_at = OLD.submitted_at;
  END IF;

  -- 6. The notification stamp is not the applicant's. Silently held rather than
  --    raised: this is not something a client would set on purpose, so an error
  --    would only ever surface as a failed save for an honest applicant whose
  --    payload happened to carry the column back.
  NEW.admin_notified_at = OLD.admin_notified_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_rental_applications_guard ON rental_applications;
CREATE TRIGGER trg_rental_applications_guard
  BEFORE UPDATE ON rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_submitted_rental_application();
