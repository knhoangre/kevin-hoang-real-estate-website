/**
 * Fills idx_geocodes from the US Census batch geocoder.
 *
 *   node scripts/geocode-listings.ts
 *   node scripts/geocode-listings.ts --limit 2000    # a smaller first pass
 *
 * WHY THIS EXISTS. MLS PIN's feed carries no latitude or longitude — asserted
 * in the code rather than assumed — so "comparable sales near this house" has
 * no way to mean anything until addresses are resolved to coordinates. The comp
 * ladder is built to run without them and falls back to town-wide matching, so
 * this sharpens the feature rather than switching it on.
 *
 * WHY THE CENSUS GEOCODER. Free, no API key, no usage terms on the results,
 * every US address, and a batch endpoint that takes 10,000 rows at a time.
 * Nominatim — used once in this codebase, to place the office in SITE.geo —
 * asks for one request a second and is not built for a backfill of this size.
 *
 * WHY A SCRIPT AND NOT AN EDGE FUNCTION. It is a long backfill whose output is
 * durable, and the measured Edge Function ceiling on this project is 8,000 rows
 * an invocation. Same discipline as sync-listings.mjs: not part of `npm run
 * build`, so the build needs neither network nor credentials.
 *
 * SAFE UN-CONFIGURED, and safe to interrupt. With no service key it exits 0
 * having written nothing. It only ever looks at addresses with no row in
 * idx_geocodes, so it is resumable: run it, stop it, run it again. An address
 * the geocoder cannot place is written as 'failed' rather than retried forever
 * — a rural route that did not match this month will not match next month, and
 * a table of permanent retries is a table that never finishes.
 *
 * WRITTEN IN TYPESCRIPT on purpose, unlike the .mjs scripts beside it. It
 * imports addressKey() from src/lib/valuation.ts rather than re-implementing
 * it, which removes a mirror instead of documenting one — the browser and this
 * backfill cannot disagree about what identifies an address if there is only
 * one function. Node runs .ts directly (type stripping, stable since Node 23).
 */
import { readFileSync } from 'node:fs';
import { addressKey } from '../src/lib/valuation.ts';

const CENSUS_URL =
  'https://geocoding.geo.census.gov/geocoder/locations/addressbatch';
/**
 * The documented ceiling is 10,000. Five is well inside it and keeps a failed
 * request from costing twenty minutes of work — the endpoint is slow and
 * occasionally drops a batch outright.
 */
const BATCH = 5000;
const BENCHMARK = 'Public_AR_Current';

/* -------------------------------------------------------------------------- */
/* Config                                                                      */
/* -------------------------------------------------------------------------- */

const readEnvFile = (): Record<string, string> => {
  try {
    return Object.fromEntries(
      readFileSync('.env', 'utf8')
        .split('\n')
        .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
        })
    );
  } catch {
    return {};
  }
};

const env = { ...readEnvFile(), ...process.env } as Record<string, string>;
const URL_ = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
// Writing to idx_geocodes needs the service role: anon has SELECT and nothing
// else, deliberately, so that a browser can read coordinates and never invent
// one.
const KEY = env.SUPABASE_SERVICE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !KEY) {
  console.log(
    'geocode-listings: SUPABASE_URL / SUPABASE_SERVICE_KEY not set — nothing written.'
  );
  process.exit(0);
}

const argLimit = (() => {
  const i = process.argv.indexOf('--limit');
  if (i === -1) return Number.POSITIVE_INFINITY;
  const n = Number(process.argv[i + 1]);
  return Number.isFinite(n) && n > 0 ? n : Number.POSITIVE_INFINITY;
})();

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

/* -------------------------------------------------------------------------- */
/* Reading what still needs a coordinate                                       */
/* -------------------------------------------------------------------------- */

interface Row {
  address: string | null;
  town: string | null;
  state: string | null;
  zip: string | null;
  street_no?: string | null;
  street_name?: string | null;
}

