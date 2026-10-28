/**
 * The morning-of reminders, at the top of /admin/showings.
 *
 * At 8 every morning the `showing-reminders` edge function emails each client
 * who is a guest on one of Kevin's own "Showing" events, and emails Kevin a
 * summary. This is the same day on the page: every showing with its message
 * written out, what went at 8, and a tap to text it from his own phone or copy
 * it into Zillow — where most of these clients are, and where nothing but
 * Kevin can post.
 *
 * "Tomorrow" is there to check the night before that an event is being picked
 * up: a title without "showing" in it simply does not appear.
 *
 * Nothing here sends anything. A text opens Messages; an email opens a draft.
 */
import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Mail, MessageSquare } from 'lucide-react';
import { AdminCard } from '@/components/AdminShell';
import { useToast } from '@/components/ui/use-toast';
import { smsHrefTo } from '@/lib/siteConfig';
import { listReminders, type ReminderDay, type ReminderList, type ShowingReminder } from '@/lib/showingReminders';

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
  else if (r.autoEmail.length) lines.push('Added after the 8 AM run, so it was not emailed.');
  if (r.invitedBy) lines.push(`From ${r.invitedBy}'s invitation, so nobody on it is emailed.`);
  if (!r.autoEmail.length && !r.phones.length && !r.emails.length && !r.invitedBy) {
    lines.push('No email or phone on it. If this is a Zillow chat, copy the message into Zillow.');
  }
  return lines;
};

const LINK = 'inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline';

const ShowingReminders = () => {
  const { toast } = useToast();
  const [day, setDay] = useState<ReminderDay>('today');
  const [state, setState] = useState<State>({ status: 'loading' });
  const [copied, setCopied] = useState<string | null>(null);

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

  const copy = async (r: ShowingReminder) => {
    try {
      await navigator.clipboard.writeText(r.message);
      setCopied(r.key);
      setTimeout(() => setCopied((key) => (key === r.key ? null : key)), 2000);
    } catch {
      // The message is selectable text right there, which always works.
      toast({ title: 'Select the message and copy it.' });
    }
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
          reminder. Guests on your own events are emailed; for everyone else the message is here to text
          or paste into Zillow.
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
                {state.list.reminders.map((r) => (
                  <li key={r.key} className="space-y-3 p-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="text-ink">
                        <span className="numeral font-semibold">{r.time}</span>
                        <span className="px-1.5 text-gray-400">·</span>
                        <span className="font-medium">{r.name ?? r.title}</span>
                      </p>
                      {r.address && <p className="break-words text-sm text-gray-600">{r.address}</p>}
                      {statusLines(r, state.list.beforeSend).map((line) => (
                        <p key={line} className="numeral break-words text-xs text-gray-500">
                          {line}
                        </p>
                      ))}
                    </div>

                    <p className="select-all break-words rounded-md border border-gray-200 bg-bone p-3 text-sm leading-relaxed text-ink">
                      {r.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <button type="button" onClick={() => copy(r)} className={LINK}>
                        {copied === r.key ? (
                          <Check className="h-4 w-4" aria-hidden />
                        ) : (
                          <Copy className="h-4 w-4" aria-hidden />
                        )}
                        {copied === r.key ? 'Copied' : 'Copy message'}
                      </button>
                      {r.phones.map((phone) => (
                        <a key={phone} href={smsHrefTo(phone, r.message)} className={`numeral ${LINK}`}>
                          <MessageSquare className="h-4 w-4" aria-hidden />
                          Text {phone}
                        </a>
                      ))}
                      {/* A guest the 8 AM run did not reach, and any address in the
                          notes, get a draft to send by hand — never an automatic one. */}
                      {[...(r.sent?.at ? [] : r.autoEmail), ...r.emails].map((email) => (
                        <a key={email} href={mailtoHref(email, r.subject, r.message)} className={`break-all ${LINK}`}>
                          <Mail className="h-4 w-4 shrink-0" aria-hidden />
                          Email {email}
                        </a>
                      ))}
                    </div>
                  </li>
                ))}
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
