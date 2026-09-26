/**
 * Assertions for src/lib/massgis.ts — the address parser, offline.
 *
 *   node scripts/massgis-check.ts          # parser only, no network
 *   node scripts/massgis-check.ts --live   # also asks MassGIS, as the admin form does
 *
 * The parser turns MassGIS's uppercase one-liners into the four fields the
 * rental invite has. It is exactly the kind of code that breaks silently: a
 * ZIP that loses its leading zero, a unit range left in the street line, "Court
 * St" abbreviated to "Ct St". Each of those would be written into an invite and
 * then into the applicant's tenancy address, so they are pinned here.
 *
 * The live mode is not a test of our code so much as of the service: MassGIS
 * is a state server we do not control, and this is the quickest way to learn
 * whether it has moved, changed shape or stopped answering.
 */
import {
  formatStreet,
  isWorthSuggesting,
  parseSuggestion,
  suggestAddresses,
} from '../src/lib/massgis.ts';

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

console.log('--- street formatting ---');
eq(formatStreet('151 WASHINGTON STREET'), '151 Washington St', 'STREET abbreviates to St');
eq(formatStreet('151 WASHINGTON ST'), '151 Washington St', 'ST and STREET land on one spelling');
eq(formatStreet('42 NEWMAN ROAD'), '42 Newman Rd', 'ROAD abbreviates to Rd');
eq(formatStreet('10 COURT STREET'), '10 Court St', 'only the LAST word is a suffix — Court St, not Ct St');
eq(formatStreet('5 N MAIN ST'), '5 N Main St', 'a directional stays a single capital');
eq(formatStreet("12 O'BRIEN HIGHWAY"), "12 O'Brien Hwy", 'apostrophe names capitalise both parts');
eq(formatStreet('3 1ST AVENUE'), '3 1st Ave', 'ordinals are lower-cased, not "1St"');
eq(formatStreet('7 PLEASANT VALLEY WAY'), '7 Pleasant Valley Way', 'multi-word names keep every word');

console.log('\n--- parsing a suggestion ---');
eq(
  parseSuggestion('151 WASHINGTON STREET (#1-12), CAMBRIDGE, MA, 02139'),
  {
    street: '151 Washington St',
    town: 'Cambridge',
    state: 'MA',
    zip: '02139',
    unitHint: '#1-12',
    label: '151 Washington St, Cambridge, MA 02139',
  },
  'a unit range is lifted out of the street and kept as a hint'
);
eq(parseSuggestion('151 WASHINGTON ST, HYDE PARK, MA, 02136')?.town, 'Hyde Park', 'a two-word community is title-cased');
eq(parseSuggestion('151 WASHINGTON ST, HYDE PARK, MA, 02136')?.unitHint, null, 'no range, no hint');
eq(parseSuggestion('9 ELM ST, NEEDHAM, MA, 02492')?.zip, '02492', 'the leading zero survives — the bug that once rendered "Newton, MA 2459"');
ok(parseSuggestion('9 ELM ST, NEEDHAM, MA') === null, 'a line with no ZIP is dropped, not half-filled');
ok(parseSuggestion('9 ELM ST, NEEDHAM, MASS, 02492') === null, 'a state that is not two letters is dropped');
ok(parseSuggestion('9 ELM ST, NEEDHAM, MA, 2492') === null, 'a four-digit ZIP is dropped');
ok(parseSuggestion('') === null, 'an empty line is dropped');

console.log('\n--- when to ask ---');
ok(isWorthSuggesting('151 wash'), '"151 wash" is worth asking about');
ok(!isWorthSuggesting('151'), 'a bare number is not');
ok(!isWorthSuggesting('washington'), 'a street with no number is not — MassGIS suggests address points');
ok(!isWorthSuggesting('1 w'), 'one letter of street is not enough to be useful');

if (process.argv.includes('--live')) {
  console.log('\n--- live, against MassGIS ---');
  const results = await suggestAddresses('151 wash', new AbortController().signal, ['Cambridge', 'Somerville']);
  ok(results.length > 0, `"151 wash" returns suggestions (${results.length})`);
  ok(
    results.some((r) => r.street === '151 Washington St'),
    'including 151 Washington St'
  );
  ok(results.every((r) => /^\d{5}$/.test(r.zip)), 'every suggestion has a five-digit ZIP');
  const firstNonLocal = results.findIndex((r) => !['Arlington', 'Cambridge', 'Somerville', 'Medford', 'Winchester', 'Hyde Park', 'Woburn', 'Chelsea', 'Boston', 'Brookline', 'Newton', 'Needham', 'Waltham'].includes(r.town));
  ok(firstNonLocal === -1 || firstNonLocal > 0, `local towns lead the list (first: ${results[0]?.label})`);
  ok(['Cambridge', 'Somerville'].includes(results[0]?.town), 'a preferred town is floated to the very top');
  console.log('  top five:', results.slice(0, 5).map((r) => r.label));
}

console.log('');
if (failures) {
  console.error(`${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('All assertions passed.');
