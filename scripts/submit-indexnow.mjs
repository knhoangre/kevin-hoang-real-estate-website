/**
 * Pushes the site's URLs to the IndexNow endpoint after a build.
 *
 * Why this exists: ChatGPT Search and Microsoft Copilot retrieve through Bing's
 * index, so how quickly Bing knows a page changed is a direct input to whether
 * an answer engine can cite it. IndexNow notifies Bing (and Yandex, Seznam,
 * Naver) in minutes instead of waiting to be crawled. Google does not
 * participate; the sitemap and Search Console remain the path there.
 *
 * SAFE UN-CONFIGURED. With no INDEXNOW_KEY in the environment this is a no-op
 * that exits 0 — the same discipline as SITE.ga4Id gating <Analytics>, and the
 * reason it can sit in `npm run build` without firing from a local build or a
 * preview deploy.
 *
 * Setup:
 *   1. Generate a key: 8-128 hex characters. `openssl rand -hex 16`.
 *   2. Write it to `public/<key>.txt`, whose entire body is the key. IndexNow
 *      fetches that file to prove the submitter controls the host.
 *   3. Set INDEXNOW_KEY in the Vercel project's Production environment only.
 *
 * A submission is a claim that these URLs changed. Submitting all 117 on every
 * deploy would be that claim made falsely, so this sends only URLs whose
 * lastmod is within RECENT_DAYS, and does nothing when that set is empty.
 */
import { ORIGIN, STATIC_ROUTES, BLOG_ROUTES, isPrivate } from './routes.mjs';

const KEY = process.env.INDEXNOW_KEY;
const HOST = new URL(ORIGIN).host;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Only URLs changed this recently are submitted. */
const RECENT_DAYS = 30;

if (!KEY) {
  console.log('indexnow: INDEXNOW_KEY not set — skipping (this is not an error)');
  process.exit(0);
}

if (!/^[a-zA-Z0-9-]{8,128}$/.test(KEY)) {
  console.error('indexnow: INDEXNOW_KEY must be 8-128 characters, [a-zA-Z0-9-]');
  process.exit(1);
}

const cutoff = new Date(Date.now() - RECENT_DAYS * 86400_000).toISOString().slice(0, 10);

const urlList = [...STATIC_ROUTES, ...BLOG_ROUTES]
  .filter((r) => !isPrivate(r.path))
  // A route with no lastmod has no evidence it changed, so it is not claimed.
  // Those pages are found through the sitemap like any other.
  .filter((r) => r.lastmod && r.lastmod >= cutoff)
  .map((r) => ORIGIN + r.path);

if (urlList.length === 0) {
  console.log(`indexnow: nothing changed since ${cutoff} — nothing to submit`);
  process.exit(0);
}

// IndexNow caps a single submission at 10,000 URLs. Far below that here, but
// the guard costs nothing and a silent truncation would not.
if (urlList.length > 10_000) {
  console.error(`indexnow: ${urlList.length} URLs exceeds the 10,000 per-request limit`);
  process.exit(1);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList }),
});

// 200 accepted, 202 accepted but the key is still being validated. Anything
// else is reported and then swallowed: a rejected ping is worth knowing about,
// but it is not a reason to fail a deploy of a site that is otherwise fine.
if (res.status === 200 || res.status === 202) {
  console.log(`indexnow: submitted ${urlList.length} URLs changed since ${cutoff} (${res.status})`);
} else {
  console.error(`indexnow: endpoint returned ${res.status} ${res.statusText} — not failing the build`);
  console.error(await res.text().catch(() => ''));
}
