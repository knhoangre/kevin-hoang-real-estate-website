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
  renderEmailText,
  renderHtml,
  renderText,
  savedAddress,
  subjectFor,
} from '../supabase/functions/_shared/listingSend.ts';
import type { EmailListing } from '../supabase/functions/_shared/listingEmail.ts';
import {
  MAX_HOMES,
  NOT_AVAILABLE,
  NO_CLIENT,
  clientContact,
  clientName,
  clientsFrom,
  draftKey,
  draftProblem,
  feedIsStale,
  homesFrom,
  mlsNumbersIn,
  nextPeople,
  withHomes,
  type GroupableSend,
  type SendHome,
  type StoredPerson,
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
    'https://www.kevinhoang.co/search/170-Gore-St-Unit-417-Cambridge-MA-02141-73568135',
    '',
    'Let me know if you would like to see it.',
  ],
  'one home, one person: the whole text, address, number and link'
);
lacks(one, 'utm_', 'a text carries no tracking, since every character is on screen');
lacks(one, 'Listed by', 'a text does not name the listing office (Kevin, 2026-10-30)');
lacks(one, 'MLS ', 'or carry an MLS number line (the same day)');
lacks(one, 'LPT Realty', 'and has no signature, since it comes from his own phone');

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

const plain = renderEmailText(['Sam Lee'], null, [home()]);
has(plain, 'MLS 73568135 · Listing courtesy of Compass', "an email's plain-text part keeps the office, like its card");
has(plain, 'Cheers,\nKevin Hoang\nRealtor®, LPT Realty\n(860) 682-2251', 'and the signature');
has(plain, 'utm_source=send-listings', 'and is tracked like the HTML');
has(
  renderEmailText(['Sam Lee'], null, [home({ office_name: null })]),
  '\nMLS 73568135\n',
  'an unknown office is left out, not printed blank'
);

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
has(email, 'https://www.kevinhoang.co/email/kevin-hoang.jpg', 'the signature has his photo');
has(email, 'alt="Kevin Hoang"', 'and a name for it when images are blocked');
has(email, '(860) 682-2251', 'the phone, as SITE has it');
has(email, 'tel:+18606822251', 'tappable');
has(email, 'knhoangre@gmail.com', 'the email');
has(email, 'https://www.facebook.com/knhoangre/', 'and the profiles');
has(email, 'https://www.kevinhoang.co/email/icon-phone.png', 'with an icon beside each line');
has(email, 'alt="Google"', 'and names for the profile icons when images are blocked');
has(email, '.sig-photo', 'and a smaller photo for the narrowest phones');
has(email, 'Cheers,', 'it signs off the way he does');
lacks(email, 'Reply to this email or text me', 'and no longer asks them to reply or text (Kevin, 2026-10-30)');
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

/* ---- Each client's own ---------------------------------------------------- */

const who = (id: string, name: string, more: Partial<StoredPerson> = {}): StoredPerson => ({
  id,
  name,
  email: null,
  phone: null,
  contactId: null,
  ...more,
});
let day = 0;
const sent = (id: string, people: StoredPerson[], homes = ['1']): GroupableSend => {
  day += 1;
  return {
    id,
    people,
    homes: homes.map((n) => sendHome(n)),
    createdAt: `2026-10-${String(day).padStart(2, '0')}T12:00:00Z`,
    sentAt: null,
  };
};
const ids = (client: { sends: GroupableSend[] }) => client.sends.map((s) => s.id);

const tammy = { email: 'tammy@example.com' };
let grouped = clientsFrom([
  sent('a', [who('p1', 'Tammy Nguyen', tammy)]),
  sent('b', [who('p2', 'Tammy Nguyen', { email: 'TAMMY@example.com ' })]),
]);
is(grouped.length, 1, 'two messages to one email are one client');
is(ids(grouped[0]), ['b', 'a'], 'with the newest message first');
is(grouped[0].key, 'p1', 'keyed on the first person on the oldest message');

grouped = clientsFrom([
  sent('a', [who('p1', 'Sam Lee', { contactId: 5, email: 'old@example.com' })]),
  sent('b', [who('p2', 'Sam Lee', { contactId: 5, email: 'new@example.com' })]),
]);
is(grouped.length, 1, 'a corrected email stays one client through their CRM contact');
is(grouped[0].emails, ['new@example.com', 'old@example.com'], 'and both addresses are shown, newest first');

