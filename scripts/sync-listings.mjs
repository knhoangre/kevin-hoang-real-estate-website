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
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const OUT = 'src/data/soldListings.ts';

// --- photo localisation ---------------------------------------------------
// Listing photos used to be referenced as Supabase Storage object URLs straight
// out of image_urls, and that was the entire Supabase egress bill: 339 photos,
// 228 MB, full-resolution PNGs rendered into a ~360px card, every object served
// with `cache-control: no-cache` so the CDN revalidated and re-transferred on
// every single request. Supabase's own /render/image/ transform endpoint is a
// paid feature and answers 403 on the free plan, so the resize happens here and
// the results are committed and served from Vercel instead.
//
// 900px covers the card at 2x DPR. WebP because these are photographs that were
// stored as PNG.
const PHOTO_DIR = 'public/listings';
const PHOTO_WIDTH = 900;
const PHOTO_QUALITY = 78;

// The social card for a listing page, cropped from its first photo.
//
// <Seo> declares og:image as 1200x630 and CLAUDE.md is emphatic that whatever
// is passed must ACTUALLY be that size — 65 pages once promised those
// dimensions over an 800x500 or 500x300 crop, and the ones under Facebook's
// 600x315 floor unfurled as a thumbnail or not at all. The on-page photos stay
// 900px wide because that is what the page needs; this is the same discipline
// as ogVariant() in src/lib/images.ts, which widens a content image for the
// card without touching the one the page renders.
//
// Cropped from the committed WebP rather than re-fetching the original, so a
// re-sync costs nothing. 900 -> 1200 is a 1.33x upscale, which is invisible at
// the size a social card is actually displayed.
const OG_NAME = 'og.jpg';
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Storage object path -> local path, e.g.
 *   https://…/object/public/property-images/73288339/1769233871163-0.png
 *   -> { file: 'public/listings/73288339/1769233871163-0.webp',
 *        href: '/listings/73288339/1769233871163-0.webp' }
 *
 * Returns null for anything that is not a property-images object URL, which is
 * how an already-local path survives a re-sync untouched.
 */
const localPathFor = (url) => {
  const m = /\/object\/public\/property-images\/(.+)$/.exec(String(url ?? ''));
  if (!m) return null;
  const rel = decodeURIComponent(m[1]).split('?')[0].replace(/\.[^./]+$/, '') + '.webp';
  // Refuse anything that could climb out of the photo directory.
  if (rel.includes('..')) return null;
  return { file: join(PHOTO_DIR, rel), href: `/listings/${rel}` };
};

const photoStats = { downloaded: 0, reused: 0, failed: 0, pruned: 0, og: 0 };
const kept = new Set();

/**
 * Downloads and re-encodes one photo, or reuses the committed copy.
 *
 * A failure returns the original Supabase URL rather than throwing: the photo
 * still renders, and one bad object must not cost us the whole snapshot.
 */
const localizePhoto = async (url) => {
  const target = localPathFor(url);
  if (!target) return url;

  kept.add(target.file);

  if (existsSync(target.file)) {
    photoStats.reused += 1;
    return target.href;
  }

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const out = await sharp(buf)
      .resize({ width: PHOTO_WIDTH, withoutEnlargement: true })
      .webp({ quality: PHOTO_QUALITY })
      .toBuffer();
    mkdirSync(dirname(target.file), { recursive: true });
    writeFileSync(target.file, out);
    photoStats.downloaded += 1;
    return target.href;
  } catch (err) {
    photoStats.failed += 1;
    kept.delete(target.file);
    console.warn(`sync-listings: could not localize ${url} (${err.message}) — keeping the remote URL`);
    return url;
  }
};

/**
 * Writes public/listings/<mls>/og.jpg from a listing's first photo.
 *
 * Returns the href, or null when there is no photo to crop or the crop fails —
 * in which case the page falls back to SITE.defaultOgImage, which is always the
 * right size. A missing card is a worse unfurl; a wrongly-sized one is a broken
 * one, and the fallback is neither.
 */
const buildOgImage = async (localHref) => {
  if (!localHref || !localHref.startsWith('/listings/')) return null;

  const source = join(PHOTO_DIR, localHref.slice('/listings/'.length));
  const dir = dirname(source);
  const file = join(dir, OG_NAME);
  const href = `/listings/${dir.slice(PHOTO_DIR.length + 1)}/${OG_NAME}`;

  kept.add(file);
  if (existsSync(file)) return href;

  try {
    const out = await sharp(source)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82 })
      .toBuffer();
    writeFileSync(file, out);
    photoStats.og += 1;
    return href;
  } catch (err) {
    kept.delete(file);
    console.warn(`sync-listings: could not build an OG card for ${localHref} (${err.message})`);
    return null;
  }
};

