/**
 * The CockroachDB side of the sold feed: connecting, and writing a batch.
 *
 * Supabase's free 500 MB is why sold listings were deleted as they aged out of
 * MLS PIN's twelve-month window. CockroachDB's free allowance is 10 GiB, so
 * `idx_sold` there keeps every sale, every town, every column. The schema and
 * the reasoning are in cockroach/schema/001_idx_sold.sql.
 *
 * INERT WITHOUT ITS SECRET. `soldDbConfigured()` is false until
 * SOLD_DB_URL_RW / SOLD_DB_URL_RO are set, and every caller checks it first —
 * the same way a function no-ops without RESEND_API_KEY. Until Kevin has
 * created the cluster this file changes nothing about how the site behaves.
 *
 * REQUEST UNITS ARE THE BUDGET. The free allowance is 50 million a month and a
 * cluster that spends it is DISABLED until the next one. So a batch is never
 * simply upserted: `writeSoldBatch` hashes each feed row, reads the stored
 * hashes for that batch from a narrow covering index, and writes only the rows
 * that are new or changed. A night on which nothing changed writes nothing —
 * cockroach/tests asserts exactly that against a real cluster.
 */
import postgres from 'https://deno.land/x/postgresjs@v3.4.4/mod.js';

export type SoldSql = ReturnType<typeof postgres>;

export type SoldDbMode = 'rw' | 'ro';

const urlFor = (mode: SoldDbMode) =>
  Deno.env.get(mode === 'rw' ? 'SOLD_DB_URL_RW' : 'SOLD_DB_URL_RO') ?? '';

export const soldDbConfigured = (mode: SoldDbMode): boolean => urlFor(mode).length > 0;

/**
 * A connection for one invocation.
 *
 * `max: 1` because an edge function is one request and CockroachDB's free tier
 * counts connections; `prepare: false` because the cluster sits behind a proxy
 * and a named prepared statement outliving the connection it was made on is the
 * classic way that goes wrong.
 *
 * THE THREE TYPE PARSERS ARE WHAT MAKE A ROW READ FROM HERE THE SAME SHAPE AS
 * ONE FROM SUPABASE. Left alone, postgres.js returns INT8 and DECIMAL as
 * strings (safe for values no JS number can hold, wrong for a bedroom count)
 * and DATE as a Date, which JSON turns into "2026-03-01T00:00:00.000Z" — a
 * timestamp at midnight UTC, i.e. the evening before in Massachusetts. Every
 * page that renders a sale date expects the plain "2026-03-01" PostgREST sends.
 */