grouped = clientsFrom([
  sent('a', [who('p1', 'Sam Lee', { phone: '617-555-0100' })]),
  sent('b', [who('p2', 'Sam Lee', { phone: '(617) 555-0100' })]),
  sent('c', [who('p3', 'Sam Lee', { phone: '+1 617 555 0100' })]),
]);
is(grouped.length, 1, 'one phone number written three ways is one client');
is(grouped[0].phones.length, 1, 'and shows once');

grouped = clientsFrom([
  sent('a', [who('p1', 'Tammy Nguyen', tammy), who('p2', 'Matthew Nguyen', { phone: '617-555-0142' })]),
  sent('b', [who('p3', 'Matthew Nguyen', { phone: '617-555-0142' })]),
  sent('c', [who('p4', 'Tammy Nguyen', tammy)]),
]);
is(grouped.length, 1, 'a couple is one client, whichever of them a later message is for');
is(clientName(grouped[0]), 'Tammy Nguyen & Matthew Nguyen', 'named together');
is(clientContact(grouped[0]), 'tammy@example.com · 617-555-0142', 'with everything that reaches them');

grouped = clientsFrom([
  sent('a', [who('p1', 'Tammy Nguyen', tammy)]),
  sent('b', [who('p2', 'Sam Lee', { email: 'sam@example.com' })]),
]);
is(grouped.length, 2, 'two different people are two clients');
is(grouped[0].names, ['Sam Lee'], 'whoever had something happen last comes first');

grouped = clientsFrom([
  sent('a', [who('p1', 'Linh Tran', { email: 'family@example.com' })]),
  sent('b', [who('p2', 'David Tran', { email: 'family@example.com' })]),
]);
is(grouped.length, 1, 'two people sharing an email are one client');
is(clientName(grouped[0]), 'David Tran & Linh Tran', 'and neither name is lost');

grouped = clientsFrom([
  sent('a', [who('p1', 'Marcus')]),
  sent('b', [who('p2', 'marcus ')]),
]);
is(grouped.length, 1, 'a Zillow client with only a name is matched by it');

grouped = clientsFrom([
  sent('a', [who('p1', 'Sam Lee')]),
  sent('b', [who('p2', 'Sam Lee', { email: 'sam@example.com' })]),
]);
is(grouped.length, 1, 'a name alone joins somebody with details of that name');

grouped = clientsFrom([
  sent('a', [who('p1', 'Sam Lee', { email: 'one@example.com' })]),
  sent('b', [who('p2', 'Sam Lee', { email: 'two@example.com' })]),
]);
is(grouped.length, 2, 'two people with one name and different details stay apart');

grouped = clientsFrom([
  sent('a', [who('p1', 'Tammy', tammy)]),
  sent('b', [who('p2', 'Tammy Nguyen', tammy)]),
]);
is(grouped[0].names, ['Tammy Nguyen'], 'a first name is not a second person once the full one is known');

grouped = clientsFrom([
  sent('a', []),
  sent('b', [who('p1', 'Tammy Nguyen', tammy)]),
  sent('c', []),
]);
is(grouped.map((c) => c.key), ['p1', NO_CLIENT], 'messages with nobody on them are together, and last');
is(clientName(grouped[1]), 'No client named', 'and say so');
is(clientContact(grouped[1]), '', 'with nothing to reach');
is(nextPeople(grouped[1]), [], 'and nobody to start the next one with');

grouped = clientsFrom([
  sent('a', [who('p1', 'Tammy Nguyen', tammy), who('p2', 'Matthew Nguyen')], ['1', '2']),
  sent('b', [who('p3', 'Tammy Nguyen', tammy)], ['2', '3']),
]);
is(nextPeople(grouped[0]).map((p) => p.id), ['p3'], 'the next message starts with whoever was on the last');
is(grouped[0].homeCount, 3, 'a home sent twice counts once');

const early = { ...sent('a', [who('p1', 'Tammy Nguyen', tammy)]), sentAt: '2026-12-25T12:00:00Z' };
const late = sent('b', [who('p2', 'Sam Lee', { email: 'sam@example.com' })]);
grouped = clientsFrom([early, late]);
is(grouped[0].names, ['Tammy Nguyen'], 'an email going counts as something happening');
is(grouped[0].lastAt, '2026-12-25T12:00:00Z', 'and is what the list shows');
is(clientsFrom([]), [], 'no messages, no clients');

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
