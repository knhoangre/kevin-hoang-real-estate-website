/**
 * The morning-of showing reminders, as /admin/showings shows them.
 *
 * Every rule is in the `showing-reminders` edge function and the pure module
 * behind it (supabase/functions/_shared/showingReminders.ts): which events on
 * Kevin's Google Calendar are showings, who is emailed at 8, what the message
 * says. This only asks for the day and describes the answer. It sends nothing —
 * the page's buttons open Messages, a mail draft or the Zillow chat, and
 * `markReminder` records that they were pressed.
 */
import { supabase } from '@/integrations/supabase/client';
import { functionMessage } from '@/lib/showingTours';

export type ReminderDay = 'today' | 'tomorrow';

/** How Kevin sent one himself. A mirror of SEND_WAYS in the edge function's module. */
export type SendWay = 'zillow' | 'text' | 'email' | 'other';

/** Why a showing says Completed. */
export interface ReminderCompletion {
  how: SendWay | 'emailed';
  to: string[];
  at: string;
  /** Kevin's own press can be taken back; an email that went cannot. */
  undoable: boolean;
}

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
  /** The Zillow conversation in the event's notes. */
  zillow: string | null;
  message: string;
  subject: string;
  /** What the 8 AM run did, or null when it has not touched this one. */
  sent: { at: string | null; to: string[]; error: string | null } | null;
  completed: ReminderCompletion | null;
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

/** Records a send, or with `how` null takes it back. Returns what the showing now says. */
export const markReminder = async (
  day: string,
  key: string,
  how: SendWay | null,
  to: string[] = []
): Promise<ReminderCompletion | null> => {
  const { data, error } = await supabase.functions.invoke('showing-reminders', {
    body: { action: 'mark', day, key, how, to },
  });
  if (error) throw new Error(await functionMessage(error, 'Could not save that.'));
  return (data as { completed: ReminderCompletion | null }).completed;
};
