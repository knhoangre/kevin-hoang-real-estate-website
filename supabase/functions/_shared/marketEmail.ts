/**
 * The monthly market report by email: who may sign up for what, and what the
 * confirmation and the monthly email say.
 *
 * Pure, so `node scripts/market-email-check.ts` runs it. The market-email and
 * market-unsubscribe functions do the network half; scripts/sync-market.ts
 * writes the public/data/market-latest.json this reads.
 *
 * THE FIRST SEND WAITS FOR A MAILING ADDRESS (Kevin's choice, 2026-11-06). This
 * is marketing email, and CAN-SPAM requires a valid physical postal address in
 * every one. The site deliberately publishes no street address (see SITE.address:
 * LPT Realty has no local office, and Google treats a virtual office as a fake
 * one), so until Kevin chooses one, LPT's or a PO box, MAILING_ADDRESS is
 * empty and `run` sends nothing. Sign-ups and confirmations work meanwhile. The
 * address appears in the email footer only, never on the site or Google.
 */
import { SITE_ORIGIN, escapeHtml } from './listingEmail.ts';
import { SIGNATURE_STYLE, signatureHtml, signatureText } from './emailSignature.ts';

/** CAN-SPAM's postal address. Empty holds every monthly send. */
export const MAILING_ADDRESS = '';

/**
 * At most this many monthly emails a day. Resend's free plan allows 100 a day,
 * shared with every other email the site sends (contact forms, invites, the
 * showing reminders), so a long list goes out over several days instead.
 */
export const DAILY_BATCH = 60;

/** A confirmation to the same address at most this often. */
export const CONFIRM_GAP_MS = 10 * 60 * 1000;

/** And at most this many confirmations an hour in all, whoever asks. */
export const CONFIRMS_PER_HOUR = 30;

/**
 * The towns with a report, slug to name. A deliberate mirror of SITE.marketTowns
 * with the slugs from SITE.areaServed: an edge function cannot import the site's
 * config. The check script compares the two.
 */
export const MARKET_TOWNS: Record<string, string> = {
  'newton-ma': 'Newton',
  'needham-ma': 'Needham',
  'wellesley-ma': 'Wellesley',
  'waltham-ma': 'Waltham',
  'brookline-ma': 'Brookline',
  'weston-ma': 'Weston',
  'lexington-ma': 'Lexington',
  'belmont-ma': 'Belmont',
  'winchester-ma': 'Winchester',
  'concord-ma': 'Concord',
  'cambridge-ma': 'Cambridge',
  'somerville-ma': 'Somerville',
  'medford-ma': 'Medford',
  'malden-ma': 'Malden',
  'quincy-ma': 'Quincy',
  'braintree-ma': 'Braintree',
};

/* -------------------------------------------------------------------------- */
/* The public data                                                             */
/* -------------------------------------------------------------------------- */

/** One town's latest report, as sync-market writes it into the public JSON. */
export interface MarketLatestTown {
  town: string;
  slug: string;
  month: string;
  /** The monthly post if there is one, else the town page. */
  path: string;
  /** The month's opening sentences, as the post says them. */
  summary: string;
  closingsFrom: string;
  closingsTo: string;
  types: {
    type: 'SF' | 'CC' | 'MF';
    label: string;
    median: number | null;
    ratio: number | null;
    /** Months the ratio is read over. */
    window: number | null;
    monthsSupply: number | null;
  }[];
}

export interface MarketLatest {
  month: string;
  asOf: string;
  towns: MarketLatestTown[];
}

/* -------------------------------------------------------------------------- */
/* Signing up                                                                  */
/* -------------------------------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A sign-up, or why it is not one. `bot` is the hidden field filled in, which
 * the function answers as if it had worked.
 */
export const readSignup = (
  body: unknown
):
  | { ok: true; email: string; towns: string[]; source: string | null }
  | { ok: false; error: string }
  | { ok: false; bot: true } => {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (typeof b.website === 'string' && b.website.trim()) return { ok: false, bot: true };
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase().slice(0, 200) : '';
  if (!EMAIL.test(email)) return { ok: false, error: 'Please give a complete email address.' };
  const towns = [...new Set(Array.isArray(b.towns) ? b.towns.filter((t): t is string => typeof t === 'string') : [])]
    .filter((t) => t in MARKET_TOWNS)
    .sort((a, z) => Object.keys(MARKET_TOWNS).indexOf(a) - Object.keys(MARKET_TOWNS).indexOf(z));
  if (towns.length === 0) return { ok: false, error: 'Please choose at least one town.' };
  const source = typeof b.source === 'string' && b.source.startsWith('/') ? b.source.slice(0, 200) : null;
  return { ok: true, email, towns, source };
};

