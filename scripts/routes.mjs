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

export const TOWN_SLUGS = slugsFrom('src/data/neighborhoodData.ts');
export const BLOG_SLUGS = slugsFrom('src/data/blogData.ts');

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

  // Legal. Real pages, low priority — they exist for users and for trust
  // signals, not to rank.
  { path: '/privacy-policy', priority: 0.2, changefreq: 'yearly' },
  { path: '/terms-of-service', priority: 0.2, changefreq: 'yearly' },
  { path: '/disclaimer', priority: 0.2, changefreq: 'yearly' },
];

export const BLOG_ROUTES = BLOG_SLUGS.map((slug) => ({
  path: `/blog/${slug}`,
  priority: 0.6,
  changefreq: 'monthly',
}));
