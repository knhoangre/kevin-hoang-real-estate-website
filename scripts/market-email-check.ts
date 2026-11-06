/**
 * Assertions for the monthly market report by email: who can sign up for what,
 * who is due an email, and what the email says, including over the real
 * public/data/market-latest.json the sync last wrote.
 *
 *   node scripts/market-email-check.ts
 *
 * Runs the edge functions' own module (Node 23+ type stripping).
 */
import { readFileSync } from 'node:fs';
import { SITE } from '../src/lib/siteConfig.ts';
import {
  DAILY_BATCH,
  MAILING_ADDRESS,
  MARKET_TOWNS,
  confirmationEmail,
  dueFor,
  isToken,
  listUnsubscribeHeaders,
  monthlyEmail,
  readSignup,
  townList,
  type MarketLatest,
} from '../supabase/functions/_shared/marketEmail.ts';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures += 1;
};

console.log('--- the towns ---');
const fromSite = Object.fromEntries(
  SITE.marketTowns.map((name) => [SITE.areaServed.find((t) => t.name === name)?.slug, name])
);
ok(JSON.stringify(MARKET_TOWNS) === JSON.stringify(fromSite), 'MARKET_TOWNS mirrors SITE.marketTowns, slug for slug, in order');

console.log('--- signing up ---');
const signup = readSignup({ email: ' Sam@Example.COM ', towns: ['needham-ma', 'newton-ma', 'newton-ma', 'dover-ma', 7], source: '/market' });
ok(signup.ok && signup.email === 'sam@example.com', 'the address is trimmed and lower-cased');
ok(signup.ok && JSON.stringify(signup.towns) === '["newton-ma","needham-ma"]', 'towns are de-duplicated, unknown ones dropped, in report order');
ok(!readSignup({ email: 'sam@', towns: ['newton-ma'] }).ok, 'an incomplete address is refused');
ok(!readSignup({ email: 'sam@example.com', towns: ['dover-ma'] }).ok, 'a town with no report is no town');
const bot = readSignup({ email: 'sam@example.com', towns: ['newton-ma'], website: 'x' });
ok(!bot.ok && 'bot' in bot, 'the hidden field marks a bot');
ok(signup.ok && signup.source === '/market', 'the page it came from is kept');
const offsite = readSignup({ email: 'sam@example.com', towns: ['newton-ma'], source: 'https://evil.example' });
ok(offsite.ok && offsite.source === null, 'a source that is not a path on this site is dropped');
ok(isToken('3f2b8c1e-5a6d-4e7f-9a0b-1c2d3e4f5a6b') && !isToken('3f2b8c1e') && !isToken(null), 'a token is a whole UUID');

console.log('--- who is due ---');
const subs = [
  { id: 'a', confirmed_at: '2026-10-05T00:00:00Z', unsubscribed_at: null },
  { id: 'b', confirmed_at: null, unsubscribed_at: null },
  { id: 'c', confirmed_at: '2026-10-01T00:00:00Z', unsubscribed_at: '2026-10-20T00:00:00Z' },
  { id: 'd', confirmed_at: '2026-09-01T00:00:00Z', unsubscribed_at: null },
  { id: 'e', confirmed_at: '2026-08-01T00:00:00Z', unsubscribed_at: null },
];
ok(JSON.stringify(dueFor(subs, new Set(['e'])).map((s) => s.id)) === '["d","a"]',
  'confirmed, still subscribed and not yet sent this month, oldest first');
const many = Array.from({ length: 150 }, (_, i) => ({ id: String(i), confirmed_at: `2026-01-01T00:00:${String(i % 60).padStart(2, '0')}Z`, unsubscribed_at: null }));
ok(dueFor(many, new Set()).length === DAILY_BATCH && DAILY_BATCH <= 70, `at most ${DAILY_BATCH} a day, leaving Resend's 100 room for everything else`);

console.log('--- what the emails say ---');
const latest: MarketLatest = JSON.parse(readFileSync('public/data/market-latest.json', 'utf8'));
ok(latest.towns.length === SITE.marketTowns.length, `the public file has every reported town (${latest.towns.length})`);
const token = '3f2b8c1e-5a6d-4e7f-9a0b-1c2d3e4f5a6b';
ok(MAILING_ADDRESS === '' ? monthlyEmail(latest, ['newton-ma'], token) === null : true,
  'with no mailing address, there is no monthly email to send');
const address = 'Test Address, Newton, MA';
const mail = monthlyEmail(latest, ['newton-ma', 'needham-ma'], token, address);
ok(mail !== null, 'with one, there is');
if (mail) {
  ok(mail.subject.includes('Newton and Needham'), `the subject names the towns: "${mail.subject}"`);
  ok(mail.html.includes(`market-email?unsubscribe=${token}`) && mail.text.includes(`market-email?unsubscribe=${token}`), 'both parts carry the unsubscribe link');
  ok(mail.html.includes(address) && mail.text.includes(address), 'both parts carry the mailing address');
  ok(mail.html.includes('LPT Realty') && mail.text.includes('LPT Realty'), 'and the brokerage');
  ok(mail.html.includes('MLS Property Information Network') && mail.text.includes('not by MLS PIN'), 'and the MLS PIN attribution');
  ok(mail.html.includes('utm_source=market-email'), 'links say where the visit came from');
}
ok(monthlyEmail(latest, ['dover-ma'], token, address) === null, 'nothing to send for towns without a report');
const stale: MarketLatest = { ...latest, towns: latest.towns.map((t) => (t.slug === 'needham-ma' ? { ...t, month: '2000-01' } : t)) };
const partial = monthlyEmail(stale, ['newton-ma', 'needham-ma'], token, address);
ok(partial !== null && !partial.html.includes('Needham'), 'a town still on an older month is left out of this month\'s email');
let clean = true;
for (const t of latest.towns) {
  const m = monthlyEmail(latest, [t.slug], token, address);
  if (!m || /undefined|NaN|\[object/.test(m.html + m.text + m.subject)) {
    clean = false;
    console.log(`     ${t.town}: ${m ? 'a blank in the email' : 'no email'}`);
  }
}
ok(clean, 'every town\'s email reads cleanly: no undefined, NaN or blanks');
const injected: MarketLatest = { ...latest, towns: [{ ...latest.towns[0], summary: '<script>x</script>' }] };
const escaped = monthlyEmail(injected, [latest.towns[0].slug], token, address);
ok(escaped !== null && !escaped.html.includes('<script>'), 'what goes into the HTML is escaped');
const confirm = confirmationEmail(token, ['newton-ma', 'needham-ma', 'wellesley-ma', 'brookline-ma']);
ok(confirm.html.includes(`market-email?confirm=${token}`) && confirm.text.includes(`market-email?confirm=${token}`), 'the confirmation carries its link');
ok(confirm.text.includes('Newton and 3 more towns'), 'and says what was asked for');
ok(townList(['Newton']) === 'Newton' && townList(['Newton', 'Needham', 'Wellesley']) === 'Newton, Needham and Wellesley', 'town lists read as English');
const headers = listUnsubscribeHeaders('https://x.supabase.co/functions/v1', token);
ok(headers['List-Unsubscribe'] === `<https://x.supabase.co/functions/v1/market-unsubscribe?token=${token}>`
  && headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click', 'one-click unsubscribe points at the function that takes no key');

console.log(failures ? `\n${failures} assertion(s) failed.` : '\nAll assertions passed.');
process.exit(failures ? 1 : 0);
