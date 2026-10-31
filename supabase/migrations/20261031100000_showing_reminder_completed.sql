-- "Completed" on a showing's reminder, so a client is not messaged twice.
--
-- Most of these messages leave by Kevin's own hand: a text from his phone, or
-- the Zillow chat, which no software can post into. Nothing can see those go, so
-- pressing the button on /admin/showings is the record of it, and it has to be
-- here rather than in the browser or his phone and his computer would disagree.
--
-- A 'done' row is one showing on one day, under the same UNIQUE as the rest of
-- the log, and undoing it deletes the row. The 8 AM run reads these first, so
-- marking a showing before 8 also stops its automatic email.
--
-- The table still has no policy and no browser grant: the edge function's `mark`
-- action writes these rows, and it checks for the admin itself.

ALTER TABLE public.showing_reminders DROP CONSTRAINT IF EXISTS showing_reminders_kind_check;
ALTER TABLE public.showing_reminders
  ADD CONSTRAINT showing_reminders_kind_check CHECK (kind IN ('client', 'digest', 'done'));

-- How Kevin sent it. Mirrors SEND_WAYS in _shared/showingReminders.ts.
ALTER TABLE public.showing_reminders ADD COLUMN IF NOT EXISTS how TEXT;
ALTER TABLE public.showing_reminders DROP CONSTRAINT IF EXISTS showing_reminders_how_check;
ALTER TABLE public.showing_reminders
  ADD CONSTRAINT showing_reminders_how_check CHECK (how IS NULL OR how IN ('zillow', 'text', 'email', 'other'));
