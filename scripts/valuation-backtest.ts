/**
 * How wrong is the estimator, against homes that actually sold?
 *
 *   node scripts/valuation-backtest.ts
 *   node scripts/valuation-backtest.ts --per-town 40
 *
 * WHAT THIS IS, AND WHAT IT IS NOT. scripts/valuation-check.ts asserts the
 * estimator recovers parameters it was not told, on a market generated from
 * known ones — that is a correctness test and it either passes or it does not.
 * This is a MEASUREMENT, and it has no pass mark: it takes homes that really
 * closed, hides each one from itself, asks the estimator what it is worth, and
 * compares that to what somebody actually paid.
 *
 * NO LOOKAHEAD. Each home is valued AS OF ITS OWN SETTLED DATE, and comps that
 * closed after it are removed. Without that the model would be shown sales from
 * the subject's future — including, in a thin town, the sales its own
 * transaction moved — and the error would come back flattering and meaningless.
 * This is the single easiest way to get a backtest wrong.
 *
 * WHY NOT BACKTEST AGAINST src/data/soldListings.ts. Kevin's ten closings have
 * `soldDate: null` and `listPrice: null` on every row, and most predate the
 * twelve-month IDX window, so they are not in the data at all. Ten rows would
 * also be a portfolio rather than a sample — the same reason TownSoldListings
 * refuses to present them as market data.
 *
 * READ THE BIAS FIRST. A mean absolute error of 12% with a bias near zero is a
 * model that is noisy; the same error with a bias of +10% is a model that is
 * wrong in one direction, which is far worse and not visible in an accuracy
 * figure alone.
 *
 * RE-RUN THIS after any change to the tiers, the adjustment grid or the
 * weighting — and again once the geocode backfill lands, which should be the
 * single largest improvement available: with no coordinates every valuation
 * resolves at tier 3 (town-wide) because tiers 0 to 2 all require a radius.
 */
import { readFileSync } from 'node:fs';
import { valuate, TIERS, type Comp, type ValuationSubject } from '../src/lib/valuation.ts';

const readEnvFile = (): Record<string, string> => {
  try {
    return Object.fromEntries(
      readFileSync('.env', 'utf8')
        .split('\n')
        .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
        })
    );
  } catch {
    return {};
  }
};

const env = { ...readEnvFile(), ...process.env } as Record<string, string>;
const URL_ = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
// The anon key is enough: this only ever reads, and idx_sold_archive is
// public-read like every other IDX table.
const KEY = env.VITE_SUPABASE_ANON_KEY;

