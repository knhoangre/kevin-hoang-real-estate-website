/**
 * Assertions for the home valuation request: what the form must send, how the
 * person is filed in the CRM, and that what a stranger types cannot become HTML
 * in Kevin's inbox.
 *
 *   node scripts/valuation-request-check.ts
 *
 * Runs the edge function's own module (Node 23+ type stripping).
 */
import { readFileSync } from 'node:fs';
import {
  TIMINGS,
  addressLine,
  confirmationEmail,
  kevinEmail,
  messageText,
  readRequest,
  sourceLabel,
  type ValuationRequest,
} from '../supabase/functions/_shared/valuationRequest.ts';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures += 1;
};

const base = {
  street: '12 Elm St',
  unit: '',
  town: 'Needham',
  zip: '02492',
  firstName: 'Sam',
  lastName: 'Lee',
  email: 'Sam@Example.com ',
  phone: '',
  timing: '0-3',
  notes: '',
};
const accepted = (body: Record<string, unknown>): ValuationRequest => {
  const r = readRequest(body);
  if (!r.ok) throw new Error(`refused: ${JSON.stringify(r)}`);
  return r.request;
};
const refusal = (body: Record<string, unknown>) => {
  const r = readRequest(body);
  return r.ok ? null : 'error' in r ? r.error : 'bot';
};

console.log('--- what a request must carry ---');
const r = accepted(base);
ok(r.email === 'sam@example.com', 'the email is trimmed and lower-cased');
ok(refusal({ ...base, town: '' }) !== null, 'no town is refused');
ok(refusal({ ...base, street: ' ' }) !== null, 'no street is refused');
ok(refusal({ ...base, lastName: '' }) !== null, 'a first name alone is refused: the CRM files nobody without both');
ok(refusal({ ...base, email: '' }) !== null, 'no email and no phone is refused');
ok(refusal({ ...base, email: '', phone: '617-555-0123' }) === null, 'a phone alone is enough');
ok(refusal({ ...base, email: 'sam@' }) !== null, 'an incomplete email is refused');
ok(refusal({ ...base, phone: '555-0123' }) !== null, 'a seven-digit phone is refused, not stored');
ok(accepted({ ...base, phone: '+1 (203) 379-8682' }).phone === '203-379-8682', 'a pasted +1 number keeps its own ten digits');
ok(refusal({ ...base, website: 'http://spam.example' }) === 'bot', 'the hidden field marks a bot');
ok(accepted({ ...base, timing: 'tomorrow' }).timing === null, 'an unknown timing is dropped');
ok(accepted({ ...base, notes: 'x'.repeat(10_000) }).notes.length === 4000, 'notes are capped');
ok(refusal({} as Record<string, unknown>) !== null && refusal(null as unknown as Record<string, unknown>) !== null, 'an empty body is refused');

console.log('--- how it reads ---');
ok(addressLine(r) === '12 Elm St, Needham, MA 02492', 'the address line');
ok(addressLine(accepted({ ...base, unit: '#3' })) === '12 Elm St Unit 3, Needham, MA 02492', 'a unit written "#3" reads Unit 3');
ok(addressLine(accepted({ ...base, zip: '' })) === '12 Elm St, Needham, MA', 'no ZIP, no trailing space');
ok(sourceLabel(r) === 'Home Valuation Request & 12 Elm St, Needham', 'the CRM source follows "Open House & <address>"');
ok(messageText(r).startsWith('Home valuation request for '), 'the stored message starts the way the function counts them');
ok(messageText(r).includes('Within 3 months'), 'the timing is in the message');

console.log('--- what a stranger types stays text ---');
const nasty = accepted({ ...base, firstName: '<b>Sam</b>', notes: '<script>alert(1)</script>\nsecond line', street: '12 "Elm" St' });
const k = kevinEmail(nasty);
ok(!k.html.includes('<script>') && k.html.includes('&lt;script&gt;'), 'notes are escaped in the email to Kevin');
ok(!k.html.includes('<b>Sam</b>'), 'a name is escaped');
ok(!k.html.includes('"Elm"'), 'quotes are escaped');
ok(k.html.includes('second line') && k.html.includes('<br>'), 'line breaks in the notes survive as <br>');
const c = confirmationEmail(nasty);
ok(!c.html.includes('<b>Sam</b>'), 'the confirmation escapes the name too');
ok(c.html.includes('LPT Realty') && c.text.includes('LPT Realty'), 'the confirmation carries the brokerage (254 CMR 3.00)');
ok(k.subject === 'Home valuation request: 12 "Elm" St, Needham, MA 02492', 'the subject names the property');

console.log('--- the page and the function offer the same timings ---');
const page = readFileSync('src/lib/submitContact.ts', 'utf8');
const pageTimings = [...page.matchAll(/\{ value: '([^']+)', label: '([^']+)' \}/g)].map((m) => [m[1], m[2]]);
ok(
  JSON.stringify(pageTimings) === JSON.stringify(Object.entries(TIMINGS)),
  `VALUATION_TIMINGS in submitContact.ts matches TIMINGS (${pageTimings.length} entries)`
);

console.log(failures ? `\n${failures} assertion(s) failed.` : '\nAll assertions passed.');
process.exit(failures ? 1 : 0);
