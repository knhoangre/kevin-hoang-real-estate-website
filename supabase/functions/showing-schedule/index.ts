/**
 * A showing tour, rendered for the client — as an email and as a text message.
 *
 * ADMIN ONLY, and checked as such on every call. A tour is a client's name,
 * their phone number and where they will be at ten on Saturday.
 *
 * Two actions, both addressed by the tour's ID and nothing else:
 *
 *   preview  Returns the schedule as a text message and as the email's HTML.
 *            SENDS NOTHING and changes nothing. This is what the "Text message"
 *            button calls: Kevin copies the text, or opens it in Messages, and
 *            sends it from his own phone. Email is never required.
 *
 *   send     Emails the schedule to everyone on the tour who has an address —
 *            one message, all of them on the To line — with a calendar file
 *            attached and Kevin on cc, and stamps `sent_at`.
 *
 * It takes an ID rather than an address or a body for the same reason the
 * rental invite's `send` does: the recipient and every word of the message are
 * read here, from the database, so this endpoint cannot be used to mail an
 * arbitrary person an arbitrary thing under Kevin's name.
 *
 * ONE RENDERER FOR BOTH. The text and the email are built from the same resolved
 * stops, in the same function call. Two renderers — one here, one in the browser
 * for the text — is how a client ends up with an email that says 10:00 and a
 * text that says 10:30.
 *
 * A TOUR IS A LIST OF PEOPLE (`showing_tours.clients`), often a couple. The
 * greeting names each of them, and they share one email rather than getting a
 * copy apiece: two people going to the same houses on the same morning should
 * be able to see that the other has it, and reply-all to move a time.
 *
 * LISTINGS ARE RE-READ FROM THE FEED AT SEND TIME, so a price that was cut
 * between booking the showing and sending the schedule is the price in the
 * message. The snapshot stored on the stop is what is left to print when a
 * listing has gone from the feed.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@3.1.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import {
  escapeHtml,
  fetchEmailListing,
  formatPrice,
  listingAddressLine,
  listingCardHtml,
  listingFactsLine,
  listingUrl,
  type EmailListing,
} from '../_shared/listingEmail.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

/*
 * Who the schedule is from. A deliberate mirror of SITE in
 * src/lib/siteConfig.ts — name and phone must match it character for character
 * (NAP), and the brokerage is named because 254 CMR 3.00 wants it on anything
 * that goes out under a broker's name.
 */
const AGENT = {
  name: 'Kevin Hoang',
  brokerage: 'LPT Realty',
  phone: '(860) 682-2251',
  email: 'knhoangre@gmail.com',
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* -------------------------------------------------------------------------- */
/* Dates and times — wall-clock, Massachusetts                                 */
/* -------------------------------------------------------------------------- */

/**
 * "Saturday, October 10" from "2026-10-10".
 *
 * Built and formatted in UTC on purpose. `new Date('2026-10-10')` is midnight
 * UTC, which formatted in a US timezone is the evening of the 9th — the
 * off-by-a-day bug that makes a schedule name the wrong Saturday.
 */
const longDate = (isoDate: string): string => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
};

/** "10:00 AM" from "10:00:00". */
const clock = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

const KIND_LABEL: Record<string, string> = {
  showing: 'Showing',
  open_house: 'Open house',
};

/* -------------------------------------------------------------------------- */
/* The people                                                                  */
/* -------------------------------------------------------------------------- */

interface Person {
  name: string;
  email: string | null;
}

/**
 * `clients` is jsonb, so it arrives untyped. The trigger on showing_tours is
 * what guarantees its shape; this only refuses to throw on a row that somehow
 * does not have it, since the result of that would be an unsendable tour.
 */
const peopleOf = (raw: unknown): Person[] =>
  (Array.isArray(raw) ? raw : []).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const { name, email } = entry as Record<string, unknown>;
    if (typeof name !== 'string' || !name.trim()) return [];
    return [
      { name: name.trim(), email: typeof email === 'string' && email.trim() ? email.trim() : null },
    ];
  });

