/**
 * The morning-of reminder for a showing: today's showings, found on Kevin's
 * Google Calendar and among his showing tours, and the friendly message each
 * one gets.
 *
 * PURE — no network, no Deno, no npm — so `node scripts/showing-reminders-check.ts`
 * runs it against calendars whose right answer is known. The edge function
 * `showing-reminders` does the fetching and the sending and decides nothing.
 *
 * WHAT IS A SHOWING. An event with "showing" in its title, the way Kevin already
 * names them ("Showing - Sarah Lee"). The client's name is read from the rest of
 * the title, the address from the event's Location (or a part of the title that
 * starts with a number).
 *
 * WHO IS EMAILED, AND WHO IS NOT. Only the GUESTS on an event Kevin made
 * himself. An address typed in the notes is offered to him as a tap, never
 * mailed: notes are where a listing agent's email or a lockbox code ends up, and
 * "a friendly reminder about our showing" sent to the listing agent is the
 * failure this rule prevents. An event somebody else invited him to (a
 * ShowingTime confirmation, a colleague's) is not his, so its guests are not
 * his clients and nobody on it is mailed.
 *
 * MOST CLIENTS ARE ON ZILLOW CHAT, with no phone or email anywhere. Zillow has
 * no way for software to post into that chat, so for them the reminder is the
 * message itself, in Kevin's morning email and on /admin/showings, to paste.
 */
import { SITE_ORIGIN, escapeHtml } from './listingEmail.ts';

/*
 * Who the reminder is from. A deliberate mirror of SITE in src/lib/siteConfig.ts
 * and of AGENT in showing-schedule — name and phone character for character
 * (NAP), and the brokerage because 254 CMR 3.00 wants it on what goes out under
 * a broker's name.
 */
export const AGENT = {
  name: 'Kevin Hoang',
  brokerage: 'LPT Realty',
  phone: '(860) 682-2251',
  email: 'knhoangre@gmail.com',
} as const;

/** Kevin's own addresses, which are never a client to remind. */
const OWN_ADDRESSES = [AGENT.email, 'contact@kevinhoang.co'];

/** The reminder goes out at 8 in the morning, Boston time. */
export const SEND_HOUR = 8;

const BOSTON = 'America/New_York';

/* -------------------------------------------------------------------------- */
/* The calendar file (RFC 5545), read by hand                                  */
/* -------------------------------------------------------------------------- */

export interface Attendee {
  email: string;
  /** INDIVIDUAL, ROOM, RESOURCE, GROUP — '' when the file does not say. */
  cutype: string;
  /** ACCEPTED, DECLINED, NEEDS-ACTION … */
  partstat: string;
}

export interface CalEvent {
  uid: string;
  summary: string;
  location: string;
  /** Plain text: Google stores rich-text notes as HTML, and the tags are gone. */
  description: string;
  status: string;
  /** DTSTART's raw value and the parameters that say how to read it. */
  start: { value: string; tzid: string | null; dateOnly: boolean } | null;
  /** RRULE, RDATE or RECURRENCE-ID: one of a series, which a showing never is. */
  recurring: boolean;
  organizer: string | null;
  attendees: Attendee[];
}

/** A long line continues on the next one after a single space or tab. */
const unfold = (text: string) =>
  text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '');

/** Splits on `sep` wherever it is not inside double quotes. */
const splitOutsideQuotes = (text: string, sep: string): string[] => {
  const out: string[] = [];
  let quoted = false;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '"') quoted = !quoted;
    else if (text[i] === sep && !quoted) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out;
};

interface Prop {
  name: string;
  params: Record<string, string>;
  value: string;
}

/**
 * `NAME;PARAM=x;PARAM="a:b":value`. The value starts at the first colon that
 * is not inside quotes — a guest's CN is often "Lee, Sarah" and can hold one.
 */
const parseLine = (line: string): Prop | null => {
  let quoted = false;
  let colon = -1;
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '"') quoted = !quoted;
    else if (line[i] === ':' && !quoted) {
      colon = i;
      break;
    }
  }
  if (colon < 0) return null;
  const [name, ...rawParams] = splitOutsideQuotes(line.slice(0, colon), ';');
  const params: Record<string, string> = {};
  for (const raw of rawParams) {
    const eq = raw.indexOf('=');
    if (eq < 0) continue;
    params[raw.slice(0, eq).toUpperCase()] = raw.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) };
};

