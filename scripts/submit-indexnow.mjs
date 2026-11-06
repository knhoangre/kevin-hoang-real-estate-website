/**
 * Pushes the site's URLs to the IndexNow endpoint after a build.
 *
 * Why this exists: ChatGPT Search and Microsoft Copilot retrieve through Bing's
 * index, so how quickly Bing knows a page changed is a direct input to whether
 * an answer engine can cite it. IndexNow notifies Bing (and Yandex, Seznam,
 * Naver) in minutes instead of waiting to be crawled. Google does not
 * participate; the sitemap and Search Console remain the path there.
 *
 * IT SUBMITS ONLY FROM VERCEL'S PRODUCTION BUILD. Vercel sets VERCEL_ENV there,
 * so a local build or a preview deploy is a no-op that exits 0, which is why it
 * can sit in `npm run build`. INDEXNOW_KEY in the environment overrides the key
 * below, on any build.
 *
 * The key is in this file rather than a secret because it is not one: IndexNow
 * fetches `public/<key>.txt`, whose entire body is the key, to prove the submitter
 * controls the host, so it is public by design. Until 2026-11-06 it had to be set
 * in Vercel by hand, and Kevin could not have known where; with it here, nothing
 * has to be set. A new key is `openssl rand -hex 16`, a new file in public/, and
 * this constant.
 *
 * A submission is a claim that these URLs changed. Submitting all 117 on every
 * deploy would be that claim made falsely, so this sends only URLs whose
 * lastmod is within RECENT_DAYS, and does nothing when that set is empty.
 */
import { ORIGIN, STATIC_ROUTES, BLOG_ROUTES, MARKET_ROUTES, isPrivate } from './routes.mjs';

/** The body of public/5df7d710b180f78d8ec839d8631fedb1.txt. */
const PUBLIC_KEY = '5df7d710b180f78d8ec839d8631fedb1';

const KEY =
  process.env.INDEXNOW_KEY || (process.env.VERCEL_ENV === 'production' ? PUBLIC_KEY : undefined);
const HOST = new URL(ORIGIN).host;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Only URLs changed this recently are submitted. */
const RECENT_DAYS = 30;

if (!KEY) {
  console.log('indexnow: not a production build — skipping (this is not an error)');
  process.exit(0);
}

if (!/^[a-zA-Z0-9-]{8,128}$/.test(KEY)) {
  console.error('indexnow: INDEXNOW_KEY must be 8-128 characters, [a-zA-Z0-9-]');
  process.exit(1);
}

const cutoff = new Date(Date.now() - RECENT_DAYS * 86400_000).toISOString().slice(0, 10);

const urlList = [...STATIC_ROUTES, ...MARKET_ROUTES, ...BLOG_ROUTES]
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
