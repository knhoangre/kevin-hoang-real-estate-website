/**
 * A request for a written home valuation, from the form on /home-valuation.
 *
 * Pure, so `node scripts/valuation-request-check.ts` runs it: what a request
 * must carry, how it is filed in the CRM, and what the two emails say. The
 * function in submit-valuation-request/ does the network half.
 *
 * Everything here reaches an HTML email, and everything here was typed by a
 * stranger, so every value is escaped where it is placed.
 */
import { escapeHtml } from './listingEmail.ts';
import { SIGNATURE_STYLE, signatureHtml, signatureText } from './emailSignature.ts';

/** Mirrors VALUATION_TIMINGS in src/lib/submitContact.ts; the check compares them. */
export const TIMINGS: Record<string, string> = {
  curious: 'Just curious about the value',
  '0-3': 'Within 3 months',
  '3-6': 'In 3 to 6 months',
  '6-12': 'In 6 to 12 months',
  later: 'More than a year away',
};

export interface ValuationRequest {
  street: string;
  unit: string;
  town: string;
  zip: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timing: string | null;
  notes: string;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const digits = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The request, or the reason it cannot be one. The same rules the form applies,
 * because a request can arrive without the form. `bot` is the hidden field
 * filled in: the caller answers as if it had worked and does nothing.
 */
export const readRequest = (
  body: unknown
): { ok: true; request: ValuationRequest } | { ok: false; error: string } | { ok: false; bot: true } => {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (str(b.website, 200)) return { ok: false, bot: true };
  const phoneDigits = digits(str(b.phone, 40));
  const r: ValuationRequest = {
    street: str(b.street, 200),
    unit: str(b.unit, 40),
    town: str(b.town, 80),
    zip: str(b.zip, 10),
    firstName: str(b.firstName, 80),
    lastName: str(b.lastName, 80),
    email: str(b.email, 200).toLowerCase(),
    phone: phoneDigits.length === 10 ? `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}` : '',
    timing: typeof b.timing === 'string' && b.timing in TIMINGS ? b.timing : null,
    notes: str(b.notes, 4000),
  };
  if (!r.street || !r.town) return { ok: false, error: 'The street address and the town are needed.' };
  if (!r.firstName || !r.lastName) return { ok: false, error: 'A first and last name are needed.' };
  if (r.email && !EMAIL.test(r.email)) return { ok: false, error: 'That email address does not look complete.' };
  if (str(b.phone, 40) && !r.phone) return { ok: false, error: 'The phone number needs ten digits.' };
  if (!r.email && !r.phone) return { ok: false, error: 'An email address or a phone number is needed.' };
  return { ok: true, request: r };
};

/** "12 Elm St Unit 3, Needham, MA 02492", leaving out what was not given. */
export const addressLine = (r: ValuationRequest): string => {
  const street = r.unit ? `${r.street} Unit ${r.unit.replace(/^(unit|#)\s*/i, '')}` : r.street;
  return `${street}, ${r.town}, MA${r.zip ? ` ${r.zip}` : ''}`;
};

/**
 * The CRM source, in the "<how> & <where>" form the open-house sign-ins use
 * ("Open House & 12 Elm St"). It records how somebody FIRST arrived and is
 * never overwritten for an existing contact.
 */
export const sourceLabel = (r: ValuationRequest): string => `Home Valuation Request & ${r.street}, ${r.town}`;

/** What is stored as the CRM message: everything, in plain lines. */
export const messageText = (r: ValuationRequest): string =>
  [
    `Home valuation request for ${addressLine(r)}`,
    r.timing ? `Selling: ${TIMINGS[r.timing]}` : null,
    r.notes ? `Notes: ${r.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

const rows = (pairs: [string, string][]) =>
  pairs
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:6px 0;color:#1a1a1a;font-size:15px;">${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`
    )
    .join('');

const page = (body: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${SIGNATURE_STYLE}</style></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;"><tr><td style="padding:28px;">${body}</td></tr></table>
</td></tr></table></body></html>`;

/** To Kevin. Reply goes to the person, when they gave an email. */
export const kevinEmail = (r: ValuationRequest) => {
  const pairs: [string, string][] = [
    ['Property', addressLine(r)],
    ['Name', `${r.firstName} ${r.lastName}`],
    ['Email', r.email],
    ['Phone', r.phone],
    ['Selling', r.timing ? TIMINGS[r.timing] : ''],
    ['Notes', r.notes],
  ];
  return {
    subject: `Home valuation request: ${addressLine(r)}`,
    html: page(
      `<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8c6b35;">From kevinhoang.co/home-valuation</p>
<h1 style="margin:0 0 20px;font-size:22px;color:#1a1a1a;">${escapeHtml(addressLine(r))}</h1>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">${rows(pairs)}</table>
<p style="margin:24px 0 0;font-size:13px;color:#666;">${escapeHtml(r.firstName)} is filed in the CRM with the source &ldquo;${escapeHtml(sourceLabel(r))}&rdquo;.${r.email ? ' Replying to this email reaches them.' : ''}</p>`
    ),
    text: [`Home valuation request from kevinhoang.co`, '', ...pairs.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join('\n'),
  };
};

/** To the person, so they know it arrived and what happens next. */
export const confirmationEmail = (r: ValuationRequest) => {
  const lines = [
    `Hi ${r.firstName},`,
    `Thank you for asking about ${addressLine(r)}. I have your request, and I will be in touch to ask anything the public record will not show and, if you would like, to arrange a short walkthrough. The written valuation comes with the comparable sales it was built from, and there is no obligation to list.`,
    'If you think of anything in the meantime, just reply to this email.',
  ];
  return {
    subject: 'Your home valuation request',
    html: page(
      `${lines.map((l) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1a1a1a;">${escapeHtml(l)}</p>`).join('')}
<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Kevin</p>
${signatureHtml()}`
    ),
    text: `${lines.join('\n\n')}\n\nKevin\n\n${signatureText()}`,
  };
};