export const openSoldDb = (mode: SoldDbMode): SoldSql => {
  const url = urlFor(mode);
  if (!url) throw new Error(`SOLD_DB_URL_${mode.toUpperCase()} is not set`);
  return postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => {},
    types: {
      int8: { to: 20, from: [20], serialize: (v: unknown) => String(v), parse: (v: string) => Number(v) },
      numeric: { to: 1700, from: [1700], serialize: (v: unknown) => String(v), parse: (v: string) => Number(v) },
      date: { to: 1082, from: [1082], serialize: (v: unknown) => String(v), parse: (v: string) => v },
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Columns                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every idx_sold column that comes from the feed row, in one list.
 *
 * It is the row_hash's input, the INSERT's column list and the UPDATE's SET
 * list, so a column added to the table and to idx-sync's toRow() is hashed,
 * inserted and updated by adding it here once. `feed` and `synced_at` are
 * deliberately absent: every row here is sold, and nothing here is touched.
 */
export const SOLD_FEED_COLUMNS = [
  'mls_number', 'status', 'prop_type', 'prop_subtype', 'style',
  'address', 'street_no', 'street_name', 'unit_no', 'town', 'town_num', 'state', 'zip', 'neighborhood',
  'list_price', 'sale_price', 'settled_date',
  'bedrooms', 'full_baths', 'half_baths', 'total_rooms', 'living_area',
  'sqft_above_grade', 'sqft_below_grade', 'lot_size', 'acres', 'year_built', 'year_built_descrp',
  'garage_spaces', 'parking_spaces', 'num_units', 'unit_level',
  'basement', 'waterfront', 'adult_community', 'hoa', 'hoa_fee', 'taxes', 'tax_year', 'date_available',
  'remarks', 'color', 'heating', 'cooling', 'water', 'sewer', 'hot_water', 'appliances', 'flooring',
  'interior_features', 'exterior_features', 'exterior', 'construction', 'roof_material',
  'basement_feature', 'garage_parking', 'parking_feature', 'lot_description', 'electric_feature',
  'energy_features', 'road_type', 'laundry_features', 'pets_allowed', 'pool_description',
  'unit_placement', 'waterfront_desc', 'waterview_features',
  'list_office_id', 'list_agent_id', 'photo_count',
] as const;

type FeedRow = Record<string, unknown>;

/**
 * The key idx_geocodes is written under.
 *
 * A DELIBERATE MIRROR of `addressKey()` in src/lib/valuation.ts and of
 * `idx_address_key()` in SQL. An edge function cannot import from the app
 * bundle. As that file says of its own mirror: if the copies ever disagree the
 * symptom is a missed lookup — a comp with no coordinate, which the estimator
 * treats as an unknown distance — never a wrong one. That is why this mirror is
 * safe to have.
 */
export const addressKey = (
  address: unknown,
  town: unknown,
  state: unknown,
  zip: unknown
): string => {
  const norm = (v: unknown) =>
    String(v ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const zip5 = String(zip ?? '').replace(/[^0-9]/g, '').slice(0, 5);
  return `${norm(address)}|${norm(town)}|${norm(state).replace(/\s/g, '')}|${zip5}`;
};

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * A row's fingerprint. Values are taken in SOLD_FEED_COLUMNS order with missing
 * ones as null, so the hash does not depend on the order toRow() happens to
 * list its keys in — reordering that object must not rewrite 99,000 rows.
 */
export const hashRow = async (row: FeedRow): Promise<string> =>
  hex(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(SOLD_FEED_COLUMNS.map((c) => row[c] ?? null)))
    )
  );

/* -------------------------------------------------------------------------- */
/* Writing                                                                     */
/* -------------------------------------------------------------------------- */

export interface Geocode {
  lat: number;
  lon: number;
  precision: string | null;
}

/** Looks up coordinates for a set of address keys. Supplied by the caller, who has the Supabase client. */
export type GeocodeLookup = (keys: string[]) => Promise<Map<string, Geocode>>;

export interface WriteResult {
  seen: number;
  /** Rows inserted or updated — the ones that were new or had changed. */
  written: number;
}

// Built once: `col = excluded.col` for every feed column but the key. Column
// names come from the constant above, never from a request.
const SET_FROM_FEED = SOLD_FEED_COLUMNS.filter((c) => c !== 'mls_number')
  .map((c) => `${c} = excluded.${c}`)
  .join(', ');

/**
 * Writes the rows of a feed batch that are new or have changed.
 *
 * `geocodes` is asked only about the rows being written, so on an ordinary
 * night it is asked about a few dozen addresses rather than 99,000. A
 * coordinate already on a row is never overwritten with nothing: an address
 * that was geocoded stays geocoded when its listing's status changes.
 */
export const writeSoldBatch = async (
  sql: SoldSql,
  rows: FeedRow[],
  geocodes?: GeocodeLookup
): Promise<WriteResult> => {
  if (rows.length === 0) return { seen: 0, written: 0 };

  // A feed can carry one MLS number twice in a batch; the last one wins, as it
  // would in an upsert, and ON CONFLICT refuses to touch one row twice.
  const byMls = new Map<string, FeedRow>();
  for (const row of rows) byMls.set(String(row.mls_number), row);

  const prepared = await Promise.all(
    [...byMls.values()].map(async (row) => {
      const out: FeedRow = {};
      for (const column of SOLD_FEED_COLUMNS) out[column] = row[column] ?? null;
      out.row_hash = await hashRow(row);
      out.address_key = addressKey(row.address, row.town, row.state, row.zip);
      return out;
    })
  );

  const stored = await sql<{ mls_number: string; row_hash: string }[]>`
    SELECT mls_number, row_hash FROM idx_sold WHERE mls_number IN ${sql(prepared.map((r) => String(r.mls_number)))}
  `;
  const known = new Map(stored.map((r) => [r.mls_number, r.row_hash]));
  const changed = prepared.filter((r) => known.get(String(r.mls_number)) !== r.row_hash);
  if (changed.length === 0) return { seen: rows.length, written: 0 };

  const found = geocodes
    ? await geocodes([...new Set(changed.map((r) => String(r.address_key)))])
    : new Map<string, Geocode>();
  for (const row of changed) {
    const hit = found.get(String(row.address_key));
    row.lat = hit?.lat ?? null;
    row.lon = hit?.lon ?? null;
    row.geocode_precision = hit?.precision ?? null;
  }

  const columns = [...SOLD_FEED_COLUMNS, 'row_hash', 'address_key', 'lat', 'lon', 'geocode_precision'];
  await sql`
    INSERT INTO idx_sold ${sql(changed, ...columns)}
    ON CONFLICT (mls_number) DO UPDATE SET
      ${sql.unsafe(SET_FROM_FEED)},
      row_hash = excluded.row_hash,
      address_key = excluded.address_key,
      lat = COALESCE(excluded.lat, idx_sold.lat),
      lon = COALESCE(excluded.lon, idx_sold.lon),
      geocode_precision = COALESCE(excluded.geocode_precision, idx_sold.geocode_precision),
      updated_at = now()
  `;

  return { seen: rows.length, written: changed.length };
};

/**
 * Adds rows that are not there yet and leaves every existing row alone.
 *
 * For the one-time import of Supabase's idx_sold_archive, whose rows carry a
 * third of the columns. An archived sale that is ALSO still in the feed must
 * keep the feed's full row, so this never updates. The hash is a sentinel no
 * real row can produce: if the feed sends that sale again, the diff sees a
 * different hash and replaces the thin row with the whole one.
 */
export const insertMissingSold = async (
  sql: SoldSql,
  rows: FeedRow[],
  geocodes?: GeocodeLookup
): Promise<WriteResult> => {
  if (rows.length === 0) return { seen: 0, written: 0 };

  const prepared = rows.map((row) => {
    const out: FeedRow = {};
    for (const column of SOLD_FEED_COLUMNS) out[column] = row[column] ?? null;
    out.row_hash = 'archive-import';
    out.address_key = row.address_key ?? addressKey(row.address, row.town, row.state, row.zip);
    return out;
  });

  const found = geocodes
    ? await geocodes([...new Set(prepared.map((r) => String(r.address_key)))])
    : new Map<string, Geocode>();
  for (const row of prepared) {
    const hit = found.get(String(row.address_key));
    row.lat = hit?.lat ?? null;
    row.lon = hit?.lon ?? null;
    row.geocode_precision = hit?.precision ?? null;
  }

  const columns = [...SOLD_FEED_COLUMNS, 'row_hash', 'address_key', 'lat', 'lon', 'geocode_precision'];
  const inserted = await sql`
    INSERT INTO idx_sold ${sql(prepared, ...columns)}
    ON CONFLICT (mls_number) DO NOTHING
    RETURNING mls_number
  `;
  return { seen: rows.length, written: inserted.length };
};

/**
 * Puts newly-found coordinates onto the rows that were written before the
 * address had been geocoded.
 *
 * The geocode backfill runs on its own schedule, after the fact, so a sale is
 * usually ingested first and located later. Only rows with no coordinate are
 * touched — the partial index idx_sold_address_key exists for exactly this
 * predicate — so re-pushing a geocode that is already applied costs a lookup
 * and writes nothing.
 */
export const applyGeocodes = async (
  sql: SoldSql,
  geocodes: { address_key: string; lat: number; lon: number; precision: string | null }[]
): Promise<number> => {
  if (geocodes.length === 0) return 0;
  /*
   * Four parallel arrays through unnest(), each cast in the SQL. A VALUES list
   * of bare placeholders is refused here — "could not determine data type of
   * placeholder $1" — because nothing in `VALUES ($1, $2, …)` says what any of
   * them is, and CockroachDB will not guess the way Postgres sometimes does.
   */
  const updated = await sql`
    UPDATE idx_sold AS s
       SET lat = g.lat,
           lon = g.lon,
           geocode_precision = g.precision,
           updated_at = now()
      FROM unnest(
             ${sql.array(geocodes.map((g) => g.address_key))}::STRING[],
             ${sql.array(geocodes.map((g) => g.lat))}::FLOAT8[],
             ${sql.array(geocodes.map((g) => g.lon))}::FLOAT8[],
             ${sql.array(geocodes.map((g) => g.precision ?? ''))}::STRING[]
           ) AS g (address_key, lat, lon, precision)
     WHERE s.address_key = g.address_key
       AND s.lat IS NULL
    RETURNING s.mls_number
  `;
  return updated.length;
};

/** One line in idx_sold_runs. Never throws: a failed log line must not fail the run it describes. */
export const recordSoldRun = async (
  sql: SoldSql,
  run: { source: string; seen: number; written: number; ok: boolean; error?: string | null }
): Promise<void> => {
  try {
    await sql`
      INSERT INTO idx_sold_runs (source, rows_seen, rows_written, ok, error)
      VALUES (${run.source}, ${run.seen}, ${run.written}, ${run.ok}, ${run.error ?? null})
    `;
  } catch (err) {
    console.error('Could not record the sold run:', err);
  }
};
