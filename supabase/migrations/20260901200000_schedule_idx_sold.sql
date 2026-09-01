-- Add the sold feeds to the schedule.
--
-- WHY SLICES. The Edge Function's resource budget tops out around 8,000 rows
-- per invocation — measured, not assumed: 8,000 succeeds and a full 19,821-row
-- pass fails with WORKER_RESOURCE_LIMIT. The sold feeds are 43,911 / 30,803 /
-- 19,343 / 6,432 rows, so each is walked in 8,000-row windows counted by LINE
-- position, which makes the slices tile the file exactly.
--
-- WHY NIGHTLY. A closing does not change after it records, and the feed is a
-- rolling one-year window. Re-pulling 100,000 sold rows every hour would spend
-- the whole day's function budget restating yesterday's facts. The ACTIVE
-- feeds stay hourly, because those are what a buyer is looking at.
--
-- The final job of the night runs the retention sweep (`prune`), which deletes
-- sold rows no slice has touched in three days — the sold equivalent of the
-- active feeds' full-file diff. Three days, not one, so a single failed slice
-- cannot delete real listings.

DO $$
DECLARE
  job_name TEXT;
BEGIN
  FOREACH job_name IN ARRAY ARRAY[
    'idx-sold-sf-1', 'idx-sold-sf-2', 'idx-sold-sf-3', 'idx-sold-sf-4',
    'idx-sold-sf-5', 'idx-sold-sf-6',
    'idx-sold-cc-1', 'idx-sold-cc-2', 'idx-sold-cc-3',
    'idx-sold-rn-1', 'idx-sold-rn-2', 'idx-sold-rn-3', 'idx-sold-rn-4',
    'idx-sold-mf-1', 'idx-sold-prune'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = job_name) THEN
      PERFORM cron.unschedule(job_name);
    END IF;
  END LOOP;
END;
$$;

-- Ten minutes apart so two never overlap: each holds an MLS PIN session and
-- streams a file up to 66 MB.
SELECT cron.schedule('idx-sold-sf-1', '0 2 * * *',  $$ SELECT public.trigger_idx_sync('{"propTypes":["SF"],"feed":"sold","offset":0,"limit":8000}'::jsonb) $$);
SELECT cron.schedule('idx-sold-sf-2', '10 2 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["SF"],"feed":"sold","offset":8000,"limit":8000}'::jsonb) $$);
SELECT cron.schedule('idx-sold-sf-3', '20 2 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["SF"],"feed":"sold","offset":16000,"limit":8000}'::jsonb) $$);
SELECT cron.schedule('idx-sold-sf-4', '30 2 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["SF"],"feed":"sold","offset":24000,"limit":8000}'::jsonb) $$);
SELECT cron.schedule('idx-sold-sf-5', '40 2 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["SF"],"feed":"sold","offset":32000,"limit":8000}'::jsonb) $$);
-- Deliberately past the current end of the file: the feed grows, and a slice
-- that lands beyond it simply ingests nothing.
SELECT cron.schedule('idx-sold-sf-6', '50 2 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["SF"],"feed":"sold","offset":40000,"limit":8000}'::jsonb) $$);

SELECT cron.schedule('idx-sold-cc-1', '0 3 * * *',  $$ SELECT public.trigger_idx_sync('{"propTypes":["CC"],"feed":"sold","offset":0,"limit":8000}'::jsonb) $$);
SELECT cron.schedule('idx-sold-cc-2', '10 3 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["CC"],"feed":"sold","offset":8000,"limit":8000}'::jsonb) $$);
SELECT cron.schedule('idx-sold-cc-3', '20 3 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["CC"],"feed":"sold","offset":16000,"limit":8000}'::jsonb) $$);

SELECT cron.schedule('idx-sold-rn-1', '0 4 * * *',  $$ SELECT public.trigger_idx_sync('{"propTypes":["RN"],"feed":"sold","offset":0,"limit":8000}'::jsonb) $$);
SELECT cron.schedule('idx-sold-rn-2', '10 4 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["RN"],"feed":"sold","offset":8000,"limit":8000}'::jsonb) $$);
SELECT cron.schedule('idx-sold-rn-3', '20 4 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["RN"],"feed":"sold","offset":16000,"limit":8000}'::jsonb) $$);
SELECT cron.schedule('idx-sold-rn-4', '30 4 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["RN"],"feed":"sold","offset":24000,"limit":8000}'::jsonb) $$);

SELECT cron.schedule('idx-sold-mf-1', '40 4 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["MF"],"feed":"sold","offset":0,"limit":8000}'::jsonb) $$);

-- After every slice has had its turn.
SELECT cron.schedule('idx-sold-prune', '30 5 * * *', $$ SELECT public.trigger_idx_sync('{"propTypes":["MF"],"feed":"sold","offset":0,"limit":8000,"prune":true}'::jsonb) $$);