/** TEXT values escape `\` `;` `,` and newlines (RFC 5545 §3.3.11). */
const unescapeText = (value: string) =>
  value.replace(/\\([\\;,nN])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c));

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Google keeps an event's notes as HTML; a phone number inside a link is still a number. */
const htmlToText = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|[a-z]+);/gi, (whole, code: string) =>
      code.startsWith('#') ? String.fromCharCode(Number(code.slice(1))) : ENTITIES[code.toLowerCase()] ?? whole
    );

const mailto = (value: string): string | null => {
  const match = /^mailto:(.+)$/i.exec(value.trim());
  return match ? match[1].trim().toLowerCase() : null;
};

/** Every VEVENT in a calendar file. Alarms and other components inside one are skipped. */
export const parseIcs = (text: string): CalEvent[] => {
  const events: CalEvent[] = [];
  let current: CalEvent | null = null;
  let nested = 0;

  for (const line of unfold(text).split('\n')) {
    const prop = parseLine(line);
    if (!prop) continue;

    if (prop.name === 'BEGIN') {
      if (prop.value.toUpperCase() === 'VEVENT' && !current) {
        current = {
          uid: '',
          summary: '',
          location: '',
          description: '',
          status: '',
          start: null,
          recurring: false,
          organizer: null,
          attendees: [],
        };
        nested = 0;
      } else if (current) {
        nested += 1;
      }
      continue;
    }
    if (prop.name === 'END') {
      if (current && nested > 0) nested -= 1;
      else if (current && prop.value.toUpperCase() === 'VEVENT') {
        events.push(current);
        current = null;
      }
      continue;
    }
    if (!current || nested > 0) continue;

    switch (prop.name) {
      case 'UID':
        current.uid = prop.value.trim();
        break;
      case 'SUMMARY':
        current.summary = unescapeText(prop.value).trim();
        break;
      case 'LOCATION':
        current.location = unescapeText(prop.value).trim();
        break;
      case 'DESCRIPTION':
        current.description = htmlToText(unescapeText(prop.value)).trim();
        break;
      case 'STATUS':
        current.status = prop.value.trim().toUpperCase();
        break;
      case 'DTSTART':
        current.start = {
          value: prop.value.trim(),
          tzid: prop.params.TZID ? prop.params.TZID.replace(/^\//, '') : null,
          dateOnly: prop.params.VALUE?.toUpperCase() === 'DATE' || /^\d{8}$/.test(prop.value.trim()),
        };
        break;
      case 'RRULE':
      case 'RDATE':
      case 'RECURRENCE-ID':
        current.recurring = true;
        break;
      case 'ORGANIZER':
        current.organizer = mailto(prop.value);
        break;
      case 'ATTENDEE': {
        const email = mailto(prop.value);
        if (email) {
          current.attendees.push({
            email,
            cutype: (prop.params.CUTYPE ?? '').toUpperCase(),
            partstat: (prop.params.PARTSTAT ?? '').toUpperCase(),
          });
        }
        break;
      }
    }
  }
  return events;
};

/* -------------------------------------------------------------------------- */
/* Time — every showing is read as a Boston wall clock                         */
/* -------------------------------------------------------------------------- */

/** "YYYY-MM-DD" and, for a timed event, "HH:MM", both as a clock in Boston reads them. */
export interface WallClock {
  day: string;
  time: string | null;
}

/** Outlook writes Windows zone names into the invites it sends. */
const WINDOWS_ZONES: Record<string, string> = {
  'Eastern Standard Time': BOSTON,
  'US Eastern Standard Time': BOSTON,
  'Central Standard Time': 'America/Chicago',
  'Mountain Standard Time': 'America/Denver',
  'Pacific Standard Time': 'America/Los_Angeles',
};

interface Fields {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

/** What a clock in `zone` reads at `instant`. Throws RangeError for a zone Intl does not know. */
const fieldsIn = (instant: number, zone: string): Fields => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
};

const asUtc = (f: Fields) => Date.UTC(f.y, f.mo - 1, f.d, f.h, f.mi, f.s);

/** The instant at which a clock in `zone` reads `wall`. Two corrections settle it, DST included. */
const instantIn = (wall: Fields, zone: string): number => {
  const target = asUtc(wall);
  let t = target;
  for (let i = 0; i < 2; i += 1) t += target - asUtc(fieldsIn(t, zone));
  return t;
};

const pad = (n: number) => String(n).padStart(2, '0');
const dayOf = (f: Fields) => `${f.y}-${pad(f.mo)}-${pad(f.d)}`;
const timeOf = (f: Fields) => `${pad(f.h)}:${pad(f.mi)}`;

/**
 * When an event starts, on a Boston clock. Null when it cannot be read.
 *
 * Google writes a one-off event's start in UTC ("20261028T180000Z") — 2 PM in
 * Boston that day, and a 9 PM showing is the NEXT day in UTC, which is why the
 * day is read on Boston's clock and never off the string. A TZID other than
 * Boston's is converted; a floating time (no zone at all) is taken as Boston's,
 * which is where Kevin's calendar is.
 */
export const bostonClock = (start: CalEvent['start']): WallClock | null => {
  if (!start) return null;
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(start.value);
  if (!m) return null;
  const wall: Fields = {
    y: Number(m[1]),
    mo: Number(m[2]),
    d: Number(m[3]),
    h: Number(m[4] ?? 0),
    mi: Number(m[5] ?? 0),
    s: Number(m[6] ?? 0),
  };
  if (start.dateOnly || m[4] === undefined) return { day: dayOf(wall), time: null };

  try {
    const zone = start.tzid ? WINDOWS_ZONES[start.tzid] ?? start.tzid : BOSTON;
    if (!m[7] && zone === BOSTON) return { day: dayOf(wall), time: timeOf(wall) };
    const f = fieldsIn(m[7] ? asUtc(wall) : instantIn(wall, zone), BOSTON);
    return { day: dayOf(f), time: timeOf(f) };
  } catch {
    return null;
  }
};

/** Boston's clock at an instant. */
export const clockAt = (instant: number): WallClock & { hour: number } => {
  const f = fieldsIn(instant, BOSTON);
  return { day: dayOf(f), time: timeOf(f), hour: f.h };
};

/** "2026-10-29" from "2026-10-28" and 1, without passing through anybody's timezone. */
export const addDays = (day: string, n: number): string => {
  const [y, m, d] = day.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
};

/** "2:00 PM" from "14:00". A mirror of formatStopTime in src/lib/showingTours.ts. */
export const clock12 = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
};

