/**
 * Writes this month's market reports into src/data/market/.
 *
 *   node scripts/sync-market.ts                  the month just ended, every town
 *   node scripts/sync-market.ts --month 2026-09  a given month
 *   node scripts/sync-market.ts --town Newton    one town
 *   node scripts/sync-market.ts --force          rewrite a report that exists
 *
 * Run on the 3rd of each month by .github/workflows/market-reports.yml, which
 * commits the result to main; Vercel deploys it like any other push. Like
 * sync-listings.mjs it is NOT part of `npm run build`: the build stays
 * deterministic and needs no network, and a report is committed data.
 *
 * WHY THE 3RD. A closing reaches the feed a day or two after it happens, so on
 * the 1st the month's last days are still missing. MLS PIN's sold feed reaches
 * back twelve months and about four days (measured: 2025-10-16 on 2026-10-20),
 * so on the 3rd it still holds the first day of the twelve-month window; much
 * later and that day's leases are gone (sales are in the archive either way).
 *
 * A REPORT IS NEVER REWRITTEN without --force. It is the only copy of a month's
 * numbers that outlives the feed, and next year's report for the same month
 * reads its year-ago figures out of it. So a re-run of the workflow on the 4th
 * changes nothing that was published on the 3rd, and fills in only a town that
 * failed.
 *
 * Runs on the HOST with plain Node 23+, like the check scripts, but unlike them
 * it imports @supabase/supabase-js from node_modules — the workflow runs
 * `npm ci` first. Reads the public anon key: everything it reads is public-read.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { SITE } from '../src/lib/siteConfig.ts';
import {
  TRACKING_SINCE,
  addMonths,
  buildReport,
  headline,
  lastCompleteMonth,
  monthWorthAPost,
  type MarketIndex,
  type MarketReport,
} from '../src/lib/market.ts';
import { fetchSalesCoverage, fetchTownRows, type TownRows } from '../src/lib/marketFetch.ts';

const DIR = 'src/data/market';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1] ?? null;
};
const force = args.includes('--force');
// Eastern time, not UTC: run in the evening here, UTC is already tomorrow, and
// "as of" is a date a reader in Massachusetts reads.
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const month = flag('month') ?? lastCompleteMonth(today);
if (!/^\d{4}-\d{2}$/.test(month)) throw new Error(`--month must be YYYY-MM, got ${month}`);
if (month >= today.slice(0, 7)) throw new Error(`${month} has not ended yet`);

// --- credentials -------------------------------------------------------------
// The environment first (the workflow), then .env (a checkout).
const fromDotEnv = (): Record<string, string> => {
  if (!existsSync('.env')) return {};
  return Object.fromEntries(
    readFileSync('.env', 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
  );
};
const env = { ...fromDotEnv(), ...process.env };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('sync-market: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
  process.exit(1);
}
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// --- which towns ----------------------------------------------------------------
const only = flag('town');
const towns = SITE.marketTowns
  .map((name) => SITE.areaServed.find((t) => t.name === name))
  .filter((t): t is (typeof SITE.areaServed)[number] => Boolean(t))
  .filter((t) => !only || t.name === only);
if (towns.length === 0) throw new Error(only ? `${only} is not in SITE.marketTowns` : 'SITE.marketTowns is empty');

const fileFor = (slug: string, m: string) => join(DIR, slug, `${m}.json`);

const readReport = (slug: string, m: string): MarketReport | null =>
  existsSync(fileFor(slug, m)) ? (JSON.parse(readFileSync(fileFor(slug, m), 'utf8')) as MarketReport) : null;

/**
 * Whole dollars for prices, four decimals for ratios and shares. A median of
 * two sales is often a half-dollar, and 0.5833333333333334 is noise in a file
 * that is read in review.
 */
const tidy = (_: string, v: unknown) =>
  typeof v === 'number' && !Number.isInteger(v) ? (Math.abs(v) >= 100 ? Math.round(v) : Number(v.toFixed(4))) : v;

// --- fetch ----------------------------------------------------------------------
const salesCoverage = (await fetchSalesCoverage(client)) ?? addMonths(month, -11) + '-01';
const fetched = new Map<string, TownRows>();
const failed: string[] = [];

for (const t of towns) {
  if (!force && existsSync(fileFor(t.slug, month))) {
    console.log(`${t.name}: ${month} already published — left as it is`);
    continue;
  }
  try {
    const rows = await fetchTownRows(client, t.name, month);
    // An empty year is a broken query or a changed policy far more often than a
    // town where nothing sold. Refuse it, the way sync-listings refuses to blank
    // /properties on a bad network day.
    if (rows.sales.length === 0) throw new Error('no sales came back');
    fetched.set(t.slug, rows);
    console.log(`${t.name}: ${rows.sales.length} sales, ${rows.listings.length} listed or pending, ${rows.leases.length} leases`);
  } catch (err) {
    failed.push(t.name);
    console.error(`${t.name}: ${err instanceof Error ? err.message : err}`);
  }
}

// How far back leases reach is a property of the feed, not of a town: the
// earliest lease anywhere. A quiet town's first lease being a week in does not
// mean its data starts there.
const leaseDates = [...fetched.values()].flatMap((r) => r.leases.map((l) => l.date)).sort();
const leasesCoverage = leaseDates[0] ?? salesCoverage;

// --- write ----------------------------------------------------------------------
for (const t of towns) {
  const rows = fetched.get(t.slug);
  if (!rows) continue;
  const report = buildReport({
    town: t.name,
    slug: t.slug,
    state: 'MA',
    month,
    asOf: today,
    trackingSince: TRACKING_SINCE,
    coverage: { sales: salesCoverage, leases: leasesCoverage },
    ...rows,
    previousYear: readReport(t.slug, addMonths(month, -12)),
  });
  mkdirSync(join(DIR, t.slug), { recursive: true });
  writeFileSync(fileFor(t.slug, month), `${JSON.stringify(report, tidy, 1)}\n`);
  console.log(`${t.name}: wrote ${fileFor(t.slug, month)}${monthWorthAPost(report) ? '' : ' (too few closings for a post)'}`);
}

// --- the index and the summary are rebuilt from every report on disk ------------
const index: MarketIndex = { towns: [] };
const summary = [];
for (const name of SITE.marketTowns) {
  const t = SITE.areaServed.find((a) => a.name === name);
  if (!t || !existsSync(join(DIR, t.slug))) continue;
  const months = readdirSync(join(DIR, t.slug))
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .map((f) => f.slice(0, 7))
    .sort();
  if (months.length === 0) continue;
  const reports = months.map((m) => readReport(t.slug, m) as MarketReport);
  const latest = reports[reports.length - 1];
  index.towns.push({
    town: t.name,
    slug: t.slug,
    latest: latest.month,
    posts: reports.filter(monthWorthAPost).map((r) => ({ month: r.month, published: r.asOf })),
  });
  summary.push(headline(latest));
}
writeFileSync(join(DIR, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
writeFileSync(join(DIR, 'summary.json'), `${JSON.stringify(summary, tidy, 1)}\n`);
console.log(`index: ${index.towns.length} towns, ${index.towns.reduce((n, t) => n + t.posts.length, 0)} posts`);

if (failed.length) {
  console.error(`sync-market: failed for ${failed.join(', ')} — re-run to fill them in`);
  process.exit(1);
}