/** "Tammy", "Tammy and Matthew", "Tammy, Matthew and Sam" — first names, as spoken. */
const greetingNames = (people: Person[]): string => {
  const names = people.map((p) => p.name.split(/\s+/)[0]);
  if (names.length <= 1) return names[0] ?? 'there';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

/* -------------------------------------------------------------------------- */
/* The stops, resolved                                                         */
/* -------------------------------------------------------------------------- */

interface StopRow {
  mls_number: string | null;
  starts_at: string;
  kind: string;
  note: string | null;
  address: string;
  town: string | null;
  state: string | null;
  zip: string | null;
  list_price: number | null;
}

interface Stop {
  time: string;
  /** "HH:MM", for the calendar file. */
  startsAt: string;
  kind: string;
  note: string | null;
  /** Live from the feed, or null when the listing is gone or was typed by hand. */
  listing: EmailListing | null;
  addressLine: string;
  /** Price and, when the feed has them, beds/baths/area. Empty if nothing is known. */
  facts: string;
  /** The home's page on this site. Null for a stop with no MLS number. */
  url: string | null;
}

/* -------------------------------------------------------------------------- */
/* The route                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One Google Maps link through every stop, in order.
 *
 * No origin is given, so Maps starts from wherever the person opening it is —
 * which is the right answer for a client leaving home and for Kevin leaving the
 * last appointment. Built with the documented Maps URLs parameters rather than a
 * path of slash-separated addresses, which breaks on an address containing one.
 */
const routeUrl = (stops: Stop[]): string | null => {
  if (stops.length === 0) return null;
  const addresses = stops.map((s) => s.addressLine);
  if (addresses.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addresses[0])}`;
  }
  const destination = addresses[addresses.length - 1];
  const waypoints = addresses.slice(0, -1).join('|');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination
  )}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
};

/* -------------------------------------------------------------------------- */
/* The text message                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Plain text, short lines, a full https:// link per stop.
 *
 * `https://` and not a bare domain: iOS will link "kevinhoang.co/search/…" on
 * its own, but plenty of Android messaging apps will not, and a schedule whose
 * links are not tappable has lost the point of sending it. No tracking
 * parameters — a text is read on a phone and every character is visible.
 */
const renderText = (greeting: string, dateLabel: string, note: string | null, stops: Stop[]) => {
  const lines: string[] = [`Hi ${greeting}, here is our schedule for ${dateLabel}:`];
  if (note) lines.push('', note);

  for (const stop of stops) {
    lines.push('', `${stop.time} - ${KIND_LABEL[stop.kind] ?? 'Showing'}`, stop.addressLine);
    if (stop.facts) lines.push(stop.facts);
    if (stop.note) lines.push(stop.note);
    if (stop.url) lines.push(stop.url);
  }

  // No driving-route link here, though the email has one. A Maps URL through
  // three addresses is close to three hundred characters of percent-encoding,
  // and in a text every one of them is on screen above the signature.

  lines.push('', `${AGENT.name}, ${AGENT.brokerage}`, AGENT.phone);
  return lines.join('\n');
};

/* -------------------------------------------------------------------------- */
/* The email                                                                   */
/* -------------------------------------------------------------------------- */

const P =
  "font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;";

const renderHtml = (greeting: string, dateLabel: string, note: string | null, stops: Stop[]) => {
  const route = routeUrl(stops);

  const stopRows = stops
    .map((stop) => {
      const heading = `<tr><td style="padding:26px 0 10px 0;border-top:1px solid #eeeeee;">
        <span style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:22px;color:#1a1a1a;">${escapeHtml(
          stop.time
        )}</span>
        <span style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8c6b35;padding-left:10px;">${escapeHtml(
          KIND_LABEL[stop.kind] ?? 'Showing'
        )}</span>
      </td></tr>`;

      const body = stop.listing
        ? listingCardHtml(stop.listing, { source: 'showing-schedule', cta: 'View this home' })
        : // A home that is not in the feed: the address, and whatever was noted
          // when the stop was added. No card, because there is no page to link.
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e5e5;"><tr><td style="padding:18px 22px;${P}">
            <strong style="font-weight:600;">${escapeHtml(stop.addressLine)}</strong>${
              stop.facts ? `<br />${escapeHtml(stop.facts)}` : ''
            }${
              stop.url
                ? `<br /><a href="${escapeHtml(stop.url)}" style="color:#1a1a1a;">View this home</a>`
                : ''
            }
          </td></tr></table>`;

      const noteRow = stop.note
        ? `<tr><td style="padding:10px 0 0 0;${P}font-size:14px;color:#444444;">${escapeHtml(stop.note)}</td></tr>`
        : '';

      return `${heading}<tr><td style="padding:0 0 6px 0;">${body}</td></tr>${noteRow}<tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Showing schedule</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border:1px solid #2d2d2d;background-color:#ffffff;">
        <tr><td style="padding:40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:0 0 6px 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#8c6b35;text-align:center;">
              Showing schedule
            </td></tr>
            <tr><td style="padding:0 0 26px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:#1a1a1a;text-align:center;">
              ${escapeHtml(dateLabel)}
            </td></tr>
            <tr><td style="padding:0 0 22px 0;${P}">
              Hi ${escapeHtml(greeting)},<br /><br />
              Here ${stops.length === 1 ? 'is the home' : `are the ${stops.length} homes`} we are seeing, in order. Each one links to its page on my site, with every photo, the price history and an estimate, so you can look before we go and again afterwards.
            </td></tr>
            ${note ? `<tr><td style="padding:0 0 22px 0;${P}">${escapeHtml(note)}</td></tr>` : ''}
            ${stopRows}
            ${
              route && stops.length > 1
                ? `<tr><td style="padding:6px 0 26px 0;${P}">
              <a href="${escapeHtml(route)}" style="color:#1a1a1a;text-decoration:underline;">Open the driving route in Google Maps</a>
            </td></tr>`
                : ''
            }
            <tr><td style="padding:22px 0 0 0;border-top:1px solid #eeeeee;${P}">
              The calendar file attached adds each stop to your calendar. If a time stops working for you, reply to this email or text me and I will move it.
            </td></tr>
            <tr><td style="padding:22px 0 0 0;${P}">
              <strong style="font-weight:600;">${escapeHtml(AGENT.name)}</strong><br />
              ${escapeHtml(AGENT.brokerage)}<br />
              <a href="tel:+18606822251" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(AGENT.phone)}</a>
              &nbsp;·&nbsp;
              <a href="mailto:${escapeHtml(AGENT.email)}" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(AGENT.email)}</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

/* -------------------------------------------------------------------------- */
/* The calendar file                                                           */
/* -------------------------------------------------------------------------- */

/** Text escaping per RFC 5545 §3.3.11. */
const icsText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines over 75 octets must be folded; calendar apps are strict about it. */
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = ` ${rest.slice(73)}`;
  }
  out.push(rest);
  return out.join('\r\n');
};

