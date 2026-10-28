-- The morning-of showing reminder: what went out, and the 8 AM run that sends it.
--
-- Every morning the `showing-reminders` edge function reads Kevin's Google
-- Calendar and today's showing tours, emails each client who is a guest on his
-- event, and emails Kevin one summary with every message written out for him
-- to text or paste into Zillow. See _shared/showingReminders.ts for the rules.
--
-- WHY A TABLE. A reminder must go out once. The schedule below fires twice (see
-- there), a run can be retried, and Kevin can press nothing that re-sends — so
-- each email is CLAIMED here before it is sent: one row per day, kind and
-- showing, and an INSERT that finds the row already there sends nothing. It is
-- also how /admin/showings says "Emailed sarah@… at 8:00 AM".
--
-- Nothing in the browser reads or writes it. The edge function does both under
-- the service-role key, and the admin page asks the function — so there is no
-- policy at all, and no grant to anon or authenticated.

CREATE TABLE IF NOT EXISTS public.showing_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The Boston date the showing is on, which is the date the reminder went.
  day DATE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('client', 'digest')),
  -- 'cal:<event uid>', 'tour:<tour id>', or 'digest' for Kevin's summary.
  source_key TEXT NOT NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (day, kind, source_key)
);

ALTER TABLE public.showing_reminders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.showing_reminders FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- The 8 AM run
-- ---------------------------------------------------------------------------
-- pg_cron runs in UTC and Boston moves an hour twice a year, so the job fires
-- at 12:00 AND 13:00 UTC — 8 AM in summer time and 8 AM in winter — and the
-- function goes ahead only on whichever of the two is 8 o'clock in Boston.
-- The other run returns without reading anything.
--
-- The key is the vault secret idx-sync already uses (it is the service-role
-- key, whatever its name says), read in the same way, for the reason given in
-- 20260901090000_schedule_idx_sync.sql: cron.job stores its command as plain
-- text.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = 'showing-reminders') THEN
    PERFORM cron.unschedule('showing-reminders');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_showing_reminders()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  key TEXT;
BEGIN
  SELECT decrypted_secret INTO key
  FROM vault.decrypted_secrets
  WHERE name = 'idx_sync_service_key';

  IF key IS NULL THEN
    RAISE EXCEPTION 'vault secret idx_sync_service_key is not set';
  END IF;

  RETURN net.http_post(
    url := 'https://zvipgykolpoxukyjgffx.supabase.co/functions/v1/showing-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || key
    ),
    body := '{"action":"run"}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- By name as well as from PUBLIC: Supabase grants every new function in
-- `public` to anon and authenticated directly.
REVOKE ALL ON FUNCTION public.trigger_showing_reminders() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('showing-reminders', '0 12,13 * * *', $$ SELECT public.trigger_showing_reminders() $$);
