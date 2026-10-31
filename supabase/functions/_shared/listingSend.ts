/**
 * Homes a client may be interested in, written out — as a text and as an email.
 *
 * PURE — no network, no Deno, no npm — so `node scripts/send-listings-check.ts`
 * runs it. The edge function `send-listings` does the reading and the sending,
 * and decides nothing about what the message says.
 *
 * ONE RENDERER FOR BOTH, on the server, for the reason the showing schedule has
 * one: a text and an email built apart are how one client gets two prices.
 *
 * THE ADDRESS, THE MLS NUMBER AND THE LINK ARE ALL IN THE TEXT. Those are the
 * three things Kevin was putting together by hand for each home, and which of
 * them a client wants depends on the client: the link to look at it, the number
 * to quote back to a lender.
 *
 * THE LISTING OFFICE IS NAMED IN THE TEXT AS WELL AS ON THE EMAIL'S CARD. A
 * message signed "Kevin Hoang, LPT Realty" under somebody else's listing reads as
 * his listing, and the words cost less than the misunderstanding.
 */
import {
  escapeHtml,
  listingAddressLine,
  listingCardHtml,
  listingFactsLine,
  listingUrl,
  statusLabel,
  type EmailListing,
} from './listingEmail.ts';
import { AGENT, greetingFor } from './showingReminders.ts';

/** Fixed, never from a request. Becomes utm_source, so GA4 can count who came back. */
const SOURCE = 'send-listings';

/**
 * A home that cannot be walked into as things stand. Everything else in the feed
 * (Active, New, Price changed, Back on market…) is simply for sale and says
 * nothing in a text, where every word is on screen. Measured 2026-10-30: these
 * four are the only such statuses in either feed.
 */
const NOT_AVAILABLE = new Set(['CTG', 'UAG', 'SLD', 'RNT']);

export const availabilityNote = (status: string | null): string | null => {
  const code = (status ?? '').trim().toUpperCase();
  return NOT_AVAILABLE.has(code) ? statusLabel(code) : null;
};

/* -------------------------------------------------------------------------- */
/* Saying it                                                                   */
/* -------------------------------------------------------------------------- */

/** "here are 3 homes you may be interested in" — Kevin's own words for these. */
const offer = (count: number): string =>
  count === 1
    ? 'here is a home you may be interested in'
    : `here are ${count} homes you may be interested in`;

const capitalised = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** "Hi Tammy and Matthew" — or just "Hi", with nobody named, for pasting anywhere. */
const hello = (names: string[]): string => {
  const greeting = greetingFor(names);
  return greeting ? `Hi ${greeting}` : 'Hi';
};

const closing = (count: number): string =>
  count === 1
    ? 'Let me know if you would like to see it.'
    : 'Let me know if you would like to see any of them.';

/** A one-home subject names the home, which is what makes it worth opening. */
export const subjectFor = (homes: EmailListing[]): string =>
  homes.length === 1
    ? `A home you may be interested in: ${[homes[0].address, homes[0].town].filter(Boolean).join(', ')}`
    : `${homes.length} homes you may be interested in`;

/* -------------------------------------------------------------------------- */
/* The text message                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Plain text and a full https:// link per home, with no tracking on it: a text
 * is read on a phone, and every character of it is visible.
 */
export const renderText = (names: string[], note: string | null, homes: EmailListing[]): string => {
  const lines: string[] = [`${hello(names)}, ${offer(homes.length)}:`];
  if (note) lines.push('', note);

  for (const home of homes) {
    const unavailable = availabilityNote(home.status);
    lines.push(
      '',
      listingAddressLine(home),
      `${listingFactsLine(home)}${unavailable ? ` · ${unavailable}` : ''}`,
      `MLS ${home.mls_number}${home.office_name ? ` · Listed by ${home.office_name}` : ''}`,
      listingUrl(home)
    );
  }

  lines.push('', closing(homes.length), '', `${AGENT.name}, ${AGENT.brokerage}`, AGENT.phone);
  return lines.join('\n');
};

