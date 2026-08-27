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

const retiredSlugs = new Set(retired.map((r) => r.slug));

/**
 * `redirectTo` is either a surviving blog slug, or a site path starting with
 * `/` when the best home for a retired URL is a page rather than a post — the
 * town-guide index for the commercial-market pieces, /first-time-buyers for a
 * post the guide already covers better.
 */
const isPath = (target) => target.startsWith('/');
const toUrl = (target) => (isPath(target) ? target : `/blog/${target}`);

/**
 * Follows `redirectTo` until it lands on a slug that is not itself retired.
 *
 * This matters when a post that was already a redirect TARGET is later retired:
 * without it the old URL 301s to the newly-retired post, which 301s again. A
 * chain still resolves, but it dilutes what passes through and it breaks
 * outright if the chain ever grows past what a crawler will follow. Flattening
 * here means every retired URL is exactly one hop from a live page.
 */
const resolve = (slug) => {
  const seen = new Set();
  let current = slug;
  while (!isPath(current) && retiredSlugs.has(current)) {
    if (seen.has(current)) {
      throw new Error(`redirect loop through /blog/${current}`);
    }
    seen.add(current);
    const next = retired.find((r) => r.slug === current)?.redirectTo;
    if (!next) throw new Error(`no redirectTo for retired slug ${current}`);
    current = next;
  }
  return current;
};

const blogRedirects = retired.map(({ slug, redirectTo }) => ({
  source: `/blog/${slug}`,
  destination: toUrl(resolve(redirectTo)),
  permanent: true,
}));

// Keep every redirect this file does not own. Derived from the retired set
// rather than matched against one slug prefix — the prefix test only knew
// about the 100 auto-generated `metro-boston-real-estate-*` posts, so the
// first non-matching slug added here would have been emitted twice: once
// preserved from the previous run, once regenerated.
const ownedSources = new Set(retired.map((r) => `/blog/${r.slug}`));
const others = (config.redirects ?? []).filter((r) => !ownedSources.has(r.source));

config.redirects = [...others, ...blogRedirects];
writeFileSync('vercel.json', JSON.stringify(config, null, 2) + '\n');
// A redirect to a post that no longer exists is worse than the thin post it
// replaced: it turns a 200 into a 404 behind a 301. The build cannot see this,
// so it is checked here, where the map is written.
const live = new Set(
  [...readFileSync('src/data/blogData.ts', 'utf8').matchAll(/\n    slug:\s*"([^"]+)"/g)]
    .map((m) => m[1])
);
const dangling = blogRedirects.filter(
  (r) => r.destination.startsWith('/blog/') && !live.has(r.destination.slice('/blog/'.length))
);
if (dangling.length) {
  console.error('redirects: destinations that are not live posts —');
  for (const r of dangling) console.error(`  ${r.source} -> ${r.destination}`);
  process.exit(1);
}

console.log(
  `redirects: wrote ${blogRedirects.length} blog 301s into vercel.json ` +
  `(${new Set(blogRedirects.map((r) => r.destination)).size} distinct destinations, all live)`
);
