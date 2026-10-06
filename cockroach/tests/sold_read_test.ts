/**
 * Assertions for supabase/functions/_shared/soldRead.ts — the public read
 * endpoint over the kept sold data — against a real CockroachDB.
 *
 *   sh cockroach/tests/run.sh
 *
 * The comp assertions are the ones supabase/tests/idx_comps_test.sql makes of
 * idx_comparable_sales(), restated here because this is its replacement and the
 * estimator depends on the same claims:
 *
 *   * A COMP QUERY CANNOT CROSS A STATE LINE. Town names are not unique in the
 *     feed, so a set banded on town alone silently mixes two markets.
 *   * AN UNKNOWN DISTANCE IS NOT A NEAR ONE. A sale with no coordinate is
 *     returned when no radius is asked for, and excluded when one is.
 *
 * And the ones that exist because this endpoint is PUBLIC:
 *
 *   * What a caller sends is a value, never SQL.
 *   * A listing older than the display window is not displayed, though it is
 *     still a comp.
 *   * Every answer is capped.
 */
import { openSoldDb, writeSoldBatch } from '../../supabase/functions/_shared/soldDb.ts';
import { handleSoldRequest } from '../../supabase/functions/_shared/soldRead.ts';

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

// deno-lint-ignore no-explicit-any
type Any = any;
const ask = async (body: unknown): Promise<{ status: number; data: Any }> => {
  const res = await handleSoldRequest(
    new Request('http://local/', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })
  );
  return { status: res.status, data: await res.json() };
};
const rows = async (body: unknown): Promise<Any[]> => (await ask(body)).data.rows;
const ids = async (body: unknown) => (await rows(body)).map((r) => r.mls_number);

/** A date `days` ago, as the feed writes one. */
const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

const sale = (mls: string, over: Record<string, unknown> = {}) => ({
  mls_number: mls,
  status: 'SLD',
  prop_type: 'SF',
  address: `${mls.slice(-2)} Elm St`,
  town: 'Needham',
  state: 'MA',
  zip: '02492',
  list_price: 1050000,
  sale_price: 1000000,
  settled_date: ago(30),
  bedrooms: 3,
  full_baths: 2,
  half_baths: 1,
  living_area: 2000,
  remarks: 'Sold.',
  photo_count: 9,
  ...over,
});

const sql = openSoldDb('rw');
await sql`TRUNCATE idx_sold`;

// Needham centre, and points at known offsets from it.
// 0.008988 deg latitude = 1.000 km.
const LAT = 42.2809;
const LON = -71.2377;
const at = new Map([
  ['7000001', { lat: LAT, lon: LON, precision: 'rooftop' }],
  ['7000002', { lat: LAT + 0.008988, lon: LON, precision: 'rooftop' }], // 1 km north
  ['7000003', { lat: LAT + 0.044940, lon: LON, precision: 'range' }], // 5 km north
]);
const seed = [
  sale('7000001', { settled_date: ago(10), sale_price: 1000000 }),
  sale('7000002', { settled_date: ago(60), sale_price: 1100000, bedrooms: 4, living_area: 2200 }),
  sale('7000003', { settled_date: ago(120), sale_price: 1200000, bedrooms: 4, living_area: 2400 }),
  sale('7000004', { settled_date: ago(200), sale_price: 950000 }), // no coordinate
  // Out of a Needham MA comp set, each for exactly one reason:
  sale('7000011', { state: 'NH', zip: '03000' }), // wrong state, same town name
  sale('7000012', { prop_type: 'RN', sale_price: 3200, list_price: 3200 }), // a rental
  sale('7000013', { town: 'Newton', zip: '02458', address: '5 Webster St' }), // another town
  sale('7000014', { sale_price: null }), // no sale price
  sale('7000015', { settled_date: null }), // no sale date
  sale('7000016', { living_area: 0 }), // not a believable floor area
  sale('7000017', { living_area: 99999, sale_price: 90000000 }),
  // Older than the display window, inside an 18-month comp window:
  sale('7000021', { settled_date: ago(450), sale_price: 900000 }),
  // Older than both:
  sale('7000022', { settled_date: ago(900), sale_price: 800000 }),
  sale('7000031', { prop_type: 'CC', sale_price: 600000, bedrooms: 2, address: '100% Odd_Name Way' }),
];
await writeSoldBatch(sql, seed, (keys) =>
  Promise.resolve(
    new Map(
      seed
        .filter((s) => at.has(s.mls_number))
        .map((s) => [`${s.address.toLowerCase()}|needham|ma|02492`, at.get(s.mls_number)!] as const)
        .filter(([k]) => keys.includes(k))
    )
  )
);