const page = async (path: string, from: number, to: number): Promise<Row[]> => {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { ...headers, Range: `${from}-${to}`, Prefer: 'count=none' },
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${await res.text()}`);
  return res.json() as Promise<Row[]>;
};

/** Every address in a table, paged so a big archive does not arrive at once. */
const allRows = async (path: string): Promise<Row[]> => {
  const out: Row[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const batch = await page(path, from, from + size - 1);
    out.push(...batch);
    if (batch.length < size) break;
  }
  return out;
};

/* -------------------------------------------------------------------------- */
/* CSV                                                                         */
/* -------------------------------------------------------------------------- */

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Split one CSV line, honouring quotes. The Census response quotes freely. */
const splitCsv = (line: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
};

/* -------------------------------------------------------------------------- */
/* Geocoding                                                                   */
/* -------------------------------------------------------------------------- */

interface Pending {
  key: string;
  /** The street line the geocoder is asked about. */
  street: string;
  town: string;
  state: string;
  zip: string;
}

interface Result {
  address_key: string;
  lat: number | null;
  lon: number | null;
  precision: 'rooftop' | 'interpolated' | 'zip' | 'failed';
}

const geocodeBatch = async (batch: Pending[]): Promise<Result[]> => {
  // No header row: the endpoint expects id,street,city,state,zip and treats a
  // header as an address.
  const csv = batch
    .map((p, i) =>
      [String(i), p.street, p.town, p.state, p.zip].map((v) => csvCell(v ?? '')).join(',')
    )
    .join('\n');

  const form = new FormData();
  form.append('addressFile', new Blob([csv], { type: 'text/csv' }), 'addresses.csv');
  form.append('benchmark', BENCHMARK);

  const res = await fetch(CENSUS_URL, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Census: HTTP ${res.status}`);
  const text = await res.text();

  const seen = new Map<string, Result>();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const f = splitCsv(line);
    const idx = Number(f[0]);
    const source = batch[idx];
    if (!source) continue;

    const matched = f[2] === 'Match';
    // "lon,lat" — in that order, which is the opposite of how everything else
    // here writes a coordinate, and an easy silent swap.
    const coords = (f[5] ?? '').split(',');
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);

    if (matched && Number.isFinite(lat) && Number.isFinite(lon)) {
      seen.set(source.key, {
        address_key: source.key,
        lat,
        lon,
        // "Exact" is a rooftop-quality match; "Non_Exact" was interpolated along
        // the street segment, which is good to a house or two and well inside
        // the half-mile the tightest comp tier asks for.
        precision: f[3] === 'Exact' ? 'rooftop' : 'interpolated',
      });
    } else {
      seen.set(source.key, { address_key: source.key, lat: null, lon: null, precision: 'failed' });
    }
  }

  // Anything the response did not mention at all is still recorded, or the next
  // run asks about it again forever.
  for (const p of batch) {
    if (!seen.has(p.key)) {
      seen.set(p.key, { address_key: p.key, lat: null, lon: null, precision: 'failed' });
    }
  }
  return [...seen.values()];
};

const writeResults = async (rows: Result[]) => {
  for (let i = 0; i < rows.length; i += 500) {
    const slice = rows.slice(i, i + 500);
    const res = await fetch(`${URL_}/rest/v1/idx_geocodes?on_conflict=address_key`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(slice),
    });
    if (!res.ok) throw new Error(`idx_geocodes upsert: HTTP ${res.status} ${await res.text()}`);
  }
};

/* -------------------------------------------------------------------------- */

const main = async () => {
  console.log('Reading addresses...');

  const [active, archive, existing] = await Promise.all([
    // Active listings are the SUBJECTS of an estimate, so they need a
    // coordinate as much as the comps do.
    // Rentals excluded: a rental is never the subject of an estimate and never
    // a comp, so geocoding the ~7,000 of them would be a quarter of the run for
    // coordinates nothing reads.
    allRows(
      'idx_listings?select=address,town,state,zip,street_no,street_name&feed=eq.active&state=eq.MA&prop_type=neq.RN&address=not.is.null'
    ),
    allRows('idx_sold_archive?select=address,town,state,zip,street_no,street_name&address=not.is.null'),
    allRows('idx_geocodes?select=address_key' as string) as unknown as Promise<
      { address_key: string }[]
    >,
  ]);

  const done = new Set(existing.map((r) => r.address_key));

  const pending = new Map<string, Pending>();
  for (const r of [...active, ...archive]) {
    const key = addressKey(r.address, r.town, r.state, r.zip);
    if (done.has(key) || pending.has(key)) continue;
    /*
     * The street line the geocoder sees, preferring the feed's own parts.
     *
     * "228 Wiswall Rd Unit 3" matches far worse than "228 Wiswall Rd" — a unit
     * number is not part of a street address as far as the TIGER files are
     * concerned. street_no/street_name are exactly those parts, kept by
     * migration 20260920100000; where they are still NULL (any row ingested
     * before the next full sync) the composed address has the unit stripped
     * off instead.
     */
    const street =
      r.street_no && r.street_name
        ? `${r.street_no} ${r.street_name}`
        : (r.address ?? '').replace(/\s+Unit\s+\S+$/i, '');
    if (!street.trim() || !r.town) continue;
    pending.set(key, {
      key,
      street: street.trim(),
      town: r.town,
      state: r.state ?? 'MA',
      zip: (r.zip ?? '').replace(/[^0-9]/g, '').slice(0, 5),
    });
  }

  const queue = [...pending.values()].slice(0, argLimit);
  console.log(
    `${active.length} active + ${archive.length} archived addresses, ${done.size} already geocoded, ${queue.length} to do.`
  );
  if (queue.length === 0) {
    console.log('Nothing to geocode.');
    return;
  }

  let matched = 0;
  let failed = 0;
  for (let i = 0; i < queue.length; i += BATCH) {
    const batch = queue.slice(i, i + BATCH);
    process.stdout.write(
      `  batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(queue.length / BATCH)} (${batch.length})... `
    );
    try {
      const results = await geocodeBatch(batch);
      await writeResults(results);
      const good = results.filter((r) => r.precision !== 'failed').length;
      matched += good;
      failed += results.length - good;
      console.log(`${good} matched, ${results.length - good} not`);
    } catch (err) {
      // One bad batch must not lose the batches already written. The addresses
      // in it simply have no row yet, so the next run picks them up.
      console.log(`failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nDone. ${matched} geocoded, ${failed} unmatched.`);
};

main().catch((err) => {
  console.error('geocode-listings failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
