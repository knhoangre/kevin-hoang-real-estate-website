/**
 * Writes src/lib/idx-codes.ts — the MLS PIN coded-field lookup.
 *
 *   node scripts/generate-idx-codes.mjs
 *
 * WHY THIS EXISTS. Most descriptive columns in the IDX feed are letter codes:
 * HEATING is "B,N", APPLIANCES is "A,C,F,I,K,L", FLOORING is "C,M". Until this
 * existed the listing pages simply omitted all of them, because printing "B,N"
 * helps nobody and guessing at expansions would fabricate details about another
 * brokerage's listing.
 *
 * THE CODES ARE NOT GLOBAL — THEY ARE PER PROPERTY TYPE. HEATING code "C" is
 * "Gas" on a rental, "Hot Air Gravity" on a single-family, and "Hot Water
 * Baseboard" on a condo or multi-family. A flat code->label map would be wrong
 * on thousands of listings while looking perfectly plausible, which is the worst
 * kind of wrong. The generated structure is therefore field -> propType -> code.
 *
 * Source: https://h3o.mlspin.com/tools/idx/idxDownloads/field_reference.asp —
 * public, like towns.asp and offices.asp and unlike the listing feeds. Columns:
 *   sf|cc|mf|ld|ci|bu|rn|Field|Short|Medium|Long|mh
 * where the seven leading flags say which property types a row applies to,
 * `Short` is the code as it appears in the feed and `Long` is the label.
 *
 * NOT part of `npm run build`: the output is committed, so the build needs no
 * network. Re-run when MLS PIN revises the reference (it is dated on the IDX
 * downloads page).
 */
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://h3o.mlspin.com/tools/idx/idxDownloads/field_reference.asp';
const OUT = 'src/lib/idx-codes.ts';

/** Feed property type -> its flag column in the reference file. */
const TYPE_COLUMNS = { SF: 0, CC: 1, MF: 2, RN: 6 };

/**
 * The coded fields the listing pages actually render.
 *
 * Deliberately a list rather than "everything": the reference carries 162
 * fields, most of them agent-facing (showing instructions, commission terms,
 * lockbox details) and several of them not permitted in an IDX display at all.
 */
const FIELDS = [
  'APPLIANCES', 'BASEMENT_FEATURE', 'CC_TYPE', 'CONSTRUCTION',
  'COOLING', 'ELECTRIC_FEATURE', 'ENERGY_FEATURES', 'EXTERIOR',
  'EXTERIOR_FEATURES', 'FLOORING', 'GARAGE_PARKING',
  'HANDICAP_AMENITIES', 'HEATING', 'HOT_WATER', 'INSULATION_FEATURE',
  'INTERIOR_FEATURES', 'LAUNDRY_FEATURES', 'LOT_DESCRIPTION',
  'MF_TYPE', 'PARKING_FEATURE', 'PETS_ALLOWED', 'POOL_DESCRIPTION',
  'RN_TYPE', 'ROAD_TYPE', 'ROOF_MATERIAL', 'SEWER', 'SEWER_AND_WATER',
  'SF_TYPE', 'STATUS', 'STYLE', 'UNIT_PLACEMENT', 'WATER', 'WATERFRONT',
  'WATERVIEW_FEATURES', 'YEAR_BUILT_DESCRP',
];

// FOUNDATION, AMENITIES and LEAD_PAINT are in the MLS but NOT in the IDX
// export — Attachment C limits which fields are syndicated. Measured at 0%
// fill across the live feeds before being dropped, rather than assumed.

const res = await fetch(SOURCE);
if (!res.ok) {
  console.error(`idx-codes: HTTP ${res.status} from ${SOURCE}`);
  process.exit(1);
}

// cp1252, like the listing feeds — labels carry curly punctuation.
const text = new TextDecoder('windows-1252').decode(await res.arrayBuffer());
const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim() !== '');

const header = lines[0].split('|').map((h) => h.trim());
if (header[7] !== 'Field' || header[8] !== 'Short' || header[10] !== 'Long') {
  console.error(`idx-codes: unexpected header "${lines[0]}" — refusing to write`);
  process.exit(1);
}

const wanted = new Set(FIELDS);
/** field -> propType -> code -> label */
const codes = {};
let rows = 0;

for (const line of lines.slice(1)) {
  const f = line.split('|');
  if (f.length < 11) continue;

  const field = (f[7] ?? '').trim();
  if (!wanted.has(field)) continue;

  const code = (f[8] ?? '').trim();
  const label = (f[10] ?? '').trim();
  if (!code || !label) continue;

  for (const [type, col] of Object.entries(TYPE_COLUMNS)) {
    if (f[col] !== '1') continue;
    codes[field] ??= {};
    codes[field][type] ??= {};
    // First definition wins. A duplicate (field, type, code) in the source
    // would be a contradiction in the reference itself; keeping the first is
    // stable across regenerations, where last-wins would flip on a reordering.
    if (!(code in codes[field][type])) {
      codes[field][type][code] = label;
      rows += 1;
    }
  }
}

const missing = FIELDS.filter((f) => !codes[f]);
if (missing.length) {
  console.warn(`idx-codes: no rows found for ${missing.join(', ')} — check the field names`);
}

if (rows === 0) {
  console.error('idx-codes: nothing parsed — refusing to write');
  process.exit(1);
}

// Sorted so a regeneration produces a readable diff rather than a reshuffle.
const sorted = Object.fromEntries(
  Object.entries(codes).sort(([a], [b]) => a.localeCompare(b)).map(([field, byType]) => [
    field,
    Object.fromEntries(
      Object.entries(byType).sort(([a], [b]) => a.localeCompare(b)).map(([type, map]) => [
        type,
        Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b))),
      ])
    ),
  ])
);

writeFileSync(
  OUT,
  `/**\n` +
    ` * GENERATED FILE — do not edit by hand.\n` +
    ` *\n` +
    ` * MLS PIN coded-field labels, from ${SOURCE}\n` +
    ` * (public, unlike the listing feeds themselves).\n` +
    ` *\n` +
    ` * Shape: field -> property type -> code -> label. The property type is NOT\n` +
    ` * optional: HEATING "C" is "Gas" on a rental, "Hot Air Gravity" on a\n` +
    ` * single-family and "Hot Water Baseboard" on a condo.\n` +
    ` *\n` +
    ` * Regenerate with: node scripts/generate-idx-codes.mjs\n` +
    ` * Last generated: ${new Date().toISOString().slice(0, 10)}\n` +
    ` */\n\n` +
    `export type IdxPropType = 'SF' | 'CC' | 'MF' | 'RN';\n\n` +
    `export const IDX_CODES: Record<\n` +
    `  string,\n` +
    `  Partial<Record<IdxPropType, Record<string, string>>>\n` +
    `> = ${JSON.stringify(sorted, null, 2)};\n`
);

console.log(
  `idx-codes: wrote ${OUT} — ${Object.keys(sorted).length} fields, ${rows} code definitions`
);