console.log('--- the sold tab ---');
{
  const page = await rows({ op: 'search' });
  eq(page.map((r) => r.mls_number).slice(0, 3), ['7000001', '7000011', '7000013'].sort(), 'newest first, MLS number breaking ties');
  ok(!page.some((r) => r.prop_type === 'RN'), 'rentals are not in it');
  ok(!page.some((r) => ['7000021', '7000022'].includes(r.mls_number)), 'nor is anything sold more than a year ago');
  ok(!page.some((r) => r.mls_number === '7000015'), 'nor a row with no sale date');
  const first = page[0];
  eq([first.feed, first.price_cut, first.previous_list_price], ['sold', false, null], 'a row reads as an idx_listings sold row');
  ok(!('row_hash' in first) && !('lat' in first) && !('address_key' in first) && !('updated_at' in first), 'with this table\'s bookkeeping taken off');
  ok(typeof first.synced_at === 'string' && typeof first.first_seen_at === 'string', 'and the timestamps the pages read put on');
  eq(first.settled_date, ago(10), 'the sale date is a plain date');
}
eq(await ids({ op: 'search', town: 'Newton' }), ['7000013'], 'filtered by town');
eq(await ids({ op: 'search', propType: 'CC' }), ['7000031'], 'by property type');
eq(await ids({ op: 'search', town: 'Needham', minPrice: 1150000 }), ['7000017', '7000003'], 'by what it SOLD for, still newest first');
eq(await ids({ op: 'search', town: 'Needham', propType: 'SF', beds: 4, maxPrice: 2000000 }), ['7000002', '7000003'], 'beds as a minimum');
eq(await ids({ op: 'search', q: '7000013' }), ['7000013'], 'free text that is all digits is an MLS number');
eq(await ids({ op: 'search', q: 'webster' }), ['7000013'], 'otherwise an address');
eq(await ids({ op: 'search', q: 'newton' }), ['7000013'], 'or a town, however it is capitalised');
eq(await ids({ op: 'search', q: '5 web' }), ['7000013'], 'words match in order with anything between');
eq(await ids({ op: 'search', q: '%' }), ['7000031'], 'a typed % matches a literal %, not everything');
eq(await ids({ op: 'search', q: '_' }), ['7000031'], 'and a typed _ a literal _');
eq(await ids({ op: 'search', page: 2 }), [], 'a page past the end is empty');
eq((await ask({ op: 'count' })).data.count, (await rows({ op: 'search' })).length, 'the total agrees with the page');
eq((await ask({ op: 'count', town: 'Newton' })).data.count, 1, 'and with a filter');

console.log('--- one listing ---');
eq(await ids({ op: 'byMls', mls: '7000002' }), ['7000002'], 'one sale by number');
eq((await ids({ op: 'byMls', mls: ['7000001', '7000003', '7000003', 'x; DROP', 12] })).sort(), ['7000001', '7000003'], 'or a list, with anything that is not a number ignored');
eq(await ids({ op: 'byMls', mls: '7000021' }), [], 'a sale older than the display window is not displayed');
eq(await ids({ op: 'byMls', mls: [] }), [], 'no numbers is no rows');

console.log('--- a few like it ---');
eq(
  await ids({ op: 'similar', town: 'Needham', state: 'MA', propType: 'SF', price: 1000000, bedrooms: 3, excludeMls: '7000001', limit: 3 }),
  // 7000016 closed at the subject's own price; 7000014 has no sale price and so
  // no distance from one. Floor area is not this op's business — it is comps'.
  ['7000016', '7000004', '7000002'],
  'nearest in price first, within a bedroom, the subject left out'
);
eq(await ids({ op: 'similar', town: 'Needham', state: 'NH', propType: 'SF', price: 1000000 }), ['7000011'], 'and never across a state line');
eq(await ids({ op: 'similar', town: 'Needham', propType: 'SF', price: 0 }), [], 'no price, no comparison');

