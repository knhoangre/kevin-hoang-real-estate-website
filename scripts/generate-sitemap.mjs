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

/**
 * `lastmod` is emitted ONLY where a real content date exists — which today
 * means the blog, where routes.mjs reads each post's `updated ?? date`.
 *
 * This used to stamp the build date on all 117 URLs. That is not a freshness
 * signal, it is noise: every page claimed to change on every deploy, including
 * the legal pages that had not been touched in a year. Google's guidance is
 * that lastmod must reflect the last significant change, and it discounts the
 * value for a whole sitemap once the dates stop being credible. An absent
 * lastmod is simply not used — the same "absent beats wrong" discipline that
 * governs SITE.geo and SITE.hours.
 */
const urlEntry = ({ path, priority, changefreq, lastmod }) =>
  [
    '  <url>',
    `    <loc>${esc(ORIGIN + path)}</loc>`,
    lastmod ? `    <lastmod>${esc(lastmod)}</lastmod>` : null,
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

const dated = all.filter((r) => r.lastmod).length;

console.log(
  `sitemap: wrote dist/sitemap.xml — ${all.length} URLs ` +
  `(${all.length - BLOG_ROUTES.length} static, ${BLOG_ROUTES.length} blog), ` +
  `${dated} with lastmod`
);
