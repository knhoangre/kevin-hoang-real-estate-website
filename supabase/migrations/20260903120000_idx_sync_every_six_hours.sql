-- Move the active IDX ingest from hourly to every six hours.
--
-- WAS: each of the four active feeds ran once an hour, staggered across it —
-- SF at :05, CC at :20, RN at :35, MF at :50. That is 96 runs a day, each one
-- downloading its whole feed and upserting every row in it.
--
-- NOW: the same four jobs, the same stagger, at 00/06/12/18. 16 runs a day.
--
-- WHY HOURLY WAS MORE THAN THE DATA JUSTIFIES. The feed is a full snapshot, not
-- a changeset: every run pulls ~28 MB of text and rewrites all ~22,000 rows
-- whether or not anything moved. Against that, 41 price changes have been
-- observed in total. Residential listing data does not move at the rate we were
-- asking for it — an hourly poll was spending four full feed downloads and
-- 22,000 row updates per hour to learn, almost always, that nothing had
-- happened.
--
-- WHAT IT COSTS. A price cut or a new listing is now visible within six hours
-- rather than one, and idx_price_history records the change at the sync that
-- noticed it, so the timestamps on a movement are accurate to six hours rather
-- than to one. Neither matters for what this feature is for: a buyer deciding
-- whether to ask about a house, and an agent sending a link. It would matter if
-- anything here made a claim to the minute, and nothing does — the pages say
-- "recorded here" and date the feed's last successful load precisely because
-- the resolution is the sync interval, not the market.
--
-- CHECK THE IDX AGREEMENT BEFORE GOING SLOWER THAN THIS. MLS PIN sets a minimum
-- refresh obligation for IDX displays in the participant agreement, and it is a
-- contractual term rather than something this file can assert. Six hours is
-- comfortably inside the intervals such agreements typically require; twelve or
-- twenty-four would be worth reading the agreement over first.
--
-- The sold feed is untouched. It already runs once a day
-- (20260901200000_schedule_idx_sold.sql), which is the right cadence for
-- closings — and it is paginated across several jobs, so changing its shape is
-- a bigger question than this one.
--
-- The offices job is untouched: weekly, and office names change rarely.

-- Idempotent, and identical in form to the original migration so re-running
-- either one leaves exactly four active-feed jobs rather than eight.
DO $$
DECLARE
  job_name TEXT;
BEGIN
  FOREACH job_name IN ARRAY ARRAY[
    'idx-sync-sf', 'idx-sync-cc', 'idx-sync-rn', 'idx-sync-mf'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = job_name) THEN
      PERFORM cron.unschedule(job_name);
    END IF;
  END LOOP;
END;
$$;

-- The stagger within the hour is kept exactly as it was, and for the original
-- reason: each run holds an MLS PIN session and pushes thousands of rows, and
-- starting them together is how you find the connection limit. Fifteen minutes
-- apart also means a run that overshoots its usual minute cannot collide with
-- the next.
--
-- Hours 0, 6, 12 and 18 UTC. The 18:xx run lands early afternoon in
-- Massachusetts, so the freshest snapshot of the day covers the hours when
-- listings are actually being viewed.
SELECT cron.schedule('idx-sync-sf', '5 0,6,12,18 * * *',  $$ SELECT public.trigger_idx_sync('{"propTypes":["SF"]}'::jsonb) $$);
SELECT cron.schedule('idx-sync-cc', '20 0,6,12,18 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["CC"]}'::jsonb) $$);
SELECT cron.schedule('idx-sync-rn', '35 0,6,12,18 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["RN"]}'::jsonb) $$);
SELECT cron.schedule('idx-sync-mf', '50 0,6,12,18 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["MF"]}'::jsonb) $$);