if (!URL_ || !KEY) {
  console.log('valuation-backtest: Supabase env not set — nothing to measure.');
  process.exit(0);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const arg = (flag: string, fallback: number): number => {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  const n = Number(process.argv[i + 1]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const PER_TOWN = arg('--per-town', 25);

/**
 * Property types to measure. All three the estimator supports, by default —
 * each is shown on real listings, so each needs a number behind it. Condo and
 * multi-family were first measured on 2026-09-26 and the summary below is split
 * by type because their errors are not the same size: pooling them would let
 * single-family's accuracy vouch for multi-family's.
 */
const TYPES = (() => {
  const i = process.argv.indexOf('--types');
  const raw = i === -1 ? 'SF,CC,MF' : process.argv[i + 1] ?? '';
  return raw.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
})();

/** Mirrors SITE.areaServed. See the note on idx_archive_sold(). */
const TOWNS = [
  'Needham', 'Newton', 'Wellesley', 'Weston', 'Dover', 'Lexington', 'Concord',
  'Cambridge', 'Somerville', 'Waltham', 'Medford', 'Malden', 'Quincy',
  'Braintree', 'Brookline', 'Belmont', 'Winchester',
];

/** The query bounds, derived from the tiers so they cannot drift apart. */
const widest = TIERS.reduce(
  (a, t) => ({ months: Math.max(a.months, t.months), sqft: Math.max(a.sqft, t.sqftTolerance) }),
  { months: 0, sqft: 0 }
);

interface Scored {
  type: string;
  town: string;
  pct: number;
  comps: number;
  tier: number;
}

const main = async () => {
  const scored: Scored[] = [];
  let refused = 0;
  let rangeOnly = 0;

  for (const type of TYPES) for (const town of TOWNS) {
    // Most recent closings: a sample ordered on an axis uncorrelated with price,
    // which is the same justification medianAskingRent gives for its own cap.
    const res = await fetch(
      `${URL_}/rest/v1/idx_sold_archive?select=*&prop_type=eq.${type}&town=eq.${encodeURIComponent(town)}&order=settled_date.desc&limit=${PER_TOWN}`,
      { headers }
    );
    if (!res.ok) continue;
    const holdouts = (await res.json()) as (ValuationSubject & {
      sale_price: number | null;
      settled_date: string | null;
    })[];

    for (const home of holdouts) {
      if (!home.living_area || !home.sale_price || !home.settled_date) continue;

      const compRes = await fetch(`${URL_}/rest/v1/rpc/idx_comparable_sales`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_prop_type: type,
          p_town: town,
          p_state: 'MA',
          p_lat: null,
          p_lon: null,
          p_radius_km: null,
          p_months: widest.months,
          p_min_sqft: Math.round(home.living_area * (1 - widest.sqft)),
          p_max_sqft: Math.round(home.living_area * (1 + widest.sqft)),
          p_exclude_mls: home.mls_number,
          p_limit: 250,
        }),
      });
      if (!compRes.ok) continue;

      const asOf = new Date(`${home.settled_date}T00:00:00Z`);
      const comps = ((await compRes.json()) as Comp[]).filter(
        (c) =>
          c.mls_number !== home.mls_number &&
          c.settled_date !== null &&
          new Date(`${c.settled_date}T00:00:00Z`) < asOf
      );

      const result = valuate(home, comps, asOf);
      if ('refusal' in result) {
        refused += 1;
        continue;
      }
      if (result.valuation.estimate === null) {
        rangeOnly += 1;
        continue;
      }
      scored.push({
        type,
        town,
        pct: ((result.valuation.estimate - home.sale_price) / home.sale_price) * 100,
        comps: result.valuation.comps.length,
        tier: result.valuation.tier.index,
      });
    }
  }

  if (scored.length === 0) {
    console.log('Nothing could be scored — is idx_sold_archive populated?');
    return;
  }

  const abs = scored.map((s) => Math.abs(s.pct)).sort((a, b) => a - b);
  const medAbs = abs[Math.floor(abs.length / 2)];
  const meanAbs = abs.reduce((a, b) => a + b, 0) / abs.length;
  const bias = scored.reduce((a, s) => a + s.pct, 0) / scored.length;
  const within = (n: number) =>
    (scored.filter((s) => Math.abs(s.pct) <= n).length / scored.length) * 100;

  console.log(`\nScored ${scored.length} closings   refused ${refused}   range-only ${rangeOnly}\n`);
  console.log(`  median absolute error   ${medAbs.toFixed(1)}%`);
  console.log(`  mean absolute error     ${meanAbs.toFixed(1)}%`);
  console.log(`  bias (signed mean)      ${bias >= 0 ? '+' : ''}${bias.toFixed(1)}%`);
  console.log(`  within 10%              ${within(10).toFixed(0)}%`);
  console.log(`  within 20%              ${within(20).toFixed(0)}%`);

  if (TYPES.length > 1) {
    console.log('\n  by property type:');
    for (const type of TYPES) {
      const t = scored.filter((x) => x.type === type);
      if (!t.length) continue;
      const a = t.map((x) => Math.abs(x.pct)).sort((m, n) => m - n);
      const b = t.reduce((m, x) => m + x.pct, 0) / t.length;
      const w = (t.filter((x) => Math.abs(x.pct) <= 20).length / t.length) * 100;
      console.log(
        `    ${type}  n=${String(t.length).padStart(4)}  median ${a[Math.floor(a.length / 2)].toFixed(1)}%  ` +
          `bias ${b >= 0 ? '+' : ''}${b.toFixed(1)}%  within 20% ${w.toFixed(0)}%`
      );
    }
  }

  const tiers = new Map<number, number>();
  for (const s of scored) tiers.set(s.tier, (tiers.get(s.tier) ?? 0) + 1);
  console.log(
    `\n  tier reached:           ${[...tiers.entries()].sort().map(([t, n]) => `${t}:${n}`).join('  ')}`
  );
  // Derived from TIERS, not hardcoded, so adding a rung cannot silence this.
  const needsCoords = new Set(TIERS.filter((t) => t.radiusKm !== null).map((t) => t.index));
  if (![...tiers.keys()].some((t) => needsCoords.has(t))) {
    console.log(
      '  ^ no valuation used a distance rung, which means no coordinates are\n' +
        '    loaded. Run scripts/geocode-listings.ts.'
    );
  }

  console.log('\n  per town (signed median, n):');
  for (const town of TOWNS) {
    const e = scored.filter((s) => s.town === town).map((s) => s.pct).sort((a, b) => a - b);
    if (!e.length) continue;
    const m = e[Math.floor(e.length / 2)];
    console.log(`    ${town.padEnd(12)} ${(m >= 0 ? '+' : '') + m.toFixed(1)}%`.padEnd(26) + `n=${e.length}`);
  }
  console.log('');
};

main().catch((err) => {
  console.error('valuation-backtest failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