console.log('--- comps ---');
const comps = (over: Record<string, unknown> = {}) =>
  rows({ op: 'comps', p_prop_type: 'SF', p_town: 'Needham', p_state: 'MA', p_months: 18, ...over });
{
  const all = await comps();
  eq(all.map((r) => r.mls_number), ['7000001', '7000002', '7000003', '7000004', '7000021'], 'in scope, newest first — including one too old to DISPLAY');
  ok(all.every((r) => r.distance_km === null), 'with no subject coordinate, no distance is claimed');
  ok(!('remarks' in all[0]) && !('row_hash' in all[0]), 'and only the columns the estimator reads');
}
eq((await comps({ p_state: 'NH' })).map((r) => r.mls_number), ['7000011'], 'a comp query cannot cross a state line');
eq(await rows({ op: 'comps', p_prop_type: 'SF', p_state: 'MA' }), [], 'no town returns nothing rather than a whole state');
{
  const located = await comps({ p_lat: LAT, p_lon: LON });
  const d = Object.fromEntries(located.map((r) => [r.mls_number, r.distance_km]));
  ok(Math.abs(d['7000001']) < 1e-6, 'the subject\'s own spot is distance zero');
  ok(Math.abs(d['7000002'] - 1) < 0.01, `a sale 1 km north is 1 km away (${d['7000002']?.toFixed(4)})`);
  ok(Math.abs(d['7000003'] - 5) < 0.02, `and one 5 km north is 5 km away (${d['7000003']?.toFixed(4)})`);
  eq(d['7000004'], null, 'a sale with no coordinate has an unknown distance');
  ok(located.some((r) => r.mls_number === '7000004'), 'and is still returned when no radius is asked for');
}
eq(
  (await comps({ p_lat: LAT, p_lon: LON, p_radius_km: 2 })).map((r) => r.mls_number),
  ['7000001', '7000002'],
  'a radius keeps what is inside it — and an unknown distance is not a near one'
);
eq((await comps({ p_radius_km: 2 })).length, 5, 'a radius with no subject coordinate is not applied');
eq((await comps({ p_min_sqft: 2100, p_max_sqft: 2300 })).map((r) => r.mls_number), ['7000002'], 'floor-area bounds');
eq((await comps({ p_exclude_mls: '7000001' })).map((r) => r.mls_number)[0], '7000002', 'the subject is excluded');
eq((await comps({ p_months: 6 })).map((r) => r.mls_number), ['7000001', '7000002', '7000003'], 'the window is the caller\'s');
eq((await comps({ p_months: 60 })).length, 6, 'and a long one reaches sales the feed stopped carrying years ago');
eq((await comps({ p_limit: 2 })).length, 2, 'the limit is honoured');
eq((await comps({ p_limit: 100000 })).length, 5, 'and a silly one is clamped rather than refused');

console.log('--- it is a public endpoint ---');
eq((await ask({ op: 'drop' })).status, 400, 'an unknown op is refused');
eq((await ask('not json')).status, 400, 'so is a body that is not JSON');
eq(await ids({ op: 'search', town: "Needham'; DROP TABLE idx_sold; --" }), [], 'SQL in a value is a value that matches nothing');
eq(await rows({ op: 'comps', p_prop_type: "SF' OR '1'='1", p_town: 'Needham' }), [], 'in every op');
ok((await sql`SELECT count(*)::INT8 AS n FROM idx_sold`)[0].n === seed.length, 'and the table is as it was');
eq(await ids({ op: 'search', town: 'x'.repeat(500) }), (await ids({ op: 'search' })), 'an absurdly long value is ignored, not passed on');

await sql.end();

Deno.env.delete('SOLD_DB_URL_RO');
eq((await ask({ op: 'search' })).status, 503, 'with no database configured it says so, and the page shows no sold results');

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  Deno.exit(1);
}
console.log('\nAll assertions passed.');
