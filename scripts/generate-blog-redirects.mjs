/**
 * Rewrites the blog `redirects` block in vercel.json from
 * scripts/retired-blog-slugs.json.
 *
 * Run after changing that JSON:  node scripts/generate-blog-redirects.mjs
 *
 * NEVER hand-edit the redirects in vercel.json — the two would drift and
 * retired URLs would start 404ing. The JSON is the source of truth.
 *
 * This is not part of `npm run build`: the retired set is frozen, and vercel.json
 * is committed.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const { retired } = JSON.parse(readFileSync('scripts/retired-blog-slugs.json', 'utf8'));
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));

const blogRedirects = retired.map(({ slug, redirectTo }) => ({
  source: `/blog/${slug}`,
  destination: `/blog/${redirectTo}`,
  permanent: true,
}));

// Keep any non-blog redirect somebody added by hand.
const others = (config.redirects ?? []).filter(
  (r) => !/^\/blog\/metro-boston-real-estate-/.test(r.source)
);

config.redirects = [...others, ...blogRedirects];
writeFileSync('vercel.json', JSON.stringify(config, null, 2) + '\n');
console.log(`redirects: wrote ${blogRedirects.length} blog 301s into vercel.json`);
