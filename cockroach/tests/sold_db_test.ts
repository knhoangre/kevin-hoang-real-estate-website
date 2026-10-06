/**
 * Assertions for supabase/functions/_shared/soldDb.ts, against a real CockroachDB.
 *
 *   sh cockroach/tests/run.sh
 *
 * What is pinned here is the behaviour the free tier depends on and that reports
 * success when it is wrong:
 *
 *   * AN UNCHANGED BATCH WRITES NOTHING. The request-unit allowance is spent by
 *     writes; a sync that rewrote every row nightly would disable the cluster
 *     mid-month, and it would look like a working sync right up until then.
 *   * A CHANGED ROW IS REPLACED WHOLE, and only that row.
 *   * A COORDINATE IS NEVER LOST. A status change on a geocoded sale must not
 *     blank its lat/lon just because the lookup had nothing new to say.
 *   * THE ARCHIVE IMPORT NEVER OVERWRITES a full feed row with its thin copy.
 *   * NUMBERS COME BACK AS NUMBERS and dates as plain dates, the shape every
 *     page already renders.
 *   * The read-only login cannot write, and the writer cannot delete.
 *
 * Runs in Deno because the code under test is an edge function's.
 */
import postgres from 'https://deno.land/x/postgresjs@v3.4.4/mod.js';
import {
  addressKey,
  applyGeocodes,
  hashRow,
  insertMissingSold,
  openSoldDb,
  recordSoldRun,
  writeSoldBatch,
  type Geocode,
} from '../../supabase/functions/_shared/soldDb.ts';

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
const refuses = async (run: () => Promise<unknown>) => {
  try {
    await run();
    return false;
  } catch {
    return true;
  }
};

const row = (n: number, over: Record<string, unknown> = {}) => ({
  mls_number: String(7300000 + n),
  status: 'SLD',
  prop_type: 'SF',
  address: `${n} Maple St`,
  street_no: String(n),
  street_name: 'Maple St',
  town: 'Needham',
  state: 'MA',
  zip: '02492',
  list_price: 900000 + n,
  sale_price: 910000 + n,
  settled_date: '2026-03-01',
  bedrooms: 3,
  full_baths: 2,
  half_baths: 1,
  living_area: 1800 + n,
  lot_size: 10000.5,
  acres: 0.23,
  basement: true,
  remarks: 'A house, described at some length by the listing agent.',
  photo_count: 12,
  // What idx-sync's toRow() also carries and this table deliberately does not.
  feed: 'sold',
  synced_at: new Date().toISOString(),
  ...over,
});

const sql = openSoldDb('rw');
await sql`TRUNCATE idx_sold, idx_sold_runs`;

console.log('--- the diff ---');
const batch = Array.from({ length: 500 }, (_, i) => row(i + 1));
eq(await writeSoldBatch(sql, batch), { seen: 500, written: 500 }, 'a new batch is written whole');
eq(await writeSoldBatch(sql, batch), { seen: 500, written: 0 }, 'the same batch again writes NOTHING');
{
  // synced_at changes every run on the Supabase side. It must not look like a change here.
  const later = batch.map((r) => ({ ...r, synced_at: '2030-01-01T00:00:00Z' }));
  eq(await writeSoldBatch(sql, later), { seen: 500, written: 0 }, 'a new synced_at is not a change');
}
{
  const reordered = batch.map((r) => Object.fromEntries(Object.entries(r).reverse()));
  eq(await writeSoldBatch(sql, reordered), { seen: 500, written: 0 }, 'nor is the order of the keys');
}
{
  const edited = batch.map((r, i) => (i < 3 ? { ...r, sale_price: 1 } : r));
  eq(await writeSoldBatch(sql, edited), { seen: 500, written: 3 }, 'three edited rows are three writes');
  const [check] = await sql`SELECT sale_price, living_area, remarks FROM idx_sold WHERE mls_number = '7300001'`;
  eq([check.sale_price, check.living_area], [1, 1801], 'and the edit is what is stored, with the rest intact');
}
eq(
  await writeSoldBatch(sql, [row(9001), row(9001, { sale_price: 5 })]),
  { seen: 2, written: 1 },
  'one MLS number twice in a batch is one row, the later one'
);
eq(await writeSoldBatch(sql, []), { seen: 0, written: 0 }, 'an empty batch is a no-op');
ok((await hashRow(row(1))) === (await hashRow({ ...row(1), synced_at: 'x', feed: 'y' })), 'the hash covers the feed columns only');

console.log('--- what comes back ---');
{
  const [r] = await sql`SELECT * FROM idx_sold WHERE mls_number = '7300010'`;
  eq(
    [typeof r.bedrooms, typeof r.list_price, typeof r.lot_size, typeof r.basement],
    ['number', 'number', 'number', 'boolean'],
    'integers and decimals are numbers, not strings'
  );
  eq(r.settled_date, '2026-03-01', 'a date is the plain date, not a timestamp at midnight UTC');
  eq(r.lot_size, 10000.5, 'a decimal keeps its fraction');
  eq(r.address_key, '10 maple st|needham|ma|02492', 'the address key is the one idx_geocodes is keyed on');
  ok(!('feed' in r) && !('synced_at' in r), 'feed and synced_at are not stored');
}
eq(addressKey(' 12 Elm St., #3 ', 'Newton', 'M A', '02458-1234'), '12 elm st 3|newton|ma|02458', 'addressKey normalises like the app and SQL copies');

