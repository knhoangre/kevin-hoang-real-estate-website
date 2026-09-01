-- Hourly IDX ingest, via pg_cron calling the idx-sync Edge Function.
--
-- WHY ONE JOB PER PROPERTY TYPE. The four active feeds are ~28 MB of text and
-- ~22,000 rows together, and a single invocation doing all four risks the Edge
-- Function wall-clock limit. Split and staggered, each run is small, and a
-- failure costs one property type for one hour instead of the whole feed.
--
-- WHY THE KEY IS IN VAULT. The cron command is stored as plain text in
-- cron.job, which anyone with database access can read. vault.decrypted_secrets
-- keeps the service-role key out of that table. The secret is created OUT OF
-- BAND (it is a credential, so it is not in this file and not in the repo):
--
--   select vault.create_secret('<service-role-key>', 'idx_sync_service_key');
--
-- If that secret is missing, the jobs run and fail with an authorisation error
-- rather than silently doing nothing — which idx_sync_runs will record.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent: unschedule before scheduling, so re-running this migration
-- updates the timings rather than erroring on a duplicate job name.
DO $$
DECLARE
  -- Named job_name, not job: `job` collides with cron.job's own column in the
  -- EXISTS below, and PL/pgSQL resolves the variable, matching every row.
  job_name TEXT;
BEGIN
  FOREACH job_name IN ARRAY ARRAY[
    'idx-sync-sf', 'idx-sync-cc', 'idx-sync-rn', 'idx-sync-mf', 'idx-sync-offices'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = job_name) THEN
      PERFORM cron.unschedule(job_name);
    END IF;
  END LOOP;
END;
$$;

-- One helper so the four schedules do not each repeat the URL and the header
-- construction — and so the key is read in exactly one place.
CREATE OR REPLACE FUNCTION public.trigger_idx_sync(body JSONB)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
-- Empty search_path: a SECURITY DEFINER function that resolves names through
-- the caller's search_path can be tricked into running the caller's code.
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
    url := 'https://zvipgykolpoxukyjgffx.supabase.co/functions/v1/idx-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || key
    ),
    body := body,
    -- The single-family feed is the slowest at roughly a minute end to end.
    timeout_milliseconds := 300000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_idx_sync(JSONB) FROM PUBLIC, anon, authenticated;

-- Staggered across the hour so two runs never overlap: each holds a MLS PIN
-- session and pushes thousands of rows, and running them together is how you
-- find the connection limit.
SELECT cron.schedule('idx-sync-sf', '5 * * * *',  $$ SELECT public.trigger_idx_sync('{"propTypes":["SF"]}'::jsonb) $$);
SELECT cron.schedule('idx-sync-cc', '20 * * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["CC"]}'::jsonb) $$);
SELECT cron.schedule('idx-sync-rn', '35 * * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["RN"]}'::jsonb) $$);
SELECT cron.schedule('idx-sync-mf', '50 * * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["MF"]}'::jsonb) $$);

-- Office names change rarely and the file is public and unchanging in shape.
-- Weekly, at a quiet hour, rather than 168 times a week for nothing.
SELECT cron.schedule('idx-sync-offices', '40 3 * * 0', $$ SELECT public.trigger_idx_sync('{"propTypes":["MF"],"offices":true}'::jsonb) $$);
