/**
 * Assertions for Send listings: what the text and the email say about a home, and
 * what the page does with whatever gets pasted into its field.
 *
 *   node scripts/send-listings-check.ts
 *
 * Node runs the TypeScript directly (type stripping, Node 23+), so this imports
 * the modules the page and the edge function run rather than copies of them.
 */
import {
  availabilityNote,
  leftOutNotice,
  numbersOf,
  peopleOf,
  renderHtml,
  renderText,
  savedAddress,
  subjectFor,
} from '../supabase/functions/_shared/listingSend.ts';
import type { EmailListing } from '../supabase/functions/_shared/listingEmail.ts';
import {
  MAX_HOMES,
  NOT_AVAILABLE,
  draftKey,
  draftProblem,
  feedIsStale,
  homesFrom,
  homesSummary,
  mlsNumbersIn,
  withHomes,
  type SendHome,
} from '../src/lib/listingSend.ts';

let failures = 0;
const is = (actual: unknown, expected: unknown, label: string) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`ok   ${label}`);
  } else {
    console.error(`FAIL ${label} (got ${a}, expected ${e})`);
    failures += 1;
  }
};
const has = (text: string, part: string, label: string) => is(text.includes(part), true, label);
const lacks = (text: string, part: string, label: string) => is(text.includes(part), false, label);

const home = (over: Partial<EmailListing> = {}): EmailListing => ({
  mls_number: '73568135',
  address: '170 Gore St Unit 417',
  town: 'Cambridge',
  state: 'MA',
  zip: '02141',
  status: 'ACT',
  prop_type: 'CC',
  list_price: 799000,
  bedrooms: 2,
  full_baths: 1,
  half_baths: 0,
  living_area: 900,
  photo_count: 12,
  office_name: 'Compass',
  ...over,
});

/* ---- The text ----------------------------------------------------------- */

const one = renderText(['Tammy Nguyen'], null, [home()]);
is(
  one.split('\n'),
  [
    'Hi Tammy, here is a home you may be interested in:',
    '',
    '170 Gore St Unit 417, Cambridge, MA 02141',
    '$799,000 · 2 bed · 1 full bath · 900 sq ft',
    'MLS 73568135 · Listed by Compass',
    'https://www.kevinhoang.co/search/170-Gore-St-Unit-417-Cambridge-MA-02141-73568135',
    '',
    'Let me know if you would like to see it.',
    '',
    'Kevin Hoang, LPT Realty',
    '(860) 682-2251',
  ],
  'one home, one person: the whole text, address, number and link'
);
lacks(one, 'utm_', 'a text carries no tracking, since every character is on screen');

const two = renderText(
  ['Tammy Nguyen', 'Matthew Nguyen'],
  'These just came on.',
  [home(), home({ mls_number: '73111111', address: '9 Oak Ave', town: 'Newton', zip: '02458' })]
);
has(two, 'Hi Tammy and Matthew, here are 2 homes you may be interested in:\n\nThese just came on.', 'a couple is greeted by first names, the note under it');
is(two.indexOf('170 Gore St') < two.indexOf('9 Oak Ave'), true, 'the homes stay in the order Kevin added them');
has(two, 'Let me know if you would like to see any of them.', 'the closing counts the homes');

is(
  renderText([], null, [home()]).split('\n')[0],
  'Hi, here is a home you may be interested in:',
  'with nobody on it the text still opens properly, for pasting into a chat'
);

const rental = renderText(['Sam Lee'], null, [home({ prop_type: 'RN', list_price: 3200 })]);
has(rental, '$3,200/mo', 'a rental reads as a monthly rent');

const noOffice = renderText(['Sam Lee'], null, [home({ office_name: null })]);
has(noOffice, '\nMLS 73568135\n', 'an unknown office is left out, not printed blank');

const sparse = renderText(['Sam Lee'], null, [
  home({ bedrooms: null, full_baths: null, living_area: null, list_price: null }),
]);
has(sparse, '\nPrice on request\n', 'what the feed does not have is left out');

/* ---- A home that cannot be walked into ----------------------------------- */