/* -------------------------------------------------------------------------- */
/* The email                                                                   */
/* -------------------------------------------------------------------------- */

const P = 'font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;';

export const renderHtml = (names: string[], note: string | null, homes: EmailListing[]): string => {
  const cards = homes
    .map(
      (home) =>
        `<tr><td style="padding:0 0 22px 0;">${listingCardHtml(home, {
          source: SOURCE,
          cta: 'View this home',
        })}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${homes.length === 1 ? 'A home' : 'Homes'} you may be interested in</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border:1px solid #2d2d2d;background-color:#ffffff;">
        <tr><td style="padding:40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:0 0 26px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:#1a1a1a;text-align:center;">
              ${homes.length === 1 ? 'A home' : 'Homes'} you may be interested in
            </td></tr>
            <tr><td style="padding:0 0 22px 0;${P}">
              ${escapeHtml(hello(names))},<br /><br />
              ${escapeHtml(capitalised(offer(homes.length)))}. ${
                homes.length === 1 ? 'It links' : 'Each one links'
              } to its page on my site, with every photo and all the details.
            </td></tr>
            ${note ? `<tr><td style="padding:0 0 22px 0;${P}">${escapeHtml(note)}</td></tr>` : ''}
            ${cards}
            <tr><td style="padding:0 0 22px 0;${P}">
              ${escapeHtml(closing(homes.length))} Reply to this email or text me and I will set it up.
            </td></tr>
            <tr><td style="padding:22px 0 0 0;border-top:1px solid #eeeeee;${P}">
              <strong style="font-weight:600;">${escapeHtml(AGENT.name)}</strong><br />
              ${escapeHtml(AGENT.brokerage)}<br />
              <a href="tel:+18606822251" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(AGENT.phone)}</a>
              &nbsp;·&nbsp;
              <a href="mailto:${escapeHtml(AGENT.email)}" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(AGENT.email)}</a>
            </td></tr>
            <tr><td style="padding:18px 0 0 0;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#888888;">
              If you would rather not get listings from me, reply and tell me and I will stop.
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
/* What the row holds                                                          */
/* -------------------------------------------------------------------------- */

export interface StoredPerson {
  name: string;
  email: string | null;
}

/** `clients` is jsonb, so it arrives untyped. The trigger guarantees its shape. */
export const peopleOf = (raw: unknown): StoredPerson[] =>
  (Array.isArray(raw) ? raw : []).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const { name, email } = entry as Record<string, unknown>;
    if (typeof name !== 'string' || !name.trim()) return [];
    return [
      { name: name.trim(), email: typeof email === 'string' && email.trim() ? email.trim() : null },
    ];
  });

/** Each home's number, in Kevin's order, once each. Anything else is not a home. */
export const numbersOf = (raw: unknown): string[] => [
  ...new Set(
    (Array.isArray(raw) ? raw : []).flatMap((entry) => {
      const mls = (entry as { mlsNumber?: unknown } | null)?.mlsNumber;
      return typeof mls === 'string' && /^\d{5,12}$/.test(mls) ? [mls] : [];
    })
  ),
];

/** The address saved for a number, for naming a home that has left the feed. */
export const savedAddress = (raw: unknown, mls: string): string => {
  const home = (Array.isArray(raw) ? raw : []).find(
    (entry) => (entry as { mlsNumber?: unknown } | null)?.mlsNumber === mls
  ) as { address?: unknown } | undefined;
  return typeof home?.address === 'string' && home.address.trim() ? home.address.trim() : `MLS ${mls}`;
};

/** What the page tells Kevin about homes the message could not include. */
export const leftOutNotice = (addresses: string[]): string | null => {
  if (addresses.length === 0) return null;
  const list =
    addresses.length === 1
      ? addresses[0]
      : `${addresses.slice(0, -1).join(', ')} and ${addresses[addresses.length - 1]}`;
  return `${list} ${addresses.length === 1 ? 'is' : 'are'} no longer in the MLS feed, so ${
    addresses.length === 1 ? 'it is' : 'they are'
  } not in this message.`;
};
