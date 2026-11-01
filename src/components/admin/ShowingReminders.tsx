/**
 * The morning-of reminders, at the top of /admin/showings.
 *
 * At 8 every morning the `showing-reminders` edge function emails each client
 * who is a guest on one of Kevin's own "Showing" events, and emails Kevin a
 * summary. This is the same day on the page: every showing with its message
 * written out, what went at 8, and a tap to text it from his own phone or send
 * it through Zillow — where most of these clients are, and where nothing but
 * Kevin can post.
 *
 * "Tomorrow" is there to check the night before that an event is being picked
 * up: a title without "showing" in it simply does not appear.
 *
 * Nothing here sends anything. A text opens Messages; an email opens a draft; the
 * Zillow button copies the message and opens the chat in the event's notes.
 * Nothing can see those go, so pressing one IS the record: the showing says
 * Completed, its buttons go away so it cannot be sent twice, and Undo is beside
 * it for a press that did not end in a send. Copying alone does not count, since
 * a message can be copied just to read it, so Mark completed is there for that.
 */
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Loader2, Mail, MessageSquare } from 'lucide-react';
import { AdminCard } from '@/components/AdminShell';
import { useToast } from '@/components/ui/use-toast';
import { TO_CONFIRM_KEY } from '@/hooks/useAdminCounts';
import { pill } from '@/lib/pill';
import { smsHrefTo } from '@/lib/siteConfig';
import {
  listReminders,
  markReminder,
  type ReminderCompletion,
  type ReminderDay,
  type ReminderList,
  type SendWay,
  type ShowingReminder,
} from '@/lib/showingReminders';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; list: ReminderList };

const stamp = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const mailtoHref = (to: string, subject: string, body: string) =>
  `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** What happened, or will happen, to one showing's reminder — in plain words. */
const statusLines = (r: ShowingReminder, beforeSend: boolean): string[] => {
  const lines: string[] = [];
  if (r.sent?.at) lines.push(`Emailed ${r.sent.to.join(', ')} at ${stamp(r.sent.at)}.`);
  else if (r.sent?.error) lines.push(`Couldn't email ${r.autoEmail.join(', ')}. Text or copy the message instead.`);
  else if (r.autoEmail.length && beforeSend) lines.push(`Emails ${r.autoEmail.join(', ')} at 8 AM.`);
  else if (r.autoEmail.length) lines.push('It was not emailed at 8 AM, so send it from here.');
  if (r.invitedBy) lines.push(`From ${r.invitedBy}'s invitation, so nobody on it is emailed.`);
  if (!r.autoEmail.length && !r.phones.length && !r.emails.length && !r.invitedBy && !r.zillow) {
    lines.push('No email, phone or Zillow chat link on it. Put the chat’s link in the event’s notes, or copy the message into Zillow.');
  }
  return lines;
};

/** What "Completed" means for one showing. Kevin's presses say opened, because that is all the page saw. */
const completedLine = ({ how, to, at }: ReminderCompletion): string => {
  const who = to.join(', ');
  if (how === 'emailed') return `Emailed ${who} at ${stamp(at)}.`;
  if (how === 'zillow') return `You opened the Zillow chat at ${stamp(at)}.`;
  if (how === 'text') return `You opened a text to ${who} at ${stamp(at)}.`;
  if (how === 'email') return `You opened an email to ${who} at ${stamp(at)}.`;
  return `You marked it at ${stamp(at)}.`;
};

const TEXT_BUTTON = 'font-medium text-champagne-ink underline underline-offset-2';

