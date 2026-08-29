/**
 * Pulls the properties table out of Supabase and writes src/data/soldListings.ts.
 *
 *   node scripts/sync-listings.mjs
 *
 * NOT part of `npm run build`, deliberately — the same discipline as
 * scripts/generate-blog-redirects.mjs and scripts/generate-icons.mjs. The output
 * is committed, so the build stays deterministic and needs no network and no
 * database credentials. Run this after adding or editing a listing in
 * /admin/properties, then commit the result.
 *
 * WHY A SNAPSHOT AT ALL. /properties fetched from Supabase inside an effect, so
 * at static-generation time the component rendered its loading branch and the
 * prerendered HTML contained a heading, three explanatory paragraphs and a
 * spinner. Every crawler, every social unfurler and every AI retriever saw a
 * page with no listings on it — on the one page whose entire subject is
 * listings. A committed snapshot puts the real content in the HTML; the live
 * fetch stays, and revalidates after hydration.
 *
 * The listings are also the only first-party, independently verifiable evidence
 * on the site — actual closings rather than claims about them. That is worth
 * considerably more to both search and a reader than another page of prose.
 *
 * SAFE UN-CONFIGURED. With no Supabase credentials this exits 0 without writing,
 * leaving the committed snapshot in place. It never writes an empty file: an
 * empty result is far more likely to be a failed query or a changed RLS policy
 * than a genuinely emptied table, and silently blanking the page on a bad
 * network day is not a trade worth making.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/data/soldListings.ts';

// --- credentials ----------------------------------------------------------
// Read from the environment, falling back to .env — Vite loads that file, plain
// node does not, and this script is run by hand from a checkout.
const readEnvFile = () => {
  if (!existsSync('.env')) return {};
  return Object.fromEntries(
    readFileSync('.env', 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const i = line.indexOf('=');
        return i === -1 ? null : [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      })
      .filter(Boolean)
  );
};

const env = { ...readEnvFile(), ...process.env };
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

if (!URL_ || !KEY) {
  console.log('sync-listings: no Supabase credentials — skipping (this is not an error)');
  process.exit(0);
}

// --- the towns we claim to serve -----------------------------------------
// Parsed out of siteConfig.ts rather than duplicated, for the reason routes.mjs
// parses the data modules: a second copy of this list would drift from the one
// the schema, the sitemap and the footer all use.
const areaServed = () => {
  const src = readFileSync('src/lib/siteConfig.ts', 'utf8');
  const block = src.slice(src.indexOf('areaServed: ['));
  const entries = [
    ...block
      .slice(0, block.indexOf('],'))
      .matchAll(/\{\s*name:\s*'([^']+)',\s*slug:\s*'([^']+)'\s*\}/g),
  ].map((m) => ({ name: m[1], slug: m[2] }));
  if (entries.length === 0) throw new Error('no areaServed entries found in siteConfig.ts');
  return entries;
};

const TOWNS = areaServed();

/**
 * Canonicalises the free-text `town` column.
 *
 * The column holds "Newton, MA", "Newton" and "Brookline" — one field, three
 * formats, because it is typed by hand in the admin UI. Left alone, a listing in
 * "Newton, MA" and one in "Newton" are two different towns to any grouping, and
 * the town guides could never join against them.
 */
const canonicalTown = (raw) => {
  const name = String(raw ?? '')
    .replace(/,?\s*(MA|Massachusetts)\.?$/i, '')
    .trim()
    .replace(/\s+/g, ' ');
  const match = TOWNS.find((t) => t.name.toLowerCase() === name.toLowerCase());
  return { town: name, townSlug: match ? match.slug : null };
};

/**
 * Restores the leading zero on a Massachusetts ZIP.
 *
 * 8 of the 10 rows store "2459" rather than "02459" — the signature of a CSV
 * import that read the column as a number. Every MA ZIP begins with 0, so the
 * page was rendering "Newton, MA 2459". Padded on read rather than corrected in
 * the table: rewriting production data is a separate, deliberate decision, and
 * this keeps the rendered address right either way.
 */
const normalizeZip = (raw) => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits.length === 4 ? digits.padStart(5, '0') : digits;
};