/** A token as the links carry it. Anything else is not looked up. */
export const isToken = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Who gets the next monthly email: confirmed, still subscribed, not sent this month. */
export const dueFor = <S extends { id: string; confirmed_at: string | null; unsubscribed_at: string | null }>(
  subscribers: S[],
  sentIds: Set<string>,
  limit = DAILY_BATCH
): S[] =>
  subscribers
    .filter((s) => s.confirmed_at && !s.unsubscribed_at && !sentIds.has(s.id))
    .sort((a, z) => (a.confirmed_at as string).localeCompare(z.confirmed_at as string))
    .slice(0, limit);

/* -------------------------------------------------------------------------- */
/* Words                                                                       */
/* -------------------------------------------------------------------------- */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthName = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const dateLong = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

/** "Newton", "Newton and Needham", "Newton, Needham and Wellesley", "Newton and 3 more towns". */
export const townList = (names: string[]): string => {
  if (names.length <= 1) return names.join('');
  if (names.length > 3) return `${names[0]} and ${names.length - 1} more towns`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

const money = (n: number | null) =>
  n === null ? '—' : `$${(n >= 100_000 ? Math.round(n / 1000) * 1000 : Math.round(n)).toLocaleString('en-US')}`;
const ratioPct = (x: number | null) => (x === null ? '—' : `${(x * 100).toFixed(1)}%`);
const months1 = (x: number | null) => (x === null ? '—' : x.toFixed(1));

export const confirmUrl = (token: string) => `${SITE_ORIGIN}/market-email?confirm=${token}`;
export const unsubscribeUrl = (token: string) => `${SITE_ORIGIN}/market-email?unsubscribe=${token}`;

const link = (path: string) => `${SITE_ORIGIN}${path}?utm_source=market-email&utm_medium=email`;

const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";

const page = (inner: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${SIGNATURE_STYLE}</style></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:${SANS};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;"><tr><td style="padding:28px;">${inner}</td></tr></table>
</td></tr></table></body></html>`;

const p = (text: string, style = '') =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1a1a1a;${style}">${escapeHtml(text)}</p>`;

const button = (href: string, text: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td style="background:#0d0d0f;border-radius:999px;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(text)}</a></td></tr></table>`;

/** The double opt-in: nothing is sent monthly until this is pressed. */
export const confirmationEmail = (token: string, towns: string[]) => {
  const names = townList(towns.map((t) => MARKET_TOWNS[t] ?? t));
  const lines = [
    `Somebody, hopefully you, asked for Kevin Hoang's monthly market report for ${names} at kevinhoang.co.`,
    'Press the button to confirm, and the report will arrive once a month, a few days after the 3rd, when the numbers are recalculated.',
    'If you did not ask for it, ignore this email: nothing more will be sent.',
  ];
  return {
    subject: 'Confirm your monthly market report',
    html: page(
      `${p(lines[0])}${p(lines[1])}${button(confirmUrl(token), 'Confirm my subscription')}${p(lines[2], 'color:#666;font-size:13px;')}${signatureHtml()}`
    ),
    text: `${lines[0]}\n\n${lines[1]}\n\nConfirm: ${confirmUrl(token)}\n\n${lines[2]}\n\n${signatureText()}`,
  };
};

/**
 * The monthly email for one subscriber, from the towns they follow that have a
 * report. Null when none do, or when no mailing address is set yet.
 */
export const monthlyEmail = (latest: MarketLatest, towns: string[], token: string, address = MAILING_ADDRESS) => {
  if (!address.trim()) return null;
  // Only towns whose latest report is the month being sent: a town whose run
  // failed on the 3rd still has last month's, which is not this email's news.
  const mine = towns
    .map((slug) => latest.towns.find((t) => t.slug === slug && t.month === latest.month))
    .filter((t): t is MarketLatestTown => Boolean(t));
  if (mine.length === 0) return null;
  const month = monthName(latest.month);
  const closingsFrom = mine.map((t) => t.closingsFrom).sort()[0];
  const closingsTo = mine.map((t) => t.closingsTo).sort().reverse()[0];

  const townHtml = mine
    .map((t) => {
      const rows = t.types
        .map(
          (x) =>
            `<tr><td style="padding:6px 12px 6px 0;font-size:14px;color:#1a1a1a;">${escapeHtml(x.label)}</td><td style="padding:6px 12px;font-size:14px;color:#1a1a1a;text-align:right;">${money(x.median)}</td><td style="padding:6px 12px;font-size:14px;color:#1a1a1a;text-align:right;">${ratioPct(x.ratio)}</td><td style="padding:6px 0 6px 12px;font-size:14px;color:#1a1a1a;text-align:right;">${months1(x.monthsSupply)}</td></tr>`
        )
        .join('');
      return `<h2 style="margin:28px 0 8px;font-size:20px;color:#1a1a1a;">${escapeHtml(t.town)}</h2>
${p(t.summary)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 12px;">
<tr><td style="padding:0 12px 4px 0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;"></td><td style="padding:0 12px 4px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;text-align:right;">Median, 12 mo</td><td style="padding:0 12px 4px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;text-align:right;">Sale-to-asking</td><td style="padding:0 0 4px 12px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;text-align:right;">Months of supply</td></tr>
${rows}</table>
<p style="margin:0 0 8px;font-size:14px;"><a href="${escapeHtml(link(t.path))}" style="color:#8c6b35;font-weight:600;">Read the full ${escapeHtml(t.town)} report</a></p>`;
    })
    .join('');

  const source = `Based on information from MLS Property Information Network, Inc. (MLS PIN) for closings from ${dateLong(closingsFrom)} through ${dateLong(closingsTo)}. The figures are calculated by Kevin Hoang, LPT Realty, not by MLS PIN, and are believed accurate but not guaranteed.`;
  const why = 'You are receiving this because you signed up for the monthly market report at kevinhoang.co.';

  const html = page(
    `<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8c6b35;">Monthly market report</p>
<h1 style="margin:0 0 16px;font-size:24px;color:#1a1a1a;">${escapeHtml(`${month}: ${townList(mine.map((t) => t.town))}`)}</h1>
${p(`What sold in ${month}, what it sold for against the asking price, and how much is for sale now.`)}
${townHtml}
<p style="margin:24px 0 24px;font-size:14px;"><a href="${escapeHtml(link('/market'))}" style="color:#8c6b35;font-weight:600;">Every town Kevin reports on</a></p>
${p(source, 'color:#666;font-size:12px;')}
${signatureHtml()}
<p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#666;">${escapeHtml(why)} <a href="${escapeHtml(unsubscribeUrl(token))}" style="color:#666;">Unsubscribe</a>.<br>${escapeHtml(`Kevin Hoang, LPT Realty · ${address}`)}</p>`
  );

  const text = [
    `Monthly market report: ${month}`,
    ...mine.map(
      (t) =>
        `${t.town}\n${t.summary}\n${t.types
          .map((x) => `${x.label}: median ${money(x.median)} (12 months), sale-to-asking ${ratioPct(x.ratio)}, ${months1(x.monthsSupply)} months of supply`)
          .join('\n')}\nRead the full report: ${link(t.path)}`
    ),
    `Every town: ${link('/market')}`,
    source,
    signatureText(),
    `${why} Unsubscribe: ${unsubscribeUrl(token)}\nKevin Hoang, LPT Realty · ${address}`,
  ].join('\n\n');

  return {
    subject: `${month} market report: ${townList(mine.map((t) => t.town))}`,
    html,
    text,
    month: latest.month,
  };
};

/**
 * RFC 8058 one-click unsubscribe. A mail client POSTs to this address with no
 * key, which is why market-unsubscribe is its own function with verify_jwt off;
 * opened in a browser instead, it forwards to the page with the button.
 */
export const listUnsubscribeHeaders = (functionsUrl: string, token: string) => ({
  'List-Unsubscribe': `<${functionsUrl}/market-unsubscribe?token=${token}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
});
