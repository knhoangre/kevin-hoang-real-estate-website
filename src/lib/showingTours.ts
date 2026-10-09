/**
 * Showing tours — a day's itinerary of homes for one client.
 *
 * Everything /admin/showings reads or writes goes through here, the way
 * rentalApplication.ts owns the applications. The tables are admin-only under
 * RLS, so none of this works for anyone else and none of it needs to check.
 *
 * Dates and times are WALL-CLOCK values in Massachusetts: `tourDate` is
 * "2026-10-10" and a stop's `startsAt` is "10:00". They are never turned into a
 * Date here — `new Date('2026-10-10')` is midnight UTC, which is the evening of
 * the 9th on this side of the Atlantic, and that is how a schedule ends up
 * naming the wrong Saturday.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

type TourRow = Database['public']['Tables']['showing_tours']['Row'];
type StopRow = Database['public']['Tables']['showing_tour_stops']['Row'];

export type StopKind = 'showing' | 'open_house';

export const STOP_KINDS: { value: StopKind; label: string }[] = [
  { value: 'showing', label: 'Showing' },
  { value: 'open_house', label: 'Open house' },
];

export interface TourStop {
  id: string;
  /** Null for a home that is not in the feed, which has no page to link to. */
  mlsNumber: string | null;
  /** "HH:MM", 24-hour. */
  startsAt: string;
  kind: StopKind;
  note: string | null;
  address: string;
  town: string | null;
  state: string | null;
  zip: string | null;
  listPrice: number | null;
}

/**
 * One person on a tour. A tour is often a couple or a family, and each of them
 * may be reachable a different way — one by text, one by email.
 */
export interface TourPerson {
  /**
   * Made up once by the browser and kept. It is how the database tells "this
   * person's phone was corrected" from "this person was removed and somebody
   * else added", which a position in a list cannot say.
   */
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  /**
   * The CRM contact this person was filed as. WRITTEN BY THE DATABASE: the
   * trigger on showing_tours files anyone new and stamps this, and ignores
   * whatever a client sends in its place. Null means not in the CRM — usually
   * because there is no last name yet, or nothing to reach them by.
   */
  contactId: number | null;
}

export interface ShowingTour {
  id: string;
  /** Everyone on the tour, in the order they were entered. Never empty. */
  people: TourPerson[];
  /** "YYYY-MM-DD". */
  tourDate: string;
  note: string | null;
  /** When the email last went. Says nothing about a text — see the migration. */
  sentAt: string | null;
  createdAt: string;
  /** In time order. */
  stops: TourStop[];
}

const toStop = (row: StopRow): TourStop => ({
  id: row.id,
  mlsNumber: row.mls_number,
  // Postgres returns TIME as "10:00:00".
  startsAt: row.starts_at.slice(0, 5),
  kind: row.kind === 'open_house' ? 'open_house' : 'showing',
  note: row.note,
  address: row.address,
  town: row.town,
  state: row.state,
  zip: row.zip,
  listPrice: row.list_price,
});

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/**
 * The `clients` column, read defensively. It is jsonb, so the generated type is
 * `Json` and says nothing about its shape; the trigger is what guarantees one,
 * and this is what refuses to crash the page if a row ever predates it.
 */
const toPeople = (raw: Json): TourPerson[] =>
  (Array.isArray(raw) ? raw : []).flatMap((entry, i) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const name = text(entry.name);
    if (!name) return [];
    return [
      {
        id: text(entry.id) ?? `row-${i}`,
        name,
        email: text(entry.email),
        phone: text(entry.phone),
        contactId: typeof entry.contactId === 'number' ? entry.contactId : null,
      },
    ];
  });

const toTour = (row: TourRow & { showing_tour_stops?: StopRow[] | null }): ShowingTour => ({
  id: row.id,
  people: toPeople(row.clients),
  tourDate: row.tour_date,
  note: row.note,
  sentAt: row.sent_at,
  createdAt: row.created_at,
  stops: (row.showing_tour_stops ?? [])
    .map(toStop)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
});

/** A tour and its stops in one read — what every function returning a tour selects. */
const TOUR_SELECT = '*, showing_tour_stops(*)';

