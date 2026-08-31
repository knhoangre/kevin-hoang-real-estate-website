/**
 * Writes supabase/functions/_shared/idx-towns.ts — MLS PIN TOWN_NUM -> town name.
 *
 *   node scripts/generate-idx-towns.mjs
 *
 * The IDX feeds identify a town only by a numeric code, so without this table
 * every listing renders as "MA 02494" with no town name — on a site whose whole
 * search is organised by town.
 *
 * NOT part of `npm run build`, the same discipline as sync-listings.mjs: the
 * output is committed so the build needs no network. Re-run it when MLS PIN
 * updates the reference table (it is dated on the IDX downloads page; the
 * current one is 1/26/2026).
 *
 * This endpoint needs NO authentication, unlike the listing feeds themselves —
 * the reference tables are public. That is why this is a plain build script
 * while the feed ingest has to be a credentialed server-side job.
 */
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://h3o.mlspin.com/tools/idx/idxDownloads/towns.asp';
// A .ts module rather than .json: Deno needs an import assertion for JSON, and
// the Edge Function that consumes this is the only consumer. It lives under
// functions/_shared because the parser runs ONLY server-side — the app reads
// resolved town names out of the database and never touches the feed.
const OUT = 'supabase/functions/_shared/idx-towns.ts';

const res = await fetch(SOURCE);
if (!res.ok) {
  console.error(`idx-towns: HTTP ${res.status} from ${SOURCE}`);
  process.exit(1);
}

const text = await res.text();
const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim() !== '');

// TOWN_NUM|LONG|COUNTY|STATE
const header = lines[0].split('|').map((h) => h.trim());
const numCol = header.indexOf('TOWN_NUM');
const nameCol = header.indexOf('LONG');
if (numCol === -1 || nameCol === -1) {
  console.error(`idx-towns: unexpected header ${lines[0]} — refusing to write`);
  process.exit(1);
}

const towns = {};
for (const line of lines.slice(1)) {
  const f = line.split('|');
  const num = (f[numCol] ?? '').trim();
  const name = (f[nameCol] ?? '').trim();
  if (num && name) towns[num] = name;
}

if (Object.keys(towns).length === 0) {
  console.error('idx-towns: no towns parsed — refusing to write');
  process.exit(1);
}

// Sorted numerically so a re-run produces a stable diff rather than a reshuffle.
const sorted = Object.fromEntries(
  Object.entries(towns).sort(([a], [b]) => Number(a) - Number(b))
);

writeFileSync(
  OUT,
  `/**\n` +
    ` * GENERATED FILE — do not edit by hand.\n` +
    ` *\n` +
    ` * MLS PIN TOWN_NUM -> town name, from ${SOURCE}\n` +
    ` * (a public endpoint; the listing feeds themselves are not).\n` +
    ` *\n` +
    ` * Regenerate with: node scripts/generate-idx-towns.mjs\n` +
    ` * Last generated: ${new Date().toISOString().slice(0, 10)}\n` +
    ` */\n\n` +
    `export const IDX_TOWNS: Record<string, string> = ${JSON.stringify(sorted, null, 2)};\n`
);
console.log(`idx-towns: wrote ${OUT} — ${Object.keys(sorted).length} towns`);