/** "12 Main St" + "Newton" -> "12-main-st-newton". Stable, and unique per row. */
const slugify = (address, town, id) => {
  const base = `${address} ${town}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  // The id suffix guarantees uniqueness: two units at one street address are
  // ordinary in a condo building, and a duplicate key would silently drop a row.
  return `${base}-${id}`;
};

// --- fetch ----------------------------------------------------------------
const res = await fetch(
  `${URL_}/rest/v1/properties?select=*&is_active=eq.true&order=sale_price.desc.nullslast`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
);

if (!res.ok) {
  console.error(`sync-listings: query failed — HTTP ${res.status} ${await res.text()}`);
  process.exit(1);
}

const rows = await res.json();

if (!Array.isArray(rows) || rows.length === 0) {
  console.error(
    'sync-listings: query returned no rows — refusing to overwrite the snapshot.\n' +
    '  An empty result is far more often a broken query or an RLS change than an\n' +
    '  emptied table. Verify in Supabase, then delete the file by hand if the\n' +
    '  table really is empty.'
  );
  process.exit(1);
}

const listings = rows.map((r) => {
  const { town, townSlug } = canonicalTown(r.town);
  return {
    id: r.id,
    mlsnum: r.mlsnum ?? '',
    slug: slugify(r.address, town, r.id),
    status: (r.status ?? 'Sold').trim(),
    propertyType: (r.property_type ?? '').trim(),
    address: (r.address ?? '').trim(),
    town,
    townSlug,
    zipCode: normalizeZip(r.zip_code),
    salePrice: r.sale_price ?? null,
    bedrooms: r.bedrooms ?? null,
    fullBaths: r.full_baths ?? null,
    halfBaths: r.half_baths ?? null,
    livingArea: r.living_area ?? null,
    images: Array.isArray(r.image_urls) ? r.image_urls.filter(Boolean) : [],
  };
});

// --- report anything a human should look at -------------------------------
const unmatched = [...new Set(listings.filter((l) => !l.townSlug).map((l) => l.town))];
if (unmatched.length) {
  console.warn(
    `sync-listings: ${unmatched.length} town(s) outside SITE.areaServed: ${unmatched.join(', ')}.\n` +
    '  These still appear on /properties. They just do not link to a town guide,\n' +
    '  because there is no guide to link to. Add them to areaServed if they should.'
  );
}

const noPhotos = listings.filter((l) => l.images.length === 0).length;
if (noPhotos) console.warn(`sync-listings: ${noPhotos} listing(s) have no photos`);

// --- write ----------------------------------------------------------------
const body = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by scripts/sync-listings.mjs from the Supabase \`properties\` table.
 * Edit listings in /admin/properties, then re-run:
 *
 *   node scripts/sync-listings.mjs
 *
 * It is committed so that /properties can prerender real listings instead of a
 * spinner, and so the build needs neither network nor credentials.
 *
 * Last synced: ${new Date().toISOString().slice(0, 10)}
 */

export interface SoldListing {
  id: number;
  mlsnum: string;
  /** Stable per-row key, also used as the #listing-… anchor target. */
  slug: string;
  status: string;
  propertyType: string;
  address: string;
  /** Canonical town name, with any ", MA" suffix removed. */
  town: string;
  /** Matching slug in SITE.areaServed, or null when the town has no guide. */
  townSlug: string | null;
  zipCode: string;
  salePrice: number | null;
  bedrooms: number | null;
  fullBaths: number | null;
  halfBaths: number | null;
  livingArea: number | null;
  images: string[];
}

export const soldListings: SoldListing[] = ${JSON.stringify(listings, null, 2)};

/** Listings in one town, by its areaServed slug. Empty when there are none. */
export const listingsForTown = (townSlug: string): SoldListing[] =>
  soldListings.filter((l) => l.townSlug === townSlug);
`;

writeFileSync(OUT, body);

const sold = listings.filter((l) => /sold/i.test(l.status)).length;
console.log(
  `sync-listings: wrote ${OUT} — ${listings.length} listings ` +
  `(${sold} sold, ${listings.length - sold} other), ` +
  `${new Set(listings.map((l) => l.townSlug).filter(Boolean)).size} towns with a guide`
);
