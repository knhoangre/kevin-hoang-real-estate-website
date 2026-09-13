-- Let an applicant keep editing until review starts, and make withdraw work.
--
-- The original guard froze the answers the moment the status left 'draft'. That
-- fit a form where every section was required: submitting meant the document was
-- finished. It stopped fitting on 2026-09-13, when everything below the
-- applicant's own details became optional — the intended flow is now that
-- somebody submits with a PDF and five fields and fills in the rest later, and
-- under the old rule they could not.
--
-- It also contained a branch that could never run: rule 2 permitted the applicant
-- to set 'withdrawn', but rule 1 had already rejected every update where
-- OLD.status <> 'draft', so an application could not be withdrawn once it was
-- submitted — which is the only state anyone would want to withdraw from.
--
-- The line moves from "submitted" to "review has started". While the status is
-- draft or submitted the applicant owns the document; the moment it is reviewing,
-- approved, declined or withdrawn it is a record of what was considered, and only
-- an admin can touch it.
CREATE OR REPLACE FUNCTION public.guard_submitted_rental_application()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_admin() THEN
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger itself is unchanged and still BEFORE UPDATE; only the body above
-- is replaced. Recreated for the case where this runs against a database that
-- somehow has the function without it.
DROP TRIGGER IF EXISTS trg_rental_applications_guard ON rental_applications;
CREATE TRIGGER trg_rental_applications_guard
  BEFORE UPDATE ON rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_submitted_rental_application();