/** "Wednesday, October 28" from "2026-10-28", formatted in UTC so it is never the 27th. */
export const longDate = (day: string): string => {
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
};

/* -------------------------------------------------------------------------- */
/* Reading a showing                                                           */
/* -------------------------------------------------------------------------- */

export const isShowingTitle = (summary: string) => /\bshowings?\b/i.test(summary);

/** Words in a title that are about the appointment, not the person. */
const NOT_A_NAME = /\b(?:showings?|zillow|tours?|appt|appointment|private)\b/gi;

/** A title cut into its parts: "Showing - Sarah Lee - 12 Elm St" → ["Sarah Lee", "12 Elm St"]. */
const titleParts = (summary: string): string[] =>
  summary
    .replace(NOT_A_NAME, ' ')
    // A hyphen separates only with space around it, so "Mary-Jane" stays one name.
    .split(/\s+-\s+|^\s*-\s*|\s*-\s*$|[–—:|·()]/)
    .map((part) =>
      part
        .replace(/^\s*(?:with|w\/|for)\s+/i, '')
        .replace(/^[\s,.\-/]+|[\s,.\-/]+$/g, '')
        .replace(/\s+/g, ' ')
    )
    .filter(Boolean);

/** The client's name from an event title, or null when the title names only the house. */
export const clientName = (summary: string): string | null => {
  const name = titleParts(summary).find((part) => !/^\d/.test(part) && /\p{L}/u.test(part));
  return name ? name.slice(0, 80) : null;
};

/** An address in the title itself ("Showing: 12 Elm St"), for an event with no Location. */
const titleAddress = (summary: string): string | null =>
  titleParts(summary).find((part) => /^\d+\s+\p{L}/u.test(part)) ?? null;

