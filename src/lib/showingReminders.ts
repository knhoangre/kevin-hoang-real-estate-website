/**
 * The morning-of showing reminders, as /admin/showings shows them.
 *
 * Every rule is in the `showing-reminders` edge function and the pure module
 * behind it (supabase/functions/_shared/showingReminders.ts): which events on
 * Kevin's Google Calendar are showings, who is emailed at 8, what the message
 * says. This only asks for the day and describes the answer. It sends nothing —
 * the page's buttons open Messages or a mail draft on Kevin's own phone.
 */
import { supabase } from '@/integrations/supabase/client';
import { functionMessage } from '@/lib/showingTours';

export type ReminderDay = 'today' | 'tomorrow';

export interface ShowingReminder {
  key: string;
  source: 'calendar' | 'tour';
  /** "14:00". */
  startsAt: string;
  /** "2:00 PM". */
  time: string;
  title: string;
  name: string | null;
  address: string | null;
  stops: number;
  /** Emailed at 8 AM: guests on Kevin's own event, or a tour's people. */
  autoEmail: string[];
  /** From the notes or the tour; offered, never sent. */
  phones: string[];
  emails: string[];
  /** Set when the event is somebody else's invitation, so nobody on it is emailed. */
  invitedBy: string | null;
  message: string;
  subject: string;
  /** What the 8 AM run did, or null when it has not touched this one. */
  sent: { at: string | null; to: string[]; error: string | null } | null;
}

export interface ReminderList {
  day: string;
  /** False until the calendar's private address is set. */
  connected: boolean;
  /** Whether this day's 8 AM run is still to come. */
  beforeSend: boolean;
  problems: string[];
  digestSentAt: string | null;
  reminders: ShowingReminder[];
}

export const listReminders = async (day: ReminderDay): Promise<ReminderList> => {
  const { data, error } = await supabase.functions.invoke('showing-reminders', {
    body: { action: 'list', day },
  });
  if (error) throw new Error(await functionMessage(error, 'Could not read the reminders.'));
  return data as ReminderList;
};
