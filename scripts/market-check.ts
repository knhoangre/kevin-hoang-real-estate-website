/**
 * Assertions for src/lib/market.ts and marketText.ts — the market reports.
 *
 *   node scripts/market-check.ts
 *
 * The reports publish numbers about real towns every month, unattended, and
 * the ways they go wrong are quiet ones: a window that ends today and reads its
 * own last week as a slowdown; a $1 auction placeholder dragging a median; a
 * parking space counted as a studio; homes under agreement counted as for
 * sale, or not counted at all because MLS PIN files them with the sales;
 * "listed in the last 30 days" claimed for listings that were merely already
 * there when tracking began. None of those errors. They just print a wrong
 * number with Kevin's name under it.
 *
 * The first half builds a market whose answers are known. The second runs the
 * sentence generators over every committed report and looks for "undefined",
 * "NaN" and blanks in prose. No dependencies, no network.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  TRACKING_SINCE,
  addMonths,
  bands,
  buildReport,
  cleanZip,
  edge,
  lastCompleteMonth,
  lastDay,
  monthWorthAPost,
  salesWindow,
  stats,
  supply,
  windowBounds,
  type Lease,
  type Listing,
  type MarketReport,
  type Sale,
} from '../src/lib/market.ts';
import {
  bandPhrase,
  buyerTakeaways,
  change,
  monthChanges,
  monthDescription,
  monthSummary,
  rankInYear,
  ratioPct,
  sellerTakeaways,
  townDescription,
  townSummary,
  windowSpan,
} from '../src/lib/marketText.ts';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures += 1;
};
const eq = (actual: unknown, expected: unknown, label: string) =>
  ok(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}${JSON.stringify(actual) === JSON.stringify(expected) ? '' : ` — got ${JSON.stringify(actual)}`}`
  );
const near = (actual: number | null, expected: number, label: string, tol = 1e-6) =>
  ok(actual !== null && Math.abs(actual - expected) <= tol, `${label}${actual !== null && Math.abs(actual - expected) <= tol ? '' : ` — got ${actual}`}`);

const sale = (price: number, list: number | null, date: string, extra: Partial<Sale> = {}): Sale => ({
  type: 'SF',
  price,
  list,
  date,
  sqft: 2000,
  beds: 3,
  zip: '02459',
  ...extra,
});

console.log('--- months ---');
eq(addMonths('2026-01', -1), '2025-12', 'a month back crosses the year');
eq(addMonths('2026-09', -11), '2025-10', 'eleven back from September is October');
eq(lastDay('2026-02'), '2026-02-28', 'February 2026 has 28 days');
eq(lastDay('2028-02'), '2028-02-29', 'and 2028 has 29');
eq(lastCompleteMonth('2026-10-03'), '2026-09', 'on October 3rd the last whole month is September');
eq(windowBounds('2026-09', 3, '2025-01-01'), { from: '2026-07-01', to: '2026-09-30' }, 'three months is July to September, not 91 days to today');
eq(windowBounds('2026-09', 12, '2025-10-18'), { from: '2025-10-18', to: '2026-09-30' }, 'a window never starts before the data does');

console.log('--- one set of sales ---');
{
  // Ten sales: five over asking, two at it, three under. Asking $1,000,000 each.
  const prices = [1_100_000, 1_050_000, 1_020_000, 1_010_000, 1_001_000, 1_000_000, 1_000_000, 990_000, 950_000, 900_000];
  const s = stats(prices.map((p) => sale(p, 1_000_000, '2026-09-10')), 1);
  eq(s.sales, 10, 'ten sales counted');
  near(s.median, 1_000_500, 'median is the mean of the middle two ($1,000,000 and $1,001,000)');
  near(s.over, 0.5, 'half sold over asking');
  near(s.at, 0.2, 'two sold exactly at it');
  near(s.under, 0.3, 'three under');
  near(s.ratio, 1.0005, 'median sale-to-asking');
  near(s.premium, 20_000, 'the median premium is over the five that went over, not all ten');
  near(s.ppsf, 500.25, 'median $/sq ft at 2,000 sq ft');
  eq(edge(s), 'sellers', 'half over asking is a sellers’ market');

  const four = stats(prices.slice(0, 4).map((p) => sale(p, 1_000_000, '2026-09-10')), 1);
  eq([four.sales, four.median, four.ratio, four.over], [4, null, null, null], 'four sales: a count, no medians');
}

console.log('--- what is not a sale price ---');
{
  const s = stats(
    [
      sale(1_000_000, 1, '2026-09-01'), // a $1 placeholder asking price
      sale(1_000_000, 300_000, '2026-09-01'), // 333%: a typo in one of them
      ...Array.from({ length: 5 }, () => sale(950_000, 1_000_000, '2026-09-01')),
    ],
    1
  );
  eq(s.sales, 7, 'both still count as sales');
  near(s.ratio, 0.95, 'neither is in the sale-to-asking median');
  near(s.over, 0, 'nor in the share over asking');
  const tiny = stats(Array.from({ length: 5 }, () => sale(500_000, 500_000, '2026-09-01', { sqft: 12 })), 1);
  eq(tiny.ppsf, null, 'a 12 sq ft "house" has no price per square foot');
}

console.log('--- windows ---');
{
  // One sale a day for a year and a half at a price that rises $1,000 a day.
  const all: Sale[] = [];
  for (let d = Date.parse('2025-04-01'); d <= Date.parse('2026-10-15'); d += 86_400_000) {
    const date = new Date(d).toISOString().slice(0, 10);
    all.push(sale(1_000_000 + all.length * 1000, 1_000_000, date));
  }
  const w12 = salesWindow(all, '2026-09', 12, '2025-01-01');
  eq(w12.byType.SF.sales, 365, 'twelve whole months, October to September');
  near(w12.byType.SF.perMonth, 365 / 12, 'a pace of 30.4 a month');
  const w3 = salesWindow(all, '2026-09', 3, '2025-01-01');
  eq(w3.byType.SF.sales, 92, 'July, August and September: 92 days');
  ok(!all.some((s) => s.date > '2026-09-30' && s.date <= w3.to), 'nothing from October leaks into a September report');
  const clipped = salesWindow(all, '2026-09', 12, '2026-04-01');
  eq(clipped.from, '2026-04-01', 'a window clipped by the data says where it starts');
  near(clipped.byType.SF.perMonth, 183 / 6, 'and its pace divides by the months it covers');
  eq(windowSpan(w3), 'July–September 2026', 'a window reads as its months');
}

console.log('--- what is on the market ---');
{
  const asOf = '2026-10-20';
  const l = (status: string, extra: Partial<Listing> = {}): Listing => ({
    type: 'SF',
    status,
    list: 1_000_000,
    sqft: 2000,
    beds: 3,
    firstSeen: TRACKING_SINCE,
    cutAt: null,
    cutFrom: null,
    ...extra,
  });
  const listings = [
    l('ACT'),
    l('NEW', { firstSeen: '2026-10-10' }),
    l('PCG', { cutAt: '2026-10-15', cutFrom: 1_100_000 }),
    l('BOM', { cutAt: '2026-09-01', cutFrom: 1_200_000 }), // cut, but 49 days ago
    l('UAG'), // MLS PIN files these with the sales
    l('CTG'),
    l('CSO'), // a status this does not know is neither
  ];
  const s = supply(listings, 24, asOf, TRACKING_SINCE);
  eq([s.available, s.pending], [4, 2], 'four for sale, two pending, the unknown status in neither');
  near(s.monthsSupply, 2, 'four for sale at two sales a month is two months');
  near(s.pendingShare, 1 / 3, 'a third of the market has a buyer');
  eq(s.cuts, 1, 'a cut 49 days ago is not a cut in the last 30');
  eq(s.fresh, 1, 'listings present at the first sync are not "new"');
  const early = supply(listings, 24, '2026-09-20', TRACKING_SINCE);
  eq(early.fresh, null, 'before tracking covers 30 days, freshness is unknown, not zero');
  eq(supply(listings, 0, asOf, TRACKING_SINCE).monthsSupply, null, 'no sales: no months of supply, not infinity');
}

console.log('--- price bands ---');
{
  const sales = [
    ...Array.from({ length: 6 }, () => sale(600_000, 600_000, '2026-05-01')),
    ...Array.from({ length: 6 }, () => sale(1_200_000, 1_100_000, '2026-05-01')),
  ];
  const listed: Listing[] = [{ type: 'CC', status: 'ACT', list: 650_000, sqft: 900, beds: 2, firstSeen: null, cutAt: null, cutFrom: null }];
  const b = bands(sales, listed);
  eq(b.map((x) => x.label), ['$500k–$750k', '$1M–$1.5M'], 'bands nothing touches are left out');
  eq([b[0].sales, b[0].available], [6, 1], 'a band counts sales by what they sold for and listings by what they ask');
  near(b[0].monthsSupply, 2, 'one for sale against six a year is two months');
  near(b[1].over, 1, 'every $1.2M sale went over');
  eq(bandPhrase(b[1]), 'between $1M and $1.5M', 'a band inside a sentence');
  eq(bandPhrase({ label: 'Under $500k', min: 0, max: 500_000 }), 'under $500k', 'the lowest band');
}

console.log('--- zips and rents ---');
{
  eq(cleanZip('2459'), '02459', 'a ZIP that lost its leading zero gets it back');
  eq(cleanZip('02459-1234'), '02459', 'ZIP+4 is five digits');
  const month = '2026-09';
  const sales = [
    ...Array.from({ length: 6 }, () => sale(1_000_000, 1_000_000, '2026-06-01', { zip: '02459' })),
    ...Array.from({ length: 5 }, () => sale(1_500_000, 1_500_000, '2026-06-01', { zip: '02468' })),
    sale(900_000, 900_000, '2026-06-01', { zip: '02641' }), // a Cape ZIP on a Newton sale
  ];
  const lease = (rent: number, bedrooms: number, subtype = 'D'): Lease => ({ rent, bedrooms, subtype, zip: '02459', date: '2026-09-05' });
  const r = buildReport({
    town: 'Testville',
    slug: 'testville-ma',
    state: 'MA',
    month,
    asOf: '2026-10-03',
    trackingSince: TRACKING_SINCE,
    coverage: { sales: '2025-01-01', leases: '2025-01-01' },
    sales,
    listings: [],
    leases: [...Array.from({ length: 5 }, () => lease(3000, 2)), lease(150, 0, 'G'), lease(250, 2)],
    rentalListings: [],
  });
  eq(r.zips.SF.map((z) => z.label), ['02459', '02468'], 'a ZIP with one sale is not a row of its own');
  eq(r.rentals.month.rows.map((c) => [c.label, c.n, c.median]), [['2 bedrooms', 5, 3000]], 'a parking space and a $250 "lease" are not rents');
  eq(r.yearAgo.month?.month, '2025-09', 'a year-ago month comes from the data when it reaches back');
  eq(r.yearAgo.windows.map((w) => w?.months ?? null), [null, 6, 3], 'and each window only when the data covers all of it');
}

console.log('--- who has the edge ---');
{
  const base = stats(Array.from({ length: 10 }, () => sale(1_000_000, 1_000_000, '2026-09-01')), 1);
  eq(edge({ ...base, ratio: 1.0, over: 0.5 }), 'sellers', 'half over asking');
  eq(edge({ ...base, ratio: 1.012, over: 0.3 }), 'sellers', 'a median above 101%');
  eq(edge({ ...base, ratio: 0.97, over: 0.1 }), 'buyers', 'a median at 97% with few over');
  eq(edge({ ...base, ratio: 0.97, over: 0.3 }), 'balanced', 'low median but a third went over');
  eq(edge({ ...base, ratio: null, over: null }), null, 'too few sales: no verdict');
}

console.log('--- words ---');
{
  eq(change(1_050_000, 1_000_000), 'up 5%', 'a rise');
  eq(change(1_005_000, 1_000_000), 'about the same', 'half a percent is noise');
  eq(change(null, 1_000_000), null, 'nothing to compare');
  eq(ratioPct(0.9986), '99.9%', 'sale-to-asking keeps a decimal');

  const series = (counts: number[]) =>
    ({
      series: counts.map((n, i) => ({
        month: addMonths('2026-09', i - 11),
        all: { sales: n },
        byType: { SF: { sales: n }, CC: { sales: 0 }, MF: { sales: 0 } },
      })),
    }) as unknown as MarketReport;
  eq(rankInYear(series([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]), null), 'the most in twelve months', 'a new high');
  eq(rankInYear(series([30, 6, 7, 8, 40, 10, 11, 12, 13, 14, 15, 20]), null), 'the most since February 2026', 'the last month that beat it');
  eq(rankInYear(series([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 3]), null), 'the fewest in twelve months', 'a new low');
  eq(rankInYear(series([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 15]), null), null, 'level with last month is not news');
  eq(rankInYear(series([5, 6, 7, 8, 9, 10, 11, 12, 13, 20, 10, 15]), null), null, 'beating only last month is not news');
}

console.log('--- every committed report reads cleanly ---');
{
  const dir = 'src/data/market';
  const towns = existsSync(dir) ? readdirSync(dir).filter((d) => !d.endsWith('.json')) : [];
  let reports = 0;
  const bad: string[] = [];
  for (const town of towns) {
    for (const f of readdirSync(join(dir, town)).filter((f) => f.endsWith('.json'))) {
      const r = JSON.parse(readFileSync(join(dir, town, f), 'utf8')) as MarketReport;
      reports += 1;
      const text = [
        townSummary(r),
        townDescription(r),
        monthSummary(r),
        monthDescription(r),
        ...monthChanges(r),
        ...buyerTakeaways(r),
        ...sellerTakeaways(r),
      ];
      for (const t of text) {
        if (/undefined|NaN|null|Infinity|\$—|—%|\[object/.test(t)) bad.push(`${town}/${f}: ${t}`);
      }
      if (monthWorthAPost(r) && monthDescription(r).length > 170) bad.push(`${town}/${f}: description is ${monthDescription(r).length} characters`);
    }
  }
  ok(reports > 0 || towns.length === 0, `${reports} committed reports read`);
  ok(bad.length === 0, `no blanks, NaN or undefined in any sentence${bad.length ? `:\n  ${bad.join('\n  ')}` : ''}`);
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('\nAll assertions passed.');