/** "Sarah", "Sarah and Tom", "Sarah, Tom and Ana" — first names, as spoken. */
export const greetingFor = (names: string[]): string | null => {
  const firsts = names
    .flatMap((name) => name.split(/\s*(?:&|\+|,|\band\b)\s*/i))
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
  if (firsts.length === 0) return null;
  if (firsts.length === 1) return firsts[0];
  return `${firsts.slice(0, -1).join(', ')} and ${firsts[firsts.length - 1]}`;
};

/**
 * "12 Elm St, Newton" from Google's "12 Elm St, Newton, MA 02459, USA". The
 * state and ZIP add nothing to a text sent to somebody going to that house
 * today; a place that is not an address is left as it is.
 */
export const shortAddress = (location: string): string | null => {
  const firstLine = location.split('\n')[0].trim();
  if (!firstLine) return null;
  const parts = firstLine.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1 && /^(usa|us|united states)$/i.test(parts[parts.length - 1])) parts.pop();
  if (parts.length > 1 && /^[A-Z]{2}(\s+\d{5}(-\d{4})?)?$/.test(parts[parts.length - 1])) parts.pop();
  return parts.join(', ').slice(0, 120);
};

/**
 * Ten-digit numbers in the notes, as 617-555-0142. A leading 1 is the country
 * code, the same rule as phoneDigits() in src/lib/phone.ts; an "area code"
 * starting with 0 or 1 is not one, which keeps order numbers out.
 */
export const notePhones = (text: string): string[] => {
  const found = new Set<string>();
  const re = /(?<!\d)(?:\+?1[\s.-]?)?\(?([2-9]\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})(?!\d)/g;
  for (const m of text.matchAll(re)) found.add(`${m[1]}-${m[2]}-${m[3]}`);
  return [...found];
};

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

export const noteEmails = (text: string, own: Set<string>): string[] => {
  const found = new Set<string>();
  for (const m of text.matchAll(/[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}/gi)) {
    const email = m[0].toLowerCase().replace(/[.]+$/, '');
    if (EMAIL.test(email) && !own.has(email)) found.add(email);
  }
  return [...found];
};

/**
 * Kevin's own addresses, plus the calendar's: a Google calendar's private iCal
 * address carries its owner's id ("/calendar/ical/<id>/private-…/basic.ics"),
 * which is the address Google stamps as the organizer of everything on it.
 */
export const ownAddresses = (calendarUrl: string | null): Set<string> => {
  const own = new Set(OWN_ADDRESSES);
  const id = calendarUrl ? /\/calendar\/ical\/([^/]+)\//.exec(calendarUrl)?.[1] : null;
  if (id) {
    try {
      const decoded = decodeURIComponent(id).toLowerCase();
      if (decoded.includes('@')) own.add(decoded);
    } catch {
      // A malformed id is simply not added.
    }
  }
  return own;
};

/* -------------------------------------------------------------------------- */
/* A reminder                                                                  */
/* -------------------------------------------------------------------------- */

export interface Reminder {
  /** 'cal:<uid>' or 'tour:<id>' — what a send is recorded against. */
  key: string;
  source: 'calendar' | 'tour';
  day: string;
  /** "14:00", for sorting. */
  startsAt: string;
  /** "2:00 PM". */
  time: string;
  /** The event's own title, or "Showing tour". */
  title: string;
  /** "Sarah Lee", or null when the title names no one. */
  name: string | null;
  greeting: string | null;
  /** Short form for the message; `fullAddress` is what a Maps link is built from. */
  address: string | null;
  fullAddress: string | null;
  /** Homes on the day; a calendar event is one. */
  stops: number;
  /** Who is emailed at 8 — the guests on Kevin's own event, or a tour's people. */
  autoEmail: string[];
  /** Offered to Kevin to tap; never sent by anything here. */
  phones: string[];
  emails: string[];
  /** The organizer, when the event is somebody else's invitation. */
  invitedBy: string | null;
  /** The text, ready to send from Kevin's phone or paste into Zillow. */
  message: string;
}

/** It asks rather than tells (Kevin, 2026-10-30): the reminder is also how a no-show is found out. */
const CONFIRM = 'Will you be able to make it?';

/** The friendly message itself. Leaves out what it does not know rather than printing a blank. */
export const reminderText = (r: Pick<Reminder, 'greeting' | 'time' | 'address' | 'stops'>): string => {
  const hi = r.greeting ? `Hi ${r.greeting}` : 'Hi';
  const where = r.address ? ` at ${r.address}` : '';
  if (r.stops > 1) {
    return `${hi}, just a friendly reminder about our showings today. We start at ${r.time}${where}. ${CONFIRM}`;
  }
  return `${hi}, just a friendly reminder about our showing today at ${r.time}${where}. ${CONFIRM}`;
};

