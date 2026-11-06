-- The monthly market report by email.
--
-- A visitor signs up on /market, a town's report, a monthly post or the
-- homepage, confirms from an email (double opt-in), and gets their towns' report
-- once a month. The rules are in supabase/functions/_shared/marketEmail.ts; the
-- market-email function does the work under the service role.
--
-- No browser writes either table. The admin reads both, for the subscriber list
-- on /admin/market; nobody else reads anything. A subscriber is reached only by
-- the token in their own emails.

CREATE TABLE IF NOT EXISTS public.market_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL CHECK (email = lower(email) AND position('@' IN email) > 1),
  -- Slugs from SITE.marketTowns ("newton-ma"). The function checks them; the
  -- database only that there is at least one.
  towns TEXT[] NOT NULL CHECK (cardinality(towns) BETWEEN 1 AND 20),
  -- The credential in every link: confirm, unsubscribe, one-click unsubscribe.
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  -- The page they signed up on.
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirm_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS market_subscribers_email ON public.market_subscribers (email);
CREATE UNIQUE INDEX IF NOT EXISTS market_subscribers_token ON public.market_subscribers (token);

-- One row per subscriber and month, CLAIMED before the email goes: the daily run,
-- a retry or a second run in a day finds the row and sends nothing.
CREATE TABLE IF NOT EXISTS public.market_email_sends (
  subscriber_id UUID NOT NULL REFERENCES public.market_subscribers (id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  error TEXT,
  PRIMARY KEY (subscriber_id, month)
);

ALTER TABLE public.market_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_email_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin reads market subscribers" ON public.market_subscribers;
CREATE POLICY "Admin reads market subscribers"
  ON public.market_subscribers FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin reads market email sends" ON public.market_email_sends;
CREATE POLICY "Admin reads market email sends"
  ON public.market_email_sends FOR SELECT TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.market_subscribers, public.market_email_sends FROM anon, authenticated;
GRANT SELECT ON public.market_subscribers, public.market_email_sends TO authenticated;

-- ---------------------------------------------------------------------------
-- The daily run
-- ---------------------------------------------------------------------------
-- Every day at 15:00 UTC (10 or 11 AM in Boston). The reports are committed on
-- the 3rd at 14:00 UTC and deployed minutes later, so the 3rd's run usually
-- sends the new month; each run sends at most DAILY_BATCH and the rest follow
-- on the days after. A day with nobody due sends nothing. The key is the vault
-- secret idx-sync and the showing reminders use, read the same way.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = 'market-email') THEN
    PERFORM cron.unschedule('market-email');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_market_email()
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
    url := 'https://zvipgykolpoxukyjgffx.supabase.co/functions/v1/market-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || key
    ),
    body := '{"action":"run"}'::jsonb,
    timeout_milliseconds := 120000
  );
END;
$$;

-- By name as well as from PUBLIC: Supabase grants every new function in
-- `public` to anon and authenticated directly.
REVOKE ALL ON FUNCTION public.trigger_market_email() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('market-email', '0 15 * * *', $$ SELECT public.trigger_market_email() $$);
