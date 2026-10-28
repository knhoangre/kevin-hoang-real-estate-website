/**
 * The morning-of showing reminder.
 *
 * Every rule — what counts as a showing, who is emailed, what the message
 * says — is in _shared/showingReminders.ts, which is pure and checked by
 * `node scripts/showing-reminders-check.ts`. This file fetches and sends.
 *
 * Two actions:
 *
 *   run   From pg_cron, at 12:00 and 13:00 UTC (20261028110000). SERVICE ROLE
 *         ONLY. Goes ahead only when it is 8 AM in Boston, so exactly one of the
 *         two does anything. Emails each client who is a guest on Kevin's own
 *         event (or on a showing tour), then emails Kevin one summary with every
 *         message written out. Each email is claimed in `showing_reminders`
 *         first, so nothing goes twice. `force` skips the hour check; `dryRun`
 *         returns what it would send and sends nothing.
 *
 *   list  From /admin/showings. ADMIN ONLY. Today's or tomorrow's reminders,
 *         read live, with what has already gone out. Sends nothing.
 *
 * THE CALENDAR is the "Secret address in iCal format" of Kevin's Google
 * Calendar, in the SHOWING_CALENDAR_ICS_URL secret. It reads his whole
 * calendar, so it is never logged and never returned; only showings leave this
 * function. A calendar that cannot be read is said so in Kevin's summary — a
 * morning with no email has to mean a morning with no showings.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@3.1.0';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import {
  AGENT,
  SEND_HOUR,
  addDays,
  byTime,
  calendarReminders,
  clientEmail,
  clientSubject,
  clockAt,
  digestEmail,
  digestSubject,
  ownAddresses,
  parseIcs,
  tourReminders,
  type Outcome,
  type Problem,
  type Reminder,
  type TourRow,
} from '../_shared/showingReminders.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

type Db = SupabaseClient;

/**
 * The role in the caller's JWT. The gateway has already verified the signature
 * (verify_jwt is on), so reading the claim is enough — the same check idx-sync
 * makes. The anon key is in every browser; the service-role key is not.
 */
const callerRole = (req: Request): string | null => {
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const payload = token.split('.')[1];
    if (!payload) return null;
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof claims.role === 'string' ? claims.role : null;
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/* Gathering the day                                                           */
/* -------------------------------------------------------------------------- */

interface Day {
  reminders: Reminder[];
  problems: Problem[];
  /** False when no calendar address has been set yet. */
  connected: boolean;
}

const readCalendar = async (day: string): Promise<Day> => {
  const url = Deno.env.get('SHOWING_CALENDAR_ICS_URL')?.trim();
  if (!url) return { reminders: [], problems: [], connected: false };

  let text: string;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      console.error('Calendar fetch failed with HTTP', res.status);
      return {
        reminders: [],
        problems: [
          res.status === 404
            ? "Google Calendar no longer recognises the calendar's private address — it was probably reset. Copy the new one into the site's settings."
            : `Google Calendar could not be read this morning (it answered ${res.status}). No reminders went out from it.`,
        ],
        connected: true,
      };
    }
    text = await res.text();
  } catch (err) {
    console.error('Calendar fetch failed:', err instanceof Error ? err.name : 'error');
    return {
      reminders: [],
      problems: ['Google Calendar did not answer this morning. No reminders went out from it.'],
      connected: true,
    };
  }
  if (!text.includes('BEGIN:VCALENDAR')) {
    return {
      reminders: [],
      problems: ['Google Calendar sent back something that is not a calendar. No reminders went out from it.'],
      connected: true,
    };
  }

  const { reminders, problems } = calendarReminders(parseIcs(text), day, ownAddresses(url));
  return { reminders, problems, connected: true };
};

const readTours = async (db: Db, day: string): Promise<Day> => {
  const { data, error } = await db
    .from('showing_tours')
    .select('id, tour_date, clients, showing_tour_stops(starts_at, address, town, state)')
    .eq('tour_date', day);
  if (error) {
    console.error('Tour lookup failed:', error.message);
    return { reminders: [], problems: ["The day's showing tours could not be read."], connected: true };
  }
  return { reminders: tourReminders((data ?? []) as TourRow[], day), problems: [], connected: true };
};

const gather = async (db: Db, day: string): Promise<Day> => {
  const [calendar, tours] = await Promise.all([readCalendar(day), readTours(db, day)]);
  return {
    reminders: [...calendar.reminders, ...tours.reminders].sort(byTime),
    problems: [...calendar.problems, ...tours.problems],
    connected: calendar.connected,
  };
};

interface SentRow {
  kind: string;
  source_key: string;
  recipients: string[];
  sent_at: string | null;
  error: string | null;
}

const sentRows = async (db: Db, day: string): Promise<SentRow[]> => {
  const { data, error } = await db
    .from('showing_reminders')
    .select('kind, source_key, recipients, sent_at, error')
    .eq('day', day);
  if (error) console.error('Reminder log lookup failed:', error.message);
  return (data ?? []) as SentRow[];
};

/**
 * Claims one email for the day. Returns the row's id, or null when it was
 * already claimed — by the other of the two cron runs, or a forced re-run —
 * in which case nothing is sent.
 */