/**
 * One event per stop.
 *
 * Times carry TZID=America/New_York with the timezone defined in the file, not
 * a UTC instant and not a "floating" time: a floating 10:00 is 10:00 wherever
 * the phone happens to be, and a client checking from a trip would be shown the
 * right number for the wrong reason. Thirty minutes each — nobody recorded how
 * long a stop is, and a default that is visibly a default beats a guess.
 *
 * METHOD:PUBLISH, not REQUEST. This is a schedule being shared, not a meeting
 * invitation: REQUEST makes mail clients show accept/decline and send replies to
 * an organiser.
 */
const renderIcs = (tourId: string, tourDate: string, stops: Stop[]): string => {
  const day = tourDate.replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const plusThirty = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const total = Math.min(h * 60 + m + 30, 23 * 60 + 59);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}${String(total % 60).padStart(2, '0')}00`;
  };

  const events = stops.flatMap((stop, i) => {
    const start = `${stop.startsAt.replace(':', '')}00`;
    const description = [stop.facts, stop.note, stop.url].filter(Boolean).join('\n');
    return [
      'BEGIN:VEVENT',
      `UID:${tourId}-${i}@kevinhoang.co`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=America/New_York:${day}T${start}`,
      `DTEND;TZID=America/New_York:${day}T${plusThirty(stop.startsAt)}`,
      `SUMMARY:${icsText(`${KIND_LABEL[stop.kind] ?? 'Showing'}: ${stop.addressLine}`)}`,
      `LOCATION:${icsText(stop.addressLine)}`,
      ...(description ? [`DESCRIPTION:${icsText(description)}`] : []),
      ...(stop.url ? [`URL:${stop.url}`] : []),
      'END:VEVENT',
    ];
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kevin Hoang//Showing Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:America/New_York',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0400',
    'TZNAME:EDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0500',
    'TZNAME:EST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n');
};

/** Base64 of the UTF-8 bytes, which is what Resend expects an attachment as. */
const base64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