/** Every tour with its stops, latest date first. */
export const listTours = async (): Promise<ShowingTour[]> => {
  const { data, error } = await supabase
    .from('showing_tours')
    .select(TOUR_SELECT)
    .order('tour_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTour);
};

/** A person as the form holds them: every field a string, so inputs stay controlled. */
export interface PersonDraft {
  id: string;
  name: string;
  email: string;
  phone: string;
  /**
   * Known to be this CRM contact — because the database said so on the last
   * save, or because the row was just filled from a CRM suggestion. Cleared the
   * moment the row is edited, since it is then a claim nobody has checked. For
   * display only: it is never sent.
   */
  contactId: number | null;
}

export interface TourDetails {
  people: PersonDraft[];
  tourDate: string;
  note: string;
}

/** A row id. `randomUUID` needs a secure context, which a LAN dev URL is not. */
const rowId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const blankPerson = (): PersonDraft => ({
  id: rowId(),
  name: '',
  email: '',
  phone: '',
  contactId: null,
});

export const isBlankPerson = (p: PersonDraft): boolean =>
  !p.name.trim() && !p.email.trim() && !p.phone.trim();

export const draftOf = (p: TourPerson): PersonDraft => ({
  id: p.id,
  name: p.name,
  email: p.email ?? '',
  phone: p.phone ?? '',
  contactId: p.contactId,
});

/**
 * Whether saving will file this person in the CRM. A deliberate mirror of the
 * rule at the top of crm_upsert_contact(): a first AND a last name, and an email
 * or a ten-digit phone. It decides only which line the form shows under a row —
 * the database is what actually files, or does not.
 */
export const canFileInCrm = (p: Pick<PersonDraft, 'name' | 'email' | 'phone'>): boolean => {
  if (p.name.trim().split(/\s+/).length < 2) return false;
  const digits = p.phone.replace(/\D/g, '');
  const phoneOk = digits.length === 10 || (digits.length === 11 && digits[0] === '1');
  return phoneOk || p.email.trim().length > 0;
};

/** "Tammy Nguyen", "Tammy Nguyen & Matthew Nguyen", "A, B & C" — a tour's heading. */
export const tourNames = (tour: Pick<ShowingTour, 'people'>): string => {
  const names = tour.people.map((p) => p.name);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
};

/** Every address the schedule email goes to, once each. */
export const tourEmails = (tour: Pick<ShowingTour, 'people'>): string[] => [
  ...new Set(tour.people.flatMap((p) => (p.email ? [p.email] : []))),
];

/** Blank strings become NULL, so "no email" is one thing in the table and not two. */
const blank = (value: string) => value.trim() || null;

/**
 * No `contactId`: that key is the database's to write. Blank rows are dropped
 * here rather than sent — the trigger drops them too, but a spare empty line on
 * the form is not something to make it decide about.
 */
const detailColumns = (d: TourDetails) => ({
  clients: d.people
    .filter((p) => !isBlankPerson(p))
    .map((p) => ({
      id: p.id,
      name: p.name.trim(),
      email: blank(p.email)?.toLowerCase() ?? null,
      phone: blank(p.phone),
    })),
  tour_date: d.tourDate,
  note: blank(d.note),
});

/**
 * The database's own sentence, when it refused the people on a tour. The trigger
 * raises check_violation with a message written for Kevin ("Everyone on a tour
 * needs a name."), the same arrangement as guard_rental_document_count().
 */
export const tourSaveMessage = (error: unknown): string | null => {
  const e = error as { code?: unknown; message?: unknown } | null;
  return e?.code === '23514' && typeof e.message === 'string' ? e.message : null;
};

export const createTour = async (details: TourDetails): Promise<ShowingTour> => {
  const { data, error } = await supabase
    .from('showing_tours')
    .insert(detailColumns(details))
    .select(TOUR_SELECT)
    .single();
  if (error) throw error;
  return toTour(data);
};

/**
 * Returns the row AS SAVED, which is not what was sent: names come back
 * trimmed, emails lower-cased, and each person with the contactId the database
 * filed them under. The form re-seeds from it, so the "In your CRM" line under a
 * name is the database's answer and not the page's guess.
 */
export const updateTour = async (id: string, details: TourDetails): Promise<ShowingTour> => {
  const { data, error } = await supabase
    .from('showing_tours')
    .update({ ...detailColumns(details), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(TOUR_SELECT)
    .single();
  if (error) throw error;
  return toTour(data);
};

/** Removes the tour and, by cascade, its stops. */
export const deleteTour = async (id: string): Promise<void> => {
  const { error } = await supabase.from('showing_tours').delete().eq('id', id);
  if (error) throw error;
};

export interface NewStop {
  mlsNumber: string | null;
  startsAt: string;
  kind: StopKind;
  note: string;
  address: string;
  town: string | null;
  state: string | null;
  zip: string | null;
  listPrice: number | null;
}

export const addStop = async (tourId: string, stop: NewStop): Promise<TourStop> => {
  const { data, error } = await supabase
    .from('showing_tour_stops')
    .insert({
      tour_id: tourId,
      mls_number: stop.mlsNumber,
      starts_at: stop.startsAt,
      kind: stop.kind,
      note: blank(stop.note),
      address: stop.address.trim(),
      town: stop.town,
      state: stop.state,
      zip: stop.zip,
      list_price: stop.listPrice,
    })
    .select('*')
    .single();
  if (error) throw error;
  return toStop(data);
};

export const removeStop = async (id: string): Promise<void> => {
  const { error } = await supabase.from('showing_tour_stops').delete().eq('id', id);
  if (error) throw error;
};

/* -------------------------------------------------------------------------- */
/* Picking the client                                                          */
/* -------------------------------------------------------------------------- */

/** A CRM contact, as far as a tour needs one: who, and how to reach them. */
export interface ClientSuggestion {
  contactId: number;
  name: string;
  email: string | null;
  phone: string | null;
}

export const isWorthFindingClient = (text: string): boolean => text.trim().length >= 2;

/**
 * CRM contacts matching a typed name or email, so a tour for somebody already
 * in the CRM starts with their email and phone rather than a retyped copy that
 * can differ from it by a digit.
 *
 * Every word typed has to match somewhere — first name, last name or email —
 * so "sar ch" finds Sarah Chen and not every Sarah. A suggestion, not a link:
 * the tour stores the name and contact details it was sent to. Somebody who is
 * NOT in the CRM is typed in just the same, and the database files them there
 * when the tour is saved — see the trigger in 20261008100000_showing_tour_people.
 */
export const suggestClients = async (
  text: string,
  signal?: AbortSignal
): Promise<ClientSuggestion[]> => {
  // PostgREST's own delimiters and LIKE's wildcards, none of which may be typed in.
  const words = text
    .replace(/[(),%*\\]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  if (words.length === 0) return [];

  let query = supabase.from('contacts_view').select('contact_id, first_name, last_name, email, phone');
  for (const word of words) {
    query = query.or(
      `first_name.ilike.%${word}%,last_name.ilike.%${word}%,email.ilike.%${word}%`
    );
  }
  if (signal) query = query.abortSignal(signal);

  const { data, error } = await query.limit(8);
  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.contact_id !== null)
    .map((row) => ({
      contactId: row.contact_id as number,
      name: [row.first_name, row.last_name].filter(Boolean).join(' ').trim(),
      email: row.email,
      phone: row.phone,
    }))
    .filter((client) => client.name);
};

/* -------------------------------------------------------------------------- */
/* Delivering it                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The edge function's own message, when it sent one.
 *
 * supabase-js reports any non-2xx as a generic FunctionsHttpError and leaves
 * the body on `error.context`. The function's refusals are written for the
 * admin to read ("Add at least one stop…"), so they are worth digging out
 * rather than replacing with "Edge Function returned a non-2xx status code".
 */
const functionMessage = async (error: unknown, fallback: string): Promise<string> => {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as { error?: unknown };
      if (typeof body.error === 'string') return body.error;
    } catch {
      // Not JSON. Fall through to the generic message.
    }
  }
  return fallback;
};

export interface SchedulePreview {
  subject: string;
  /** The schedule as a text message, ready to paste or to open in Messages. */
  text: string;
  /** The email exactly as it would be sent. */
  html: string;
}

/**
 * The schedule as the client would get it. SENDS NOTHING.
 *
 * The text and the email come back from one call to one renderer, on the
 * server, so they cannot disagree about a time or an address — and "Text
 * message" needs no email address and stamps nothing.
 */
export const previewSchedule = async (tourId: string): Promise<SchedulePreview> => {
  const { data, error } = await supabase.functions.invoke('showing-schedule', {
    body: { action: 'preview', tourId },
  });
  if (error) throw new Error(await functionMessage(error, 'Could not build the schedule.'));
  return data as SchedulePreview;
};

/** Emails the schedule to everyone on the tour who has an address. Returns when it went. */
export const sendSchedule = async (tourId: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('showing-schedule', {
    body: { action: 'send', tourId },
  });
  if (error) throw new Error(await functionMessage(error, 'Could not send the email.'));
  if (!data?.sent) throw new Error(data?.error ?? 'Could not send the email.');
  return data.sentAt as string;
};

/* -------------------------------------------------------------------------- */
/* Display                                                                     */
/* -------------------------------------------------------------------------- */

/** "Sat, Oct 10, 2026" from "2026-10-10", without ever passing through local time. */
export const formatTourDate = (isoDate: string): string => {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
};

/** "10:00 AM" from "10:00". The edge function carries the same few lines. */
export const formatStopTime = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** Today in Massachusetts as "YYYY-MM-DD", for the date field's default. */
export const todayInBoston = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