const ShowingReminders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [day, setDay] = useState<ReminderDay>('today');
  const [state, setState] = useState<State>({ status: 'loading' });
  const [copied, setCopied] = useState<string | null>(null);
  // Completed showings whose buttons are showing again, to send one more anyway.
  const [reopened, setReopened] = useState<string[]>([]);
  // The last save, and how many there have been: see the refresh below.
  const saving = useRef<Promise<unknown>>(Promise.resolve());
  const saves = useRef(0);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    listReminders(day)
      .then((list) => live && setState({ status: 'ready', list }))
      .catch((err) =>
        live &&
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not read the reminders.' })
      );
    return () => {
      live = false;
    };
  }, [day]);

  // Coming back to the page reads the day again, quietly, because Kevin works on
  // a phone and a computer: a tab left open on one must not offer a send he has
  // already made on the other. It waits for a save still under way, and drops its
  // answer if he pressed something meanwhile, so a press never flickers undone.
  useEffect(() => {
    let live = true;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      const seen = saves.current;
      saving.current
        .catch(() => undefined)
        .then(() => listReminders(day))
        .then((list) => {
          if (live && saves.current === seen) {
            setState((s) => (s.status === 'ready' ? { status: 'ready', list } : s));
          }
        })
        // A failed refresh leaves the page as it was.
        .catch(() => undefined);
    };
    document.addEventListener('visibilitychange', refresh);
    return () => {
      live = false;
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [day]);

  const setCompleted = (key: string, completed: ReminderCompletion | null) =>
    setState((s) =>
      s.status === 'ready'
        ? {
            status: 'ready',
            list: { ...s.list, reminders: s.list.reminders.map((r) => (r.key === key ? { ...r, completed } : r)) },
          }
        : s
    );

  const save = async (r: ShowingReminder, list: ReminderList, how: SendWay | null, to: string[] = []) => {
    saves.current += 1;
    setCompleted(r.key, how ? { how, to, at: new Date().toISOString(), undoable: true } : null);
    setReopened((keys) => keys.filter((key) => key !== r.key));
    try {
      const request = markReminder(list.day, r.key, how, to);
      saving.current = request;
      setCompleted(r.key, await request);
      // Takes it off the number on his picture and the Showings tile right away.
      queryClient.invalidateQueries({ queryKey: TO_CONFIRM_KEY });
    } catch (err) {
      setCompleted(r.key, r.completed);
      toast({
        title: how ? 'That wasn’t saved, so it isn’t marked completed.' : 'That wasn’t undone.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  };

  const copyMessage = async (r: ShowingReminder) => {
    try {
      await navigator.clipboard.writeText(r.message);
      return true;
    } catch {
      // The message is selectable text right there, which always works.
      toast({ title: 'Select the message and copy it.' });
      return false;
    }
  };

  const copy = async (r: ShowingReminder) => {
    if (!(await copyMessage(r))) return;
    setCopied(r.key);
    setTimeout(() => setCopied((key) => (key === r.key ? null : key)), 2000);
  };

  const label = day === 'today' ? 'today' : 'tomorrow';

  return (
    <AdminCard className="mb-8">
      <section aria-labelledby="reminders-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 sm:px-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-champagne-ink" aria-hidden />
            <h2 id="reminders-heading" className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">
              Showing reminders
            </h2>
          </div>
          <span className="inline-flex overflow-hidden rounded-full border border-gray-200 text-sm">
            {(['today', 'tomorrow'] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={day === d}
                onClick={() => setDay(d)}
                className={`px-4 py-1.5 font-semibold capitalize transition-colors ${
                  day === d ? 'bg-ink-deep text-white' : 'text-gray-600 hover:text-champagne-ink'
                }`}
              >
                {d}
              </button>
            ))}
          </span>
        </div>

        <p className="px-4 pt-4 text-sm leading-relaxed text-gray-600 sm:px-6">
          At 8 every morning, each event on your Google Calendar with “Showing” in the title gets a
          reminder. Guests on your own events are emailed. For everyone else, send it from here: with the
          Zillow chat’s link in the event’s notes, one press copies the message and opens that chat. Once
          it’s sent, the showing says Completed on your phone and your computer alike.
        </p>

        {state.status === 'loading' ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-champagne-ink" aria-hidden />
          </div>
        ) : state.status === 'error' ? (
          <p className="p-4 text-sm text-red-700 sm:px-6">{state.message}</p>
        ) : (
          <>
            {!state.list.connected && (
              <p className="mx-4 mt-4 rounded-md border border-gray-200 bg-bone p-3 text-sm text-ink sm:mx-6">
                Your Google Calendar isn’t connected yet, so only showing tours appear here.
              </p>
            )}

            {state.list.reminders.length === 0 ? (
              <p className="p-4 text-sm text-gray-600 sm:px-6">No showings {label}.</p>
            ) : (
              <ul className="mt-2 divide-y divide-gray-100">
                {state.list.reminders.map((r) => {
                  const list = state.list;
                  const emailStopped =
                    r.completed?.how !== 'emailed' && list.beforeSend && !r.sent?.at && r.autoEmail.length > 0;
                  return (
                    <li key={r.key} className="space-y-3 p-4 sm:px-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-ink">
                            <span className="numeral font-semibold">{r.time}</span>
                            <span className="px-1.5 text-gray-400">·</span>
                            <span className="font-medium">{r.name ?? r.title}</span>
                          </p>
                          {r.address && <p className="break-words text-sm text-gray-600">{r.address}</p>}
                          {!r.completed &&
                            statusLines(r, list.beforeSend).map((line) => (
                              <p key={line} className="numeral break-words text-xs text-gray-500">
                                {line}
                              </p>
                            ))}
                        </div>
                        {r.completed && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                            <Check className="h-3.5 w-3.5" aria-hidden />
                            Completed
                          </span>
                        )}
                      </div>

                      {r.completed && (
                        <p className="numeral break-words text-xs text-gray-600">
                          {completedLine(r.completed)}
                          {emailStopped && ` The 8 AM email to ${r.autoEmail.join(', ')} won’t go.`}{' '}
                          {r.completed.undoable ? (
                            <button type="button" onClick={() => save(r, list, null)} className={TEXT_BUTTON}>
                              Undo
                            </button>
                          ) : (
                            !reopened.includes(r.key) && (
                              <button
                                type="button"
                                onClick={() => setReopened((keys) => [...keys, r.key])}
                                className={TEXT_BUTTON}
                              >
                                Send another way
                              </button>
                            )
                          )}
                        </p>
                      )}

                      {(!r.completed || reopened.includes(r.key)) && (
                        <>
                          <p className="select-all break-words rounded-md border border-gray-200 bg-bone p-3 text-sm leading-relaxed text-ink">
                            {r.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            {r.zillow && (
                              <a
                                href={r.zillow}
                                target="_blank"
                                rel="noopener noreferrer"
                                // The link opens the chat. The copy starts inside the press,
                                // the only moment a browser allows it, and only a message
                                // that really was copied counts as sent.
                                onClick={async () => {
                                  if (await copyMessage(r)) save(r, list, 'zillow');
                                }}
                                className={pill('ink')}
                              >
                                <ExternalLink className="h-4 w-4" aria-hidden />
                                Copy message &amp; open Zillow
                              </a>
                            )}
                            {r.phones.map((phone) => (
                              <a
                                key={phone}
                                href={smsHrefTo(phone, r.message)}
                                onClick={() => save(r, list, 'text', [phone])}
                                className={pill('outline', 'sm', 'numeral')}
                              >
                                <MessageSquare className="h-4 w-4" aria-hidden />
                                Text {phone}
                              </a>
                            ))}
                            {/* A guest the 8 AM run did not reach, and any address in the
                                notes, get a draft to send by hand — never an automatic one. */}
                            {[...(r.sent?.at ? [] : r.autoEmail), ...r.emails].map((email) => (
                              <a
                                key={email}
                                href={mailtoHref(email, r.subject, r.message)}
                                onClick={() => save(r, list, 'email', [email])}
                                className={pill('outline', 'sm', 'max-w-full break-all')}
                              >
                                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                                Email {email}
                              </a>
                            ))}
                            <button type="button" onClick={() => copy(r)} className={pill('outline')}>
                              {copied === r.key ? (
                                <Check className="h-4 w-4" aria-hidden />
                              ) : (
                                <Copy className="h-4 w-4" aria-hidden />
                              )}
                              {copied === r.key ? 'Copied' : 'Copy message'}
                            </button>
                            {!r.completed && (
                              <button type="button" onClick={() => save(r, list, 'other')} className={pill('outline')}>
                                <Check className="h-4 w-4" aria-hidden />
                                Mark completed
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {state.list.problems.length > 0 && (
              <div className="border-t border-gray-100 p-4 sm:px-6">
                <p className="text-sm font-semibold text-ink">Needs a look</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {state.list.problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </div>
            )}

            {state.list.digestSentAt && (
              <p className="numeral border-t border-gray-100 p-4 text-xs text-gray-500 sm:px-6">
                Morning summary emailed to you at {stamp(state.list.digestSentAt)}.
              </p>
            )}
          </>
        )}
      </section>
    </AdminCard>
  );
};

export default ShowingReminders;
