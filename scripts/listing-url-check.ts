/**
 * Assertions for a listing's address on this site — src/lib/listingUrl.ts.
 *
 *   node scripts/listing-url-check.ts
 *
 * Two things here are promises to people rather than to code:
 *
 *   - Every link Kevin sent before 2026-10-09 is /search/<MLS number>, and each
 *     of them has to keep opening the same listing. That is the first block.
 *   - A link must never be read as a listing it does not name. A slug that lost
 *     its number ends in a ZIP code, which is five digits, and five digits used
 *     to be accepted as an MLS number.
 *
 * It also runs the edge functions' copy of the slug over the same addresses.
 * That copy exists because an edge function cannot import from the app, and a
 * mirror nobody checks is a second spelling waiting to happen.
 *
 * No dependencies, no network.
 */
import { listingPath, listingSlug, mlsFromListingParam } from '../src/lib/listingUrl.ts';
import {
  listingSlug as emailSlug,
  listingUrl as emailUrl,
} from '../supabase/functions/_shared/listingEmail.ts';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures += 1;
};
const eq = (actual: unknown, expected: unknown, label: string) =>
  ok(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}${JSON.stringify(actual) === JSON.stringify(expected) ? '' : ` — got ${JSON.stringify(actual)}`}`
  );

console.log('--- links already sent ---');
eq(mlsFromListingParam('73568135'), '73568135', 'a bare MLS number is still that listing');
eq(mlsFromListingParam('7000001'), '7000001', 'so is a seven-digit one');
eq(mlsFromListingParam(' 73568135 '), '73568135', 'stray spaces from a pasted link do not matter');

console.log('--- the new form ---');
const gore = {
  mls_number: '73568135',
  address: '170 Gore St Unit 417',
  town: 'Cambridge',
  state: 'MA',
  zip: '02141',
};
eq(listingSlug(gore), '170-Gore-St-Unit-417-Cambridge-MA-02141-73568135', 'address, town, state, ZIP, then the number');
eq(listingPath(gore), '/search/170-Gore-St-Unit-417-Cambridge-MA-02141-73568135', 'and that is the path');
eq(mlsFromListingParam(listingSlug(gore)), '73568135', 'which reads back as the same listing');

console.log('--- what the feed actually sends ---');
eq(
  listingSlug({ mls_number: '73568135', address: '60 PATTISON ST Unit C14', town: 'Abington', state: 'MA', zip: '02351' }),
  '60-Pattison-St-Unit-C14-Abington-MA-02351-73568135',
  'a shouted street name is cased; the unit keeps its capital'
);
eq(
  listingSlug({ mls_number: '73500001', address: "12 O'Brien Rd. #2a", town: 'north attleboro', state: 'ma', zip: '02760-1234' }),
  '12-OBrien-Rd-2A-North-Attleboro-MA-02760-73500001',
  "apostrophes and full stops close up, '#' goes, a ZIP+4 is cut to five digits"
);
eq(
  listingSlug({ mls_number: '73500002', address: '8 McGrath Hwy', town: 'Somerville', state: 'MA', zip: '02143' }),
  '8-McGrath-Hwy-Somerville-MA-02143-73500002',
  'a name with its own capitals is left as it is'
);
eq(
  listingSlug({ mls_number: '73500003', address: '5 Élan Way & 7 Café Ct', town: 'Newton', state: 'MA', zip: '02459' }),
  '5-Elan-Way-And-7-Cafe-Ct-Newton-MA-02459-73500003',
  'accents fold to plain letters without splitting the word; & is spelled out'
);
ok(/^[A-Za-z0-9-]+$/.test(listingSlug({ mls_number: '1234567', address: '1/2 Main St, Apt "B" (rear)', town: 'Lynn' })),
   'whatever is in the address, the slug is letters, digits and hyphens');

console.log('--- with less known ---');
eq(listingSlug({ mls_number: '73568135' }), '73568135', 'nothing but a number is the old form exactly');
eq(
  listingSlug({ mls_number: '73568135', address: '170 Gore St Unit 417', town: 'Cambridge' }),
  '170-Gore-St-Unit-417-Cambridge-73568135',
  "a saved home's snapshot has no state or ZIP, and still makes a link"
);
eq(
  mlsFromListingParam('170-Gore-St-Unit-417-Cambridge-73568135'),
  '73568135',
  'that opens the same listing as the full one'
);
eq(mlsFromListingParam('anything-at-all-73568135'), '73568135', 'the words are never read — only the number');

console.log('--- what is NOT a listing ---');
eq(mlsFromListingParam('170-Gore-St-Unit-417-Cambridge-MA-02141'), null, 'a slug that lost its number is not MLS 02141');
eq(mlsFromListingParam('listing'), null, 'the prerendered shell is not a listing');
eq(mlsFromListingParam(''), null, 'nor is nothing');
eq(mlsFromListingParam(undefined), null, 'nor is no segment at all');
eq(mlsFromListingParam('73568135-170-Gore-St'), null, 'the number has to be last');
eq(mlsFromListingParam('1 OR 1=1'), null, 'and it has to be a number');

console.log('--- the edge functions\' copy ---');
const samples = [
  gore,
  { mls_number: '73568135', address: '60 PATTISON ST Unit C14', town: 'Abington', state: 'MA', zip: '02351' },
  { mls_number: '73500001', address: "12 O'Brien Rd. #2a", town: 'north attleboro', state: 'ma', zip: '02760-1234' },
  { mls_number: '73500002', address: '8 McGrath Hwy', town: 'Somerville', state: 'MA', zip: '02143' },
  { mls_number: '73500003', address: '5 Élan Way & 7 Café Ct', town: 'Newton', state: 'MA', zip: '02459' },
  { mls_number: '73500004', address: null, town: null, state: null, zip: null },
  { mls_number: '73500005', address: '216 Tremont Street Unit 216', town: 'Newton', state: null, zip: null },
];
ok(samples.every((s) => emailSlug(s) === listingSlug(s)), 'writes every address exactly as the app does');
eq(
  emailUrl(gore),
  'https://www.kevinhoang.co/search/170-Gore-St-Unit-417-Cambridge-MA-02141-73568135',
  'a link in a text message has the address in it and nothing after the number'
);
eq(
  emailUrl(gore, 'open-house'),
  'https://www.kevinhoang.co/search/170-Gore-St-Unit-417-Cambridge-MA-02141-73568135?utm_source=open-house&utm_medium=email',
  'an emailed link carries its source after it'
);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('\nAll assertions passed.');
