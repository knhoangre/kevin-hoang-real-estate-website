/**
 * Single registry of public routes.
 *
 * Feeds scripts/generate-sitemap.mjs and scripts/generate-llms.mjs. Add new
 * public routes HERE as well as in src/AppRoutes.tsx — a route missing from
 * this file is missing from the sitemap, and a route missing from AppRoutes has
 * no prerendered file, which means it 404s on hard refresh even though in-app
 * navigation to it works.
 *
 * Town and blog slugs are READ OUT of the TypeScript data modules rather than
 * duplicated here, so they cannot drift. These are .ts files and this is a
 * plain .mjs build script, so they are parsed rather than imported.
 */
import { readFileSync } from 'node:fs';

export const ORIGIN = 'https://kevinhoang.co';

/** Extracts every `slug: "..."` from a data module. */
const slugsFrom = (file) => {
  const src = readFileSync(file, 'utf8');
  const slugs = [...src.matchAll(/\bslug:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (slugs.length === 0) throw new Error(`no slugs found in ${file}`);
  return slugs;
};

/** "January 10, 2026" -> "2026-01-10". Null if it will not parse. */
const toIsoDate = (display) => {
  const parsed = Date.parse(display);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString().slice(0, 10);
};

/**
 * Every post as `{ slug, lastmod }`, read out of blogData.ts.
 *
 * The fields are matched at their object indentation (`\n    slug:`) rather
 * than anywhere in the file, so a `date:` written inside a post's prose cannot
 * be mistaken for the field. Within each object `slug` precedes `updated` and
 * `date`, which is what lets this pair them up by position.
 *
 * `updated` wins over `date` when present: lastmod is meant to be the last
 * significant change, not the publication date.
 */
const blogEntries = () => {
  const src = readFileSync('src/data/blogData.ts', 'utf8');
  const marks = [...src.matchAll(/\n    (slug|date|updated):\s*"([^"]+)"/g)];

  const entries = [];
  let current = null;
  for (const [, field, value] of marks) {
    if (field === 'slug') {
      if (current) entries.push(current);
      current = { slug: value, date: null, updated: null };
    } else if (current) {
      current[field] = value;
    }
  }
  if (current) entries.push(current);

  if (entries.length === 0) throw new Error('no posts found in src/data/blogData.ts');

  return entries.map(({ slug, date, updated }) => ({
    slug,
    // Falls back to undefined rather than to today: an absent lastmod is
    // ignored, while a wrong one teaches crawlers to distrust the whole file.
    lastmod: toIsoDate(updated ?? date ?? '') ?? undefined,
  }));
};

export const TOWN_SLUGS = slugsFrom('src/data/neighborhoodData.ts');
export const BLOG_ENTRIES = blogEntries();
export const BLOG_SLUGS = BLOG_ENTRIES.map((e) => e.slug);

/** Never in the sitemap, disallowed in robots.txt, noindex at the page level. */
export const PRIVATE_PREFIXES = [
  '/auth',
  '/profile',
  '/complete-profile',
  '/admin',
  '/crm',
  '/open-house',
  '/events',
];

export const isPrivate = (path) =>
  PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

export const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },

  // Primary commercial landing pages — highest priority after the homepage.
  { path: '/needham-real-estate-agent', priority: 0.9, changefreq: 'monthly' },
  { path: '/home-valuation', priority: 0.9, changefreq: 'monthly' },
  { path: '/vietnamese-speaking-real-estate-agent', priority: 0.8, changefreq: 'monthly' },
  { path: '/relocation', priority: 0.8, changefreq: 'monthly' },

  // Town guides.
  { path: '/neighborhoods', priority: 0.8, changefreq: 'monthly' },
  ...TOWN_SLUGS.map((slug) => ({
    path: `/neighborhoods/${slug}`,
    priority: 0.8,
    changefreq: 'monthly',
  })),

  // The person. High priority: this is what "who is Kevin Hoang" resolves to,
  // and it carries the outbound profile links that corroborate the entity.
  { path: '/about', priority: 0.8, changefreq: 'monthly' },

  // Guides and evergreen content.
  { path: '/buyer', priority: 0.7, changefreq: 'monthly' },
  { path: '/seller', priority: 0.7, changefreq: 'monthly' },
  { path: '/first-time-buyers', priority: 0.7, changefreq: 'monthly' },
  { path: '/blog', priority: 0.7, changefreq: 'weekly' },
  { path: '/contact', priority: 0.7, changefreq: 'yearly' },
  { path: '/faq', priority: 0.6, changefreq: 'monthly' },
  { path: '/calculator', priority: 0.6, changefreq: 'yearly' },
  { path: '/properties', priority: 0.6, changefreq: 'weekly' },
  { path: '/testimonials', priority: 0.5, changefreq: 'monthly' },

  // Vietnamese. Real prerendered documents, paired with their English
  // counterparts by src/lib/viRoutes.ts. Kept in sync with AppRoutes.tsx by
  // hand like every other route — a route missing here is missing from the
  // sitemap, and one missing from AppRoutes 404s on hard refresh.
  { path: '/vi', priority: 0.8, changefreq: 'monthly' },
  { path: '/vi/mua-nha', priority: 0.7, changefreq: 'monthly' },
  { path: '/vi/ban-nha', priority: 0.7, changefreq: 'monthly' },
  { path: '/vi/dinh-gia-nha', priority: 0.7, changefreq: 'monthly' },
  { path: '/vi/cau-hoi-thuong-gap', priority: 0.6, changefreq: 'monthly' },
  { path: '/vi/khu-vuc', priority: 0.6, changefreq: 'monthly' },

  // Legal. Real pages, low priority — they exist for users and for trust
  // signals, not to rank.
  { path: '/privacy-policy', priority: 0.2, changefreq: 'yearly' },
  { path: '/terms-of-service', priority: 0.2, changefreq: 'yearly' },
  { path: '/disclaimer', priority: 0.2, changefreq: 'yearly' },
];

export const BLOG_ROUTES = BLOG_ENTRIES.map(({ slug, lastmod }) => ({
  path: `/blog/${slug}`,
  priority: 0.6,
  changefreq: 'monthly',
  lastmod,
}));