/* -------------------------------------------------------------------------- */
/* Handler                                                                     */
/* -------------------------------------------------------------------------- */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { action, tourId } = await req.json();

    if (action !== 'preview' && action !== 'send') {
      return json({ error: 'Unknown action' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return json({ error: 'Server configuration error' }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // The caller, resolved from their JWT against auth — never from the body.
    // `app_metadata.is_admin` is the flag public.is_admin() and AuthContext read.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authError } = jwt
      ? await admin.auth.getUser(jwt)
      : { data: null, error: null };
    const user = authError ? null : auth?.user ?? null;
    if (!user) return json({ error: 'Not signed in' }, 401);
    if (user.app_metadata?.is_admin !== true) {
      console.warn('Non-admin called showing-schedule:', user.id);
      return json({ error: 'Not allowed' }, 403);
    }

    if (typeof tourId !== 'string' || !UUID.test(tourId)) {
      return json({ error: 'Unknown tour' }, 400);
    }

    const { data: tour, error: tourError } = await admin
      .from('showing_tours')
      .select('id, clients, tour_date, note')
      .eq('id', tourId)
      .maybeSingle();
    if (tourError) {
      console.error('Tour lookup failed:', tourError.message);
      return json({ error: 'Lookup failed' }, 500);
    }
    if (!tour) return json({ error: 'That tour no longer exists.' }, 404);

    const { data: rows, error: stopsError } = await admin
      .from('showing_tour_stops')
      .select('mls_number, starts_at, kind, note, address, town, state, zip, list_price')
      .eq('tour_id', tourId)
      .order('starts_at', { ascending: true });
    if (stopsError) {
      console.error('Stops lookup failed:', stopsError.message);
      return json({ error: 'Lookup failed' }, 500);
    }
    if (!rows || rows.length === 0) {
      return json({ error: 'Add at least one stop before sending the schedule.' }, 400);
    }

    const stops: Stop[] = [];
    for (const row of rows as StopRow[]) {
      const listing = row.mls_number ? await fetchEmailListing(admin, row.mls_number) : null;
      const snapshotLine = [row.address, row.town, [row.state, row.zip].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ');
      stops.push({
        time: clock(row.starts_at),
        startsAt: row.starts_at.slice(0, 5),
        kind: row.kind,
        note: row.note?.trim() || null,
        listing,
        addressLine: listing ? listingAddressLine(listing) : snapshotLine,
        facts: listing
          ? listingFactsLine(listing)
          : row.list_price !== null
            ? formatPrice(Number(row.list_price))
            : '',
        url: row.mls_number ? listingUrl(row.mls_number) : null,
      });
    }

    const people = peopleOf(tour.clients);
    const greeting = greetingNames(people);
    const dateLabel = longDate(tour.tour_date);
    const note = tour.note?.trim() || null;
    const subject = `Showing schedule for ${dateLabel}`;
    const text = renderText(greeting, dateLabel, note, stops);
    const html = renderHtml(greeting, dateLabel, note, stops);

    if (action === 'preview') {
      return json({ subject, text, html, stops: stops.length });
    }

    // ---- send -------------------------------------------------------------
    // Once each: a couple who share an address get one copy, not two.
    const to = [...new Set(people.flatMap((p) => (p.email ? [p.email.toLowerCase()] : [])))];
    if (to.length === 0) {
      return json(
        {
          sent: false,
          error: 'Nobody on this tour has an email address. Add one, or send it as a text.',
        },
        400
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY');
      return json({ sent: false, error: 'Email is not configured.' }, 500);
    }

    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: 'Kevin Hoang <contact@kevinhoang.co>',
      to,
      // Kevin gets the copy the clients got, so "what did I send them" is
      // answered by his own inbox.
      ...(to.includes(AGENT.email) ? {} : { cc: [AGENT.email] }),
      replyTo: AGENT.email,
      subject,
      html,
      text,
      attachments: [
        {
          filename: 'showing-schedule.ics',
          content: base64(renderIcs(tour.id, tour.tour_date, stops)),
          contentType: 'text/calendar',
        },
      ],
    });
    // The SDK reports an API refusal in `error` rather than throwing, so a
    // bounced domain or a bad key would otherwise be reported as sent.
    if (result?.error) {
      console.error('Resend refused the schedule:', result.error);
      return json({ sent: false, error: 'The email could not be sent.' }, 502);
    }

    const sentAt = new Date().toISOString();
    const { error: stampError } = await admin
      .from('showing_tours')
      .update({ sent_at: sentAt, updated_at: sentAt })
      .eq('id', tourId);
    // The mail did go; a failed stamp is logged, not reported as a failed send.
    if (stampError) console.error('Could not stamp sent_at:', stampError.message);

    return json({ sent: true, sentAt, to });
  } catch (err) {
    console.error('showing-schedule failed:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