is(availabilityNote('ACT'), null, 'an active listing says nothing extra');
is(availabilityNote('PCG'), null, 'nor does a price change');
is(availabilityNote('uag '), 'Under agreement', 'under agreement is said');
is(availabilityNote('CTG'), 'Contingent', 'contingent is said');
is(availabilityNote('SLD'), 'Sold', 'sold is said');
is(availabilityNote('RNT'), 'Rented', 'rented is said');
is(availabilityNote(null), null, 'no status says nothing');
has(
  renderText(['Sam Lee'], null, [home({ status: 'UAG' })]),
  '900 sq ft · Under agreement',
  'the text says so beside the facts'
);
is(
  ['CTG', 'UAG', 'SLD', 'RNT', 'ACT', 'NEW'].every(
    (code) => NOT_AVAILABLE.has(code) === (availabilityNote(code) !== null)
  ),
  true,
  'the page and the function agree about which statuses those are'
);

/* ---- The subject and the email ------------------------------------------- */

is(
  subjectFor([home()]),
  'A home you may be interested in: 170 Gore St Unit 417, Cambridge',
  'a one-home subject names the home'
);
is(subjectFor([home(), home()]), '2 homes you may be interested in', 'several are counted');

const email = renderHtml(['Tammy Nguyen'], 'Near <the> park & school', [home()]);
has(email, 'Hi Tammy,', 'the email greets by first name');
has(email, 'Near &lt;the&gt; park &amp; school', 'the note is escaped');
lacks(email, 'Near <the>', 'and not interpolated raw');
has(email, 'utm_source=send-listings', 'the email is tracked, so GA4 can count who came back');
has(email, 'Listing courtesy of Compass', 'the card names the listing office');
has(email, 'LPT Realty', 'the brokerage is named, as 254 CMR 3.00 asks');
has(email, 'Here is a home you may be interested in.', 'the sentence starts with a capital');
has(email, 'If you would rather not get listings from me', 'there is a way to say stop');
has(renderHtml([], null, [home(), home()]), 'Hi,<br />', 'nobody named in an email still reads properly');

/* ---- What a stored row holds --------------------------------------------- */

is(
  numbersOf([{ mlsNumber: '73568135' }, { mlsNumber: 'x' }, null, { mlsNumber: '73568135' }, { mlsNumber: '73111111' }]),
  ['73568135', '73111111'],
  'only real numbers, once each, in order'
);
is(numbersOf({ mlsNumber: '73568135' }), [], 'a row that is not a list gives nothing rather than throwing');
is(
  peopleOf([{ name: ' Sam ', email: ' ' }, { name: '' }, 'x']),
  [{ name: 'Sam', email: null }],
  'people are read defensively'
);
is(savedAddress([{ mlsNumber: '1', address: '12 Elm St' }], '1'), '12 Elm St', 'the saved address names a home');
is(savedAddress([], '73568135'), 'MLS 73568135', 'or its number, when there is none');
is(leftOutNotice([]), null, 'nothing left out, nothing said');
is(
  leftOutNotice(['12 Elm St']),
  '12 Elm St is no longer in the MLS feed, so it is not in this message.',
  'one home left out'
);
is(
  leftOutNotice(['12 Elm St', '9 Oak Ave', '3 Pine Rd']),
  '12 Elm St, 9 Oak Ave and 3 Pine Rd are no longer in the MLS feed, so they are not in this message.',
  'several left out'
);

/* ---- What gets pasted ---------------------------------------------------- */

is(mlsNumbersIn('73568135'), ['73568135'], 'a number');
is(mlsNumbersIn('73568135, 73111111\n73222222\t73333333'), ['73568135', '73111111', '73222222', '73333333'], 'any separator');
is(mlsNumbersIn('73568135 73568135'), ['73568135'], 'the same number twice is one');
is(mlsNumbersIn('MLS# 73568135'), ['73568135'], 'copied out of an email');
is(
  mlsNumbersIn('https://www.kevinhoang.co/search/170-Gore-St-Unit-417-Cambridge-MA-02141-73568135?utm_source=email'),
  ['73568135'],
  "one of this site's own links gives its number, not its ZIP"
);
is(mlsNumbersIn('170 Gore St Unit 417, Cambridge, MA 02141'), [], 'an address has no number in it, so it is treated as typing');
is(mlsNumbersIn('860-682-2251'), [], 'a phone number with its dashes is not one');
is(mlsNumbersIn(''), [], 'nothing');