const finish = (r: Omit<Reminder, 'message'>): Reminder => ({ ...r, message: reminderText(r) });

/** What became of an event that looked like a showing and got no reminder. */
export type Problem = string;

/** Today's showings on the calendar, and what stopped any of them becoming a reminder. */
export const calendarReminders = (
  events: CalEvent[],
  day: string,
  own: Set<string>
): { reminders: Reminder[]; problems: Problem[] } => {
  const reminders: Reminder[] = [];
  const problems: Problem[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    if (!isShowingTitle(event.summary) || event.status === 'CANCELLED' || event.recurring) continue;
    // A stop on a showing tour, from the calendar file the schedule email
    // carries. The tour itself is read from the database, people and all.
    if (event.uid.toLowerCase().endsWith('@kevinhoang.co')) continue;

    const when = bostonClock(event.start);
    if (!when) {
      if (event.start?.value.startsWith(day.replace(/-/g, ''))) {
        problems.push(`Couldn't read the time of "${event.summary}", so it has no reminder.`);
      }
      continue;
    }
    if (when.day !== day) continue;
    if (!when.time) {
      problems.push(`"${event.summary}" is an all-day event, so there is no time to remind about.`);
      continue;
    }

    const key = `cal:${event.uid || `${event.summary}@${when.time}`}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const mine = !event.organizer || own.has(event.organizer);
    const guests = mine
      ? [
          ...new Set(
            event.attendees
              .filter(
                (a) =>
                  (a.cutype === '' || a.cutype === 'INDIVIDUAL') &&
                  a.partstat !== 'DECLINED' &&
                  !own.has(a.email) &&
                  a.email !== event.organizer &&
                  !/\.calendar\.google\.com$/.test(a.email) &&
                  EMAIL.test(a.email)
              )
              .map((a) => a.email)
          ),
        ]
      : [];

    const name = clientName(event.summary);
    const fullAddress = event.location.split('\n')[0].trim() || titleAddress(event.summary);
    reminders.push(
      finish({
        key,
        source: 'calendar',
        day,
        startsAt: when.time,
        time: clock12(when.time),
        title: event.summary,
        name,
        greeting: name ? greetingFor([name]) : null,
        address: fullAddress ? shortAddress(fullAddress) : null,
        fullAddress: fullAddress || null,
        stops: 1,
        autoEmail: guests,
        phones: notePhones(event.description),
        emails: noteEmails(event.description, own).filter((e) => !guests.includes(e)),
        invitedBy: mine ? null : event.organizer,
      })
    );
  }

  return { reminders: reminders.sort(byTime), problems };
};

export const byTime = (a: Reminder, b: Reminder) => a.startsAt.localeCompare(b.startsAt);

/** A showing tour, as the edge function reads it: the row and its stops. */
export interface TourRow {
  id: string;
  tour_date: string;
  clients: unknown;
  showing_tour_stops: { starts_at: string; address: string; town: string | null; state: string | null }[] | null;
}

/**
 * One reminder per showing tour on the day: the first stop's time and address,
 * everyone on it greeted. The people are the ones Kevin typed in as the clients,
 * so those with an email are mailed — the same intent as a guest on an event.
 */
export const tourReminders = (tours: TourRow[], day: string): Reminder[] =>
  tours.flatMap((tour) => {
    const stops = [...(tour.showing_tour_stops ?? [])].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    if (tour.tour_date !== day || stops.length === 0) return [];
    const people = (Array.isArray(tour.clients) ? tour.clients : []).flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const { name, email, phone } = entry as Record<string, unknown>;
      if (typeof name !== 'string' || !name.trim()) return [];
      return [
        {
          name: name.trim(),
          email: typeof email === 'string' && EMAIL.test(email.trim()) ? email.trim().toLowerCase() : null,
          phone: typeof phone === 'string' ? notePhones(phone)[0] ?? null : null,
        },
      ];
    });
    const first = stops[0];
    const startsAt = first.starts_at.slice(0, 5);
    const fullAddress = [first.address, first.town, first.state].filter(Boolean).join(', ');
    const names = people.map((p) => p.name);
    return [
      finish({
        key: `tour:${tour.id}`,
        source: 'tour',
        day,
        startsAt,
        time: clock12(startsAt),
        title: 'Showing tour',
        name: names.length ? names.join(' and ') : null,
        greeting: greetingFor(names),
        address: [first.address, first.town].filter(Boolean).join(', ') || null,
        fullAddress: fullAddress || null,
        stops: stops.length,
        autoEmail: [...new Set(people.flatMap((p) => (p.email ? [p.email] : [])))],
        phones: [...new Set(people.flatMap((p) => (p.phone ? [p.phone] : [])))],
        emails: [],
        invitedBy: null,
      }),
    ];
  });

/* -------------------------------------------------------------------------- */
/* Links                                                                       */
/* -------------------------------------------------------------------------- */

export const mapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** A mirror of smsHrefTo in src/lib/siteConfig.ts: `?&body=` works on iOS and Android both. */
export const smsHref = (phone: string, body: string) =>
  `sms:+1${phone.replace(/\D/g, '')}?&body=${encodeURIComponent(body)}`;

export const mailtoHref = (to: string, subject: string, body: string) =>
  `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const ADMIN_URL = `${SITE_ORIGIN}/admin/showings`;

/* -------------------------------------------------------------------------- */
/* The client's email                                                          */
/* -------------------------------------------------------------------------- */

const P = "font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;";

export const clientSubject = (r: Pick<Reminder, 'stops' | 'time'>) =>
  r.stops > 1 ? `Reminder: our showings today, starting at ${r.time}` : `Reminder: our showing today at ${r.time}`;

const frame = (title: string, eyebrow: string, inner: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border:1px solid #2d2d2d;background-color:#ffffff;">
        <tr><td style="padding:36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:0 0 18px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#8c6b35;">
              ${escapeHtml(eyebrow)}
            </td></tr>
            ${inner}
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const signatureHtml = `<tr><td style="padding:22px 0 0 0;${P}">
  <strong style="font-weight:600;">${escapeHtml(AGENT.name)}</strong><br />
  ${escapeHtml(AGENT.brokerage)}<br />
  <a href="tel:+18606822251" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(AGENT.phone)}</a>
</td></tr>`;

/** The reminder a guest gets at 8. Its reply-to is Kevin. */
export const clientEmail = (r: Reminder): { subject: string; text: string; html: string } => {
  const subject = clientSubject(r);
  const hi = r.greeting ? `Hi ${r.greeting},` : 'Hi,';
  const where = r.address ? ` at ${r.address}` : '';
  const line =
    r.stops > 1
      ? `Just a friendly reminder about our showings today. We start at ${r.time}${where}. ${CONFIRM}`
      : `Just a friendly reminder about our showing today at ${r.time}${where}. ${CONFIRM}`;
  const directions = r.fullAddress ? mapsUrl(r.fullAddress) : null;
  const change = `You can reply to this email or text me at ${AGENT.phone}.`;

  const text = [
    hi,
    '',
    line,
    ...(directions ? ['', `Directions: ${directions}`] : []),
    '',
    change,
    '',
    AGENT.name,
    AGENT.brokerage,
    AGENT.phone,
  ].join('\n');

  const html = frame(
    subject,
    'Showing reminder',
    `<tr><td style="padding:0 0 18px 0;${P}">${escapeHtml(hi)}</td></tr>
            <tr><td style="padding:0 0 18px 0;${P}">${escapeHtml(line)}</td></tr>
            ${
              directions
                ? `<tr><td style="padding:0 0 18px 0;${P}"><a href="${escapeHtml(directions)}" style="color:#1a1a1a;text-decoration:underline;">Directions in Google Maps</a></td></tr>`
                : ''
            }
            <tr><td style="padding:0;${P}">${escapeHtml(change)}</td></tr>
            ${signatureHtml}`
  );

  return { subject, text, html };
};

/* -------------------------------------------------------------------------- */
/* Kevin's morning email                                                       */
/* -------------------------------------------------------------------------- */

/** What happened to a reminder's email at 8. */
export interface Outcome {
  sentTo: string[];
  error: string | null;
}

/** The lines under one showing in the morning email, in the order they matter. */
export const statusLines = (r: Reminder, outcome: Outcome | undefined): string[] => {
  const lines: string[] = [];
  if (outcome?.sentTo.length) lines.push(`Emailed ${outcome.sentTo.join(', ')}.`);
  else if (outcome?.error) lines.push(`Couldn't email ${r.autoEmail.join(', ')}. Text or copy the message instead.`);
  if (r.invitedBy) lines.push(`This came from ${r.invitedBy}'s invitation, so nobody on it was emailed.`);
  for (const phone of r.phones) lines.push(`Text ${phone}${r.source === 'calendar' ? ' (from the notes)' : ''}.`);
  for (const email of r.emails) lines.push(`Email ${email} (from the notes) — not sent automatically.`);
  if (!outcome?.sentTo.length && r.phones.length === 0 && r.emails.length === 0) {
    lines.push('No email or phone on it. If this is a Zillow chat, paste the message there.');
  }
  return lines;
};

export const digestSubject = (count: number, problems: number) =>
  count > 0
    ? `Today's showings: ${count} reminder${count === 1 ? '' : 's'}`
    : problems > 0
      ? 'Showing reminders: something needs a look'
      : "Today's showings";

export const digestEmail = (
  day: string,
  reminders: Reminder[],
  outcomes: Map<string, Outcome>,
  problems: Problem[]
): { subject: string; text: string; html: string } => {
  const subject = digestSubject(reminders.length, problems.length);
  const dateLabel = longDate(day);

  const text = [
    `${dateLabel}`,
    '',
    ...reminders.flatMap((r) => [
      `${r.time} — ${r.name ?? r.title}${r.address ? `, ${r.address}` : ''}`,
      ...statusLines(r, outcomes.get(r.key)).map((l) => `  ${l}`),
      `  Message: ${r.message}`,
      '',
    ]),
    ...(problems.length ? ['Needs a look:', ...problems.map((p) => `  ${p}`), ''] : []),
    `Copy or text each one: ${ADMIN_URL}`,
  ].join('\n');

  const rows = reminders
    .map((r) => {
      const outcome = outcomes.get(r.key);
      const links = [
        ...r.phones.map(
          (phone) =>
            `<a href="${escapeHtml(smsHref(phone, r.message))}" style="color:#8c6b35;font-weight:600;text-decoration:none;">Text ${escapeHtml(phone)}</a>`
        ),
        ...r.emails.map(
          (email) =>
            `<a href="${escapeHtml(mailtoHref(email, clientSubject(r), r.message))}" style="color:#8c6b35;font-weight:600;text-decoration:none;">Email ${escapeHtml(email)}</a>`
        ),
      ];
      return `<tr><td style="padding:20px 0 6px 0;border-top:1px solid #eeeeee;">
              <span style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:20px;color:#1a1a1a;">${escapeHtml(r.time)}</span>
              <span style="${P}font-weight:600;padding-left:8px;">${escapeHtml(r.name ?? r.title)}</span>
              ${r.address ? `<br /><span style="${P}font-size:14px;color:#444444;">${escapeHtml(r.address)}</span>` : ''}
            </td></tr>
            <tr><td style="padding:0 0 8px 0;${P}font-size:14px;">${statusLines(r, outcome).map(escapeHtml).join('<br />')}</td></tr>
            <tr><td style="padding:12px 14px;background-color:#faf8f5;border:1px solid #e5e5e5;${P}font-size:14px;">${escapeHtml(r.message)}</td></tr>
            ${links.length ? `<tr><td style="padding:10px 0 4px 0;${P}font-size:14px;">${links.join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</td></tr>` : ''}`;
    })
    .join('');

  const problemRows = problems.length
    ? `<tr><td style="padding:20px 0 6px 0;border-top:1px solid #eeeeee;${P}font-weight:600;">Needs a look</td></tr>
            <tr><td style="padding:0 0 8px 0;${P}font-size:14px;">${problems.map(escapeHtml).join('<br />')}</td></tr>`
    : '';

  const html = frame(
    subject,
    `Showing reminders · ${dateLabel}`,
    `${rows}${problemRows}
            <tr><td style="padding:26px 0 0 0;">
              <a href="${escapeHtml(ADMIN_URL)}" style="display:inline-block;background-color:#0d0d0f;color:#ffffff;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:999px;">Copy or text each one</a>
            </td></tr>`
  );

  return { subject, text, html };
};
