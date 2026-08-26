/**
 * Writes dist/sitemap.xml after the Vite build.
 *
 * Written into dist/ rather than public/ so it stays out of git and is
 * regenerated on every deploy.
 */
import { writeFileSync } from 'node:fs';
import { ORIGIN, STATIC_ROUTES, BLOG_ROUTES, isPrivate } from './routes.mjs';

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Build date for routes with no content-derived timestamp. Better than omitting
// lastmod entirely — it tells crawlers when the page was last deployed.
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const urlEntry = ({ path, priority, changefreq }) =>
  [
    '  <url>',
    `    <loc>${esc(ORIGIN + path)}</loc>`,
    `    <lastmod>${BUILD_DATE}</lastmod>`,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority != null ? `    <priority>${priority.toFixed(1)}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n');

const all = [...STATIC_ROUTES, ...BLOG_ROUTES].filter((r) => !isPrivate(r.path));

if (all.length === 0) {
  console.error('sitemap: route list is empty — refusing to write');
  process.exit(1);
}

const seen = new Set();
for (const r of all) {
  if (seen.has(r.path)) {
    console.error(`sitemap: duplicate route ${r.path} — refusing to write`);
    process.exit(1);
  }
  seen.add(r.path);
}

writeFileSync(
  'dist/sitemap.xml',
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...all.map(urlEntry),
    '</urlset>',
    '',
  ].join('\n')
);

console.log(
  `sitemap: wrote dist/sitemap.xml — ${all.length} URLs ` +
  `(${all.length - BLOG_ROUTES.length} static, ${BLOG_ROUTES.length} blog)`
);