/* ---- Adding homes -------------------------------------------------------- */

const sendHome = (mlsNumber: string, address: string | null = '12 Elm St', town: string | null = 'Newton'): SendHome => ({
  mlsNumber,
  address,
  town,
  state: 'MA',
  zip: '02458',
  listPrice: 500000,
  status: 'ACT',
  propType: 'SF',
});

is(
  withHomes([sendHome('1')], [sendHome('1'), sendHome('2')]).homes.map((h) => h.mlsNumber),
  ['1', '2'],
  'a home already there is not added twice'
);
const full = Array.from({ length: MAX_HOMES }, (_, i) => sendHome(String(i)));
is(withHomes(full, [sendHome('new')]).dropped.map((h) => h.mlsNumber), ['new'], 'past the ceiling is reported, not silently lost');
is(homesSummary([sendHome('1')]), '12 Elm St, Newton', 'one home in the list of past messages');
is(homesSummary([sendHome('1'), sendHome('2'), sendHome('3')]), '12 Elm St, Newton and 2 more', 'several');
is(homesSummary([sendHome('1', null, null)]), 'MLS 1', 'a home with no address falls back to its number');

is(
  homesFrom([{ mlsNumber: '73568135', address: ' 12 Elm St ', listPrice: 500000 }, { address: 'no number' }, null, 'x']),
  [{ mlsNumber: '73568135', address: '12 Elm St', town: null, state: null, zip: null, listPrice: 500000, status: null, propType: null }],
  'a stored home is read defensively, and one with no number is not a home'
);
is(homesFrom({ mlsNumber: '1' }), [], 'a column that is not a list gives nothing rather than throwing');

/* ---- Whether the feed can be trusted ------------------------------------- */

const NOW = Date.parse('2026-10-30T22:00:00Z');
is(feedIsStale('2026-10-30T20:00:00Z', NOW), false, 'a feed that loaded two hours ago is fine');
is(feedIsStale('2026-10-19T12:50:00Z', NOW), true, 'a feed last good eleven days ago says so');

/* ---- Whether it can be saved, and whether it has changed ------------------ */

const person = (name: string, email = '', phone = '') => ({ id: 'a', name, email, phone });

is(draftProblem([], []), 'Add at least one home.', 'a home is the one thing required');
is(draftProblem([], [sendHome('1')]), null, 'nobody on it is fine');
is(draftProblem([person('')], [sendHome('1')]), null, 'nor does a blank row count as somebody');
is(draftProblem([person('', 'a@b.co')], [sendHome('1')]), 'Everyone on the message needs a name.', 'an address with no name');
is(draftProblem([person('Sam', 'not-an-email')], [sendHome('1')]), 'Check the email address for Sam.', 'a mistyped email is caught here, not by a bounced send');
is(draftProblem([person('Sam', 'sam@example.com')], [sendHome('1')]), null, 'a good one passes');

const key = draftKey([person('Sam', 'Sam@Example.com')], [sendHome('1')], 'Hello');
is(draftKey([person(' Sam ', ' sam@example.com ')], [sendHome('1')], ' Hello '), key, 'what the database tidies is not a change');
is(draftKey([person('Sam', 'sam@example.com'), { ...person(''), id: 'b' }], [sendHome('1')], 'Hello'), key, 'nor is a spare blank row');
is(draftKey([person('Sam', 'sam@example.com')], [sendHome('2')], 'Hello') === key, false, 'a different home is');
is(draftKey([person('Sam', 'sam@example.com')], [sendHome('1')], 'Hi') === key, false, 'and so is a different note');

if (failures > 0) {
  console.error(`\n${failures} failed`);
  process.exit(1);
}
console.log('\nAll passed.');