console.log('--- coordinates ---');
{
  const here: Geocode = { lat: 42.28, lon: -71.23, precision: 'rooftop' };
  const lookup = (keys: string[]) =>
    Promise.resolve(new Map(keys.filter((k) => k.startsWith('8001 ')).map((k) => [k, here])));
  await writeSoldBatch(sql, [row(8001), row(8002)], lookup);
  const rows = await sql`SELECT mls_number, lat, lon, geocode_precision FROM idx_sold WHERE mls_number IN ('7308001','7308002') ORDER BY 1`;
  eq([rows[0].lat, rows[0].lon, rows[0].geocode_precision], [42.28, -71.23, 'rooftop'], 'a known address is written with its coordinate');
  eq([rows[1].lat, rows[1].lon], [null, null], 'an unknown one is written without, not with a guess');

  // The status changes; this time the lookup knows nothing.
  await writeSoldBatch(sql, [row(8001, { status: 'RNT' })], () => Promise.resolve(new Map()));
  const [after] = await sql`SELECT status, lat FROM idx_sold WHERE mls_number = '7308001'`;
  eq([after.status, after.lat], ['RNT', 42.28], 'a later change with no geocode to offer keeps the coordinate');

  const applied = await applyGeocodes(sql, [
    { address_key: '8002 maple st|needham|ma|02492', lat: 42.3, lon: -71.2, precision: 'range' },
    { address_key: '8001 maple st|needham|ma|02492', lat: 1, lon: 1, precision: 'wrong' },
    { address_key: 'nowhere|x|ma|00000', lat: 2, lon: 2, precision: null },
  ]);
  eq(applied, 1, 'a pushed geocode fills the one row that lacked it');
  const [kept] = await sql`SELECT lat FROM idx_sold WHERE mls_number = '7308001'`;
  eq(kept.lat, 42.28, 'and never replaces a coordinate that was already there');
  eq(await applyGeocodes(sql, []), 0, 'no geocodes is a no-op');
}

console.log('--- the archive import ---');
{
  const thin = (n: number) => ({
    mls_number: String(7300000 + n),
    prop_type: 'SF',
    address: `${n} Maple St`,
    town: 'Needham',
    state: 'MA',
    zip: '02492',
    sale_price: 1,
    settled_date: '2024-06-01',
    address_key: `${n} maple st|needham|ma|02492`,
  });
  eq(await insertMissingSold(sql, [thin(10), thin(20001)]), { seen: 2, written: 1 }, 'only the sale that was missing is added');
  const [full] = await sql`SELECT sale_price, remarks FROM idx_sold WHERE mls_number = '7300010'`;
  ok(full.sale_price === 910010 && full.remarks !== null, 'a full feed row is NOT replaced by its thin archive copy');
  const [old] = await sql`SELECT settled_date, row_hash FROM idx_sold WHERE mls_number = '7320001'`;
  eq([old.settled_date, old.row_hash], ['2024-06-01', 'archive-import'], 'the missing one arrives marked as an import');
  eq(await writeSoldBatch(sql, [row(20001)]), { seen: 1, written: 1 }, 'and the feed replaces it with the whole row if it sends that sale again');
}

console.log('--- the run log ---');
await recordSoldRun(sql, { source: 'test', seen: 500, written: 3, ok: true });
eq((await sql`SELECT rows_written FROM idx_sold_runs WHERE source = 'test'`)[0].rows_written, 3, 'a run is recorded');

console.log('--- what each login may do ---');
{
  const as = (user: string) =>
    postgres(Deno.env.get('SOLD_DB_URL_RW')!.replace('//root@', `//${user}@`), { max: 1, onnotice: () => {} });
  const ro = as('sold_ro');
  const rw = as('sold_rw');
  ok((await ro`SELECT count(*)::INT8 AS n FROM idx_sold`)[0].n > 0, 'the read-only login can read');
  ok(await refuses(() => ro`UPDATE idx_sold SET status = 'X' WHERE mls_number = '7300001'`), 'and cannot update');
  ok(await refuses(() => ro`INSERT INTO idx_sold (mls_number, row_hash) VALUES ('1', 'x')`), 'or insert');
  ok(await refuses(() => ro`SELECT * FROM idx_sold_runs`), 'or read the run log');
  ok((await rw`UPDATE idx_sold SET status = 'SLD' WHERE mls_number = '7308001' RETURNING 1`).length === 1, 'the writer can correct a row');
  ok(await refuses(() => rw`DELETE FROM idx_sold WHERE mls_number = '7300001'`), 'and cannot delete one');
  ok(await refuses(() => rw`TRUNCATE idx_sold`), 'or empty the table');
  await ro.end();
  await rw.end();
}

await sql.end();
if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  Deno.exit(1);
}
console.log('\nAll assertions passed.');