const claim = async (
  db: Db,
  day: string,
  kind: 'client' | 'digest',
  key: string,
  recipients: string[]
): Promise<string | null> => {
  const { data, error } = await db
    .from('showing_reminders')
    .upsert(
      { day, kind, source_key: key, recipients },
      { onConflict: 'day,kind,source_key', ignoreDuplicates: true }
    )
    .select('id');
  if (error) {
    console.error('Could not claim a reminder:', error.message);
    return null;
  }
  return (data as { id: string }[] | null)?.[0]?.id ?? null;
};

const settle = async (db: Db, id: string, error: string | null) => {
  const { error: stampError } = await db
    .from('showing_reminders')
    .update(error ? { error } : { sent_at: new Date().toISOString() })
    .eq('id', id);
  // The mail did or did not go either way; a failed stamp is only logged.
  if (stampError) console.error('Could not stamp a reminder:', stampError.message);
};

/* -------------------------------------------------------------------------- */
/* Handler                                                                     */
/* -------------------------------------------------------------------------- */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    if (action !== 'run' && action !== 'list') return json({ error: 'Unknown action' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return json({ error: 'Server configuration error' }, 500);
    }
    const db = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = clockAt(Date.now());

    // ---- list -------------------------------------------------------------
    if (action === 'list') {
      // The caller, resolved from their JWT against auth — never from the body.
      const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
      const { data: auth, error: authError } = jwt ? await db.auth.getUser(jwt) : { data: null, error: null };
      const user = authError ? null : auth?.user ?? null;
      if (!user) return json({ error: 'Not signed in' }, 401);
      if (user.app_metadata?.is_admin !== true) {
        console.warn('Non-admin called showing-reminders:', user.id);
        return json({ error: 'Not allowed' }, 403);
      }

      const tomorrow = body?.day === 'tomorrow';
      const day = tomorrow ? addDays(now.day, 1) : now.day;
      const [{ reminders, problems, connected }, rows] = await Promise.all([gather(db, day), sentRows(db, day)]);
      const byKey = new Map(rows.filter((r) => r.kind === 'client').map((r) => [r.source_key, r]));
      const digest = rows.find((r) => r.kind === 'digest');

      return json({
        day,
        connected,
        // Whether the 8 AM run for this day is still to come.
        beforeSend: tomorrow || now.hour < SEND_HOUR,
        problems,
        digestSentAt: digest?.sent_at ?? null,
        reminders: reminders.map((r) => {
          const row = byKey.get(r.key);
          return {
            ...r,
            subject: clientSubject(r),
            sent: row ? { at: row.sent_at, to: row.recipients, error: row.error } : null,
          };
        }),
      });
    }

    // ---- run --------------------------------------------------------------
    if (callerRole(req) !== 'service_role') return json({ error: 'Not allowed' }, 403);
    if (!body?.force && now.hour !== SEND_HOUR) {
      // The other of the two daily runs, an hour off by daylight saving.
      return json({ skipped: true, hour: now.hour });
    }

    const day = now.day;
    const { reminders, problems, connected } = await gather(db, day);

    if (body?.dryRun) {
      return json({
        dryRun: true,
        day,
        connected,
        problems,
        reminders: reminders.map((r) => ({
          key: r.key,
          time: r.time,
          name: r.name,
          autoEmail: r.autoEmail,
          phones: r.phones,
          emails: r.emails,
          invitedBy: r.invitedBy,
          message: r.message,
        })),
        digest: reminders.length || problems.length ? digestSubject(reminders.length, problems.length) : null,
      });
    }

    if (reminders.length === 0 && problems.length === 0) return json({ day, emailed: 0, digest: false });

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY');
      return json({ error: 'Email is not configured.' }, 500);
    }
    const resend = new Resend(resendApiKey);

    let emailed = 0;
    for (const r of reminders) {
      if (r.autoEmail.length === 0) continue;
      const id = await claim(db, day, 'client', r.key, r.autoEmail);
      if (!id) continue;
      const email = clientEmail(r);
      const result = await resend.emails.send({
        from: 'Kevin Hoang <contact@kevinhoang.co>',
        to: r.autoEmail,
        reply_to: AGENT.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      // The SDK reports a refusal in `error` rather than throwing.
      if (result?.error) {
        console.error('Resend refused a reminder:', result.error);
        await settle(db, id, 'The email was refused.');
      } else {
        emailed += 1;
        await settle(db, id, null);
      }
    }

    // The summary reports what the log says, so a forced second run describes
    // the 8 AM emails rather than claiming nothing went.
    const outcomes = new Map<string, Outcome>(
      (await sentRows(db, day))
        .filter((row) => row.kind === 'client')
        .map((row) => [
          row.source_key,
          { sentTo: row.sent_at ? row.recipients : [], error: row.sent_at ? null : row.error ?? 'Not sent.' },
        ])
    );

    const digestId = await claim(db, day, 'digest', 'digest', [AGENT.email]);
    if (digestId) {
      const digest = digestEmail(day, reminders, outcomes, problems);
      const result = await resend.emails.send({
        from: 'Kevin Hoang <contact@kevinhoang.co>',
        to: [AGENT.email],
        subject: digest.subject,
        html: digest.html,
        text: digest.text,
      });
      if (result?.error) console.error('Resend refused the summary:', result.error);
      await settle(db, digestId, result?.error ? 'The summary was refused.' : null);
    }

    return json({ day, emailed, digest: Boolean(digestId) });
  } catch (err) {
    console.error('showing-reminders failed:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
