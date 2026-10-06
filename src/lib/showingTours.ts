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
import type { Database } from '@/integrations/supabase/types';

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

export interface ShowingTour {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
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

const toTour = (row: TourRow & { showing_tour_stops?: StopRow[] | null }): ShowingTour => ({
  id: row.id,
  clientName: row.client_name,
  clientEmail: row.client_email,
  clientPhone: row.client_phone,
  tourDate: row.tour_date,
  note: row.note,
  sentAt: row.sent_at,
  createdAt: row.created_at,
  stops: (row.showing_tour_stops ?? [])
    .map(toStop)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
});

/** Every tour with its stops, latest date first. */
export const listTours = async (): Promise<ShowingTour[]> => {
  const { data, error } = await supabase
    .from('showing_tours')
    .select('*, showing_tour_stops(*)')
    .order('tour_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTour);
};

export interface TourDetails {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  tourDate: string;
  note: string;
}

/** Blank strings become NULL, so "no email" is one thing in the table and not two. */
const blank = (value: string) => value.trim() || null;

const detailColumns = (d: TourDetails) => ({
  client_name: d.clientName.trim(),
  client_email: blank(d.clientEmail)?.toLowerCase() ?? null,
  client_phone: blank(d.clientPhone),
  tour_date: d.tourDate,
  note: blank(d.note),
});

export const createTour = async (details: TourDetails): Promise<ShowingTour> => {
  const { data, error } = await supabase
    .from('showing_tours')
    .insert(detailColumns(details))
    .select('*')
    .single();
  if (error) throw error;
  return toTour(data);
};

export const updateTour = async (id: string, details: TourDetails): Promise<void> => {
  const { error } = await supabase
    .from('showing_tours')
    .update({ ...detailColumns(details), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
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
 * the tour stores the name and contact details it was sent to, and typing
 * somebody who is not in the CRM is exactly as valid.
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

/** Emails the schedule to the tour's client. Returns when it went. */
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