/** Every file under public/listings that no live listing references. */
const prunePhotos = () => {
  const walk = (dir) => {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  };
  for (const file of walk(PHOTO_DIR)) {
    if (!kept.has(file)) {
      rmSync(file);
      photoStats.pruned += 1;
    }
  }
};

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

/**
 * A DATE column arrives as "2026-03-14" and a timestamp as "2026-03-14T…".
 * Either way only the calendar day is kept: the page prints a month and a year,
 * and the sitemap wants a plain ISO date.
 *
 * Anything that will not parse becomes null rather than a best guess, so the
 * page omits the sold line entirely. Same rule as lastmod in routes.mjs — an
 * absent date is ignored, a wrong one is believed.
 */
const soldDate = (raw) => {
  if (!raw) return null;
  const iso = String(raw).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(iso)) ? iso : null;
};

/** Trims to null, so an empty textarea does not become an empty prose block. */
const text = (raw) => {
  const s = String(raw ?? '').trim();
  return s === '' ? null : s;
};

/** Mirrors the properties_represented_check constraint. */
const REPRESENTED = new Set(['buyer', 'seller', 'both']);

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

// Sequential rather than Promise.all: this is a few hundred multi-megabyte
// downloads against a free-tier bucket, and hammering it in parallel is how you
// get rate-limited halfway through and end up with a half-localized snapshot.
const listings = [];
for (const r of rows) {
  const { town, townSlug } = canonicalTown(r.town);
  const urls = Array.isArray(r.image_urls) ? r.image_urls.filter(Boolean) : [];
  const images = [];
  for (const url of urls) images.push(await localizePhoto(url));

  listings.push({
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
    // The four detail fields, added for /properties/<slug>. Each is nullable
    // and each is omitted by the page when absent — a listing with no
    // description renders photos and specs rather than filler, and one with no
    // sold_date says nothing about when it closed rather than guessing.
    soldDate: soldDate(r.sold_date),
    description: text(r.description),
    listPrice: r.list_price ?? null,
    represented: REPRESENTED.has(r.represented) ? r.represented : null,
    images,
    ogImage: await buildOgImage(images[0]),
  });
}

prunePhotos();

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
 * \`images\` are LOCAL paths under /listings/, not Supabase Storage URLs. The
 * files live in public/listings/ and are generated by the same script — they are
 * part of this output and are committed with it. Photos are served from Vercel
 * because serving them from Supabase Storage cost 228 MB of egress per full page
 * read, on a free tier. A remaining supabase.co URL here means that one photo
 * failed to download on the last sync; re-run the script.
 *
 * Last synced: ${new Date().toISOString().slice(0, 10)}
 */

export interface SoldListing {
  id: number;
  mlsnum: string;
  /** Stable per-row key. The /properties/<slug> URL, and the card anchor. */
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
  /** ISO date the sale recorded, or null. Null renders no sold line at all. */
  soldDate: string | null;
  /** Kevin's own prose. Null renders no prose block — never a placeholder. */
  description: string | null;
  /** Asking price, for the closed-vs-asked comparison. */
  listPrice: number | null;
  /** Which side was represented, or null to make no claim either way. */
  represented: 'buyer' | 'seller' | 'both' | null;
  images: string[];
  /**
   * A 1200x630 crop of the first photo, for og:image. Null falls back to
   * SITE.defaultOgImage — never to a photo of the wrong size, which unfurls
   * worse than the generic card.
   */
  ogImage: string | null;
}

export const soldListings: SoldListing[] = ${JSON.stringify(listings, null, 2)};

/** Listings in one town, by its areaServed slug. Empty when there are none. */
export const listingsForTown = (townSlug: string): SoldListing[] =>
  soldListings.filter((l) => l.townSlug === townSlug);

/** One listing by its slug, for the /properties/<slug> route. */
export const listingBySlug = (slug: string): SoldListing | undefined =>
  soldListings.find((l) => l.slug === slug);
`;

writeFileSync(OUT, body);

const sold = listings.filter((l) => /sold/i.test(l.status)).length;
console.log(
  `sync-listings: wrote ${OUT} — ${listings.length} listings ` +
  `(${sold} sold, ${listings.length - sold} other), ` +
  `${new Set(listings.map((l) => l.townSlug).filter(Boolean)).size} towns with a guide`
);
console.log(
  `sync-listings: photos — ${photoStats.downloaded} downloaded, ${photoStats.reused} reused, ` +
  `${photoStats.pruned} pruned, ${photoStats.og} OG cards, ${photoStats.failed} left remote`
);
if (photoStats.failed) {
  console.warn(
    `sync-listings: ${photoStats.failed} photo(s) still point at Supabase Storage and will\n` +
    '  bill egress on every page view. Re-run this script to retry them.'
  );
}
