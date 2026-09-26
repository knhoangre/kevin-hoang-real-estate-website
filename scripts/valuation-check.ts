/**
 * Assertions for src/lib/valuation.ts.
 *
 *   node scripts/valuation-check.ts
 *
 * Node runs TypeScript directly (type stripping, stable since Node 23), so this
 * needs no bundler, no test framework and no new dependency. There is no test
 * runner in this repo; this is the same arrangement as the PDF_FIELDS coverage
 * check — a script that fails loudly rather than a suite nothing runs.
 *
 * WHAT IT ACTUALLY CHECKS, and why a synthetic market is the right instrument:
 * the estimator's job is to recover parameters it was not told. So the market
 * below is generated from KNOWN ones — a marginal rate of $300 a square foot, a
 * bathroom worth $40,000, a market rising 0.5% a month — and the test asserts
 * the estimator finds them, and lands on a subject whose true value is
 * arithmetic rather than opinion. Against real sales there is no ground truth to
 * check against, which is exactly why the holdout backtest is a separate and
 * weaker instrument than this one.
 *
 * Deterministic: the PRNG is seeded, so a failure here is a real regression and
 * not a bad draw.
 */
import {
  valuate,
  ols,
  weightedQuantile,
  marketTrend,
  deriveRates,
  matchesTier,
  styleSet,
  addressKey,
  bathCount,
  supports,
  unitClass,
  zip5,
  TIERS,
  MIN_COMPS,
  type Comp,
  type ValuationSubject,
} from '../src/lib/valuation.ts';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  if (cond) {
    console.log(`ok   ${label}`);
  } else {
    console.error(`FAIL ${label}`);
    failures += 1;
  }
};
// Rates like 0.005 round to "0" and make a passing assertion unreadable, so
// small magnitudes are shown at full precision.
const show = (n: number) =>
  Math.abs(n) < 1 ? n.toPrecision(3) : Math.round(n).toLocaleString();
const near = (actual: number, expected: number, tolerance: number, label: string) =>
  ok(
    Math.abs(actual - expected) <= Math.abs(expected) * tolerance,
    `${label} (got ${show(actual)}, expected ~${show(expected)}, ±${tolerance * 100}%)`
  );

/** Mulberry32 — small, seeded, good enough to generate a market with. */
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* -------------------------------------------------------------------------- */
/* The known market                                                            */
/* -------------------------------------------------------------------------- */

const NOW = new Date('2026-09-20T00:00:00Z');
const TRUE_BASE = 300_000;
const TRUE_SQFT_RATE = 300;
const TRUE_BATH_RATE = 40_000;
const TRUE_MONTHLY_TREND = 0.005;
const NOISE = 0.02;

const dateMonthsAgo = (months: number): string =>
  new Date(NOW.getTime() - months * 30.4375 * 24 * 3600 * 1000).toISOString().slice(0, 10);

const makeComp = (i: number, over: Partial<Comp> = {}): Comp => {
  const r = rng(i * 7919);
  const sqft = Math.round(1600 + r() * 1400);
  const baths = 1 + Math.round(r() * 6) * 0.5;
  const monthsAgo = r() * 15;
  // The price this house would fetch TODAY, then discounted back to its sale
  // date by the true trend — which is exactly what the estimator has to undo.
  const todayValue = TRUE_BASE + TRUE_SQFT_RATE * sqft + TRUE_BATH_RATE * baths;
  const atSale = todayValue / (1 + TRUE_MONTHLY_TREND) ** monthsAgo;
  const noisy = atSale * (1 + (r() - 0.5) * 2 * NOISE);
  return {
    mls_number: `C${i}`,
    address: `${i} Test St`,
    street_name: 'Test St',
    town: 'Needham',
    zip: '02492',
    prop_type: 'SF',
    prop_subtype: null,
    style: 'A',
    sale_price: Math.round(noisy),
    list_price: Math.round(noisy * 1.02),
    settled_date: dateMonthsAgo(monthsAgo),
    bedrooms: 4,
    full_baths: Math.floor(baths),
    half_baths: baths % 1 ? 1 : 0,
    living_area: sqft,
    lot_size: 10000,
    acres: 0.25,
    year_built: 1970,
    garage_spaces: 2,
    basement: true,
    photo_count: 30,
    lat: 42.28,
    lon: -71.23,
    geocode_precision: 'rooftop',
    distance_km: r() * 0.7,
    ...over,
  };
};

const SUBJECT: ValuationSubject = {
  mls_number: 'SUBJ',
  prop_type: 'SF',
  prop_subtype: null,
  town: 'Needham',
  state: 'MA',
  zip: '02492',
  address: '1 Subject Rd',
  style: 'A',
  bedrooms: 4,
  full_baths: 2,
  half_baths: 1,
  living_area: 2200,
  acres: 0.25,
  year_built: 1970,
  garage_spaces: 2,
};

const TRUE_SUBJECT_VALUE =
  TRUE_BASE + TRUE_SQFT_RATE * 2200 + TRUE_BATH_RATE * (bathCount(2, 1) as number);

const market = Array.from({ length: 80 }, (_, i) => makeComp(i + 1));

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

console.log('\n--- primitives ---');

{
  // y = 5 + 3x exactly: the solver must return it exactly.
  const fit = ols([[1], [2], [3], [4], [5], [6]], [8, 11, 14, 17, 20, 23]);
  ok(fit !== null, 'ols solves an exact linear system');
  near(fit!.coefficients[0], 3, 0.001, 'ols recovers the slope');
  near(fit!.intercept, 5, 0.001, 'ols recovers the intercept');
}
ok(ols([[1], [2]], [1, 2]) === null, 'ols refuses a system with too few degrees of freedom');
ok(ols([[1], [1], [1], [1], [1], [1]], [1, 2, 3, 4, 5, 6]) === null, 'ols refuses a singular (no-variation) design');

{
  const pairs = [
    { value: 100, weight: 1 },
    { value: 200, weight: 1 },
    { value: 300, weight: 98 },
  ];
  ok(weightedQuantile(pairs, 0.5) === 300, 'weightedQuantile follows the weight, not the count');
  ok(weightedQuantile(pairs, 0.01) === 100, 'weightedQuantile reaches the low tail');
  ok(
    [100, 200, 300].includes(weightedQuantile(pairs, 0.5)),
    'weightedQuantile returns a real observation, never an interpolated blend'
  );
}

ok(styleSet('A,D').has('A') && styleSet('A,D').has('D'), 'styleSet splits the comma-separated list');
ok(styleSet(' a , d ').has('A'), 'styleSet normalises case and whitespace');
ok(styleSet(null).size === 0, 'styleSet of null is empty');

ok(
  addressKey('10 Elm St.', 'Needham', 'MA', '02492-1234') === addressKey('10  ELM   ST', 'needham', 'ma', '02492'),
  'addressKey matches the SQL: punctuation, case, spacing and ZIP+4 all normalise away'
);
ok(addressKey(null, 'Needham', 'MA', '02492') !== addressKey('10 Elm St', 'Needham', 'MA', '02492'), 'addressKey distinguishes a missing address');

ok(bathCount(2, 1) === 2.5, 'bathCount weights a half bath at a half');
ok(bathCount(null, null) === null, 'bathCount of nothing is null, not zero');
ok(bathCount(2, null) === 2, 'bathCount tolerates a missing half-bath count');
ok(zip5('02492-1234') === '02492' && zip5('2492') === null && zip5(null) === null, 'zip5 keeps five digits and refuses a truncated ZIP');

/* -------------------------------------------------------------------------- */
/* Derivation                                                                  */
/* -------------------------------------------------------------------------- */

console.log('\n--- derivation ---');

near(marketTrend(market, NOW), TRUE_MONTHLY_TREND, 0.25, 'marketTrend recovers the monthly trend');

{
  // A flat market must produce NO adjustment rather than a small invented one.
  const flat = market.map((c, i) => {
    const sqft = c.living_area as number;
    const baths = bathCount(c.full_baths, c.half_baths) as number;
    return { ...c, sale_price: Math.round(TRUE_BASE + TRUE_SQFT_RATE * sqft + TRUE_BATH_RATE * baths) , settled_date: dateMonthsAgo((i % 15) + 0.5) };
  });
  ok(marketTrend(flat, NOW) === 0, 'marketTrend returns exactly zero on a flat market');
}
ok(marketTrend(market.slice(0, 5), NOW) === 0, 'marketTrend refuses to fit a trend to five sales');

{
  const { rates } = deriveRates(market);
  ok(rates.has('living_area'), 'deriveRates finds a floor-area rate');
  near(rates.get('living_area')!.perUnit, TRUE_SQFT_RATE, 0.15, 'the floor-area rate is the marginal one');
  ok(rates.has('baths'), 'deriveRates finds a bathroom rate');
  near(rates.get('baths')!.perUnit, TRUE_BATH_RATE, 0.3, 'the bathroom rate is close to truth');
  ok(!rates.has('garage'), 'a feature with no variation in the set is dropped, not invented');
  ok(!rates.has('age'), 'year_built, constant across this market, is dropped');
}

{
  // Randomised prices: nothing should survive significance testing.
  const noise = market.map((c, i) => ({ ...c, sale_price: 500_000 + Math.round(rng(i * 13)() * 900_000) }));
  const { rates } = deriveRates(noise);
  ok(rates.size === 0, 'deriveRates claims nothing from pure noise');
}

{
  // An inverted market, where bigger houses sell for less. The sign guard must
  // refuse it rather than adjusting the wrong way with confidence.
  const inverted = market.map((c) => ({
    ...c,
    sale_price: Math.round(3_000_000 - TRUE_SQFT_RATE * (c.living_area as number)),
  }));
  const { rates } = deriveRates(inverted);
  ok(!rates.has('living_area'), 'a negative floor-area coefficient is dropped, not applied');
}

ok(deriveRates(market.slice(0, 4)).rates.size === 0, 'deriveRates fits nothing to four sales');

/* -------------------------------------------------------------------------- */
/* Tier matching                                                               */
/* -------------------------------------------------------------------------- */

console.log('\n--- tier matching ---');

{
  const tier0 = TIERS[0];
  const near0 = makeComp(999, { distance_km: 0.3, settled_date: dateMonthsAgo(2), living_area: 2200, style: 'A', bedrooms: 4 });
  ok(matchesTier(SUBJECT, near0, tier0, NOW), 'a near, recent, same-size, same-style sale satisfies tier 0');

  ok(!matchesTier(SUBJECT, { ...near0, distance_km: 5 }, tier0, NOW), 'tier 0 rejects a sale five km away');
  ok(!matchesTier(SUBJECT, { ...near0, distance_km: null }, tier0, NOW), 'tier 0 rejects a sale with NO known distance');
  ok(matchesTier(SUBJECT, { ...near0, distance_km: null }, TIERS[3], NOW), '...but the no-radius tier accepts it');
  ok(!matchesTier(SUBJECT, { ...near0, settled_date: dateMonthsAgo(11) }, tier0, NOW), 'tier 0 rejects an 11-month-old sale');
  ok(!matchesTier(SUBJECT, { ...near0, living_area: 3400 }, tier0, NOW), 'tier 0 rejects a house 55% larger');
  ok(!matchesTier(SUBJECT, { ...near0, style: 'E' }, tier0, NOW), 'tier 0 rejects a Ranch against a Colonial');
  ok(matchesTier(SUBJECT, { ...near0, style: 'E,A' }, tier0, NOW), 'a multi-code style matches on overlap');
  ok(matchesTier(SUBJECT, { ...near0, style: null }, tier0, NOW), 'an unknown style is not treated as a mismatch');
  ok(!matchesTier(SUBJECT, { ...near0, bedrooms: 7 }, tier0, NOW), 'tier 0 rejects a 7-bed against a 4-bed');
  ok(matchesTier(SUBJECT, { ...near0, bedrooms: 5 }, TIERS[1], NOW), 'tier 1 allows one bedroom of slack');

  const zipTier = TIERS.find((t) => t.sameZip)!;
  ok(!!zipTier && zipTier.radiusKm === null, 'there is a same-ZIP rung that needs no coordinates');
  ok(matchesTier(SUBJECT, { ...near0, distance_km: null, zip: '02492-3311' }, zipTier, NOW), 'the ZIP rung accepts a same-ZIP sale with no geocode (and ignores ZIP+4)');
  ok(!matchesTier(SUBJECT, { ...near0, distance_km: null, zip: '02494' }, zipTier, NOW), 'the ZIP rung rejects the next ZIP over');
  ok(!matchesTier(SUBJECT, { ...near0, distance_km: null, zip: null }, zipTier, NOW), 'the ZIP rung rejects an unknown ZIP rather than assuming a match');
  ok(TIERS.indexOf(zipTier) < TIERS.findIndex((t) => t.radiusKm === null && !t.sameZip), 'the ZIP rung is tried before town-wide matching');
}

/* -------------------------------------------------------------------------- */
/* The estimate                                                                */
/* -------------------------------------------------------------------------- */

console.log('\n--- the estimate ---');

{
  const result = valuate(SUBJECT, market, NOW);
  ok('valuation' in result, 'a healthy market produces an estimate');
  if ('valuation' in result) {
    const v = result.valuation;
    near(v.estimate as number, TRUE_SUBJECT_VALUE, 0.05, 'the estimate lands on the true value');
    ok(v.low < (v.estimate as number) && (v.estimate as number) < v.high, 'the estimate sits inside its own range');
    ok(v.comps.length >= MIN_COMPS, `at least ${MIN_COMPS} comps were used`);
    ok(v.comps.every((c) => c.mls_number !== SUBJECT.mls_number), 'the subject is never its own comp');
    near(
      v.comps.reduce((s, c) => s + c.weight, 0),
      1,
      0.0001,
      'weights are normalised to 1'
    );
    ok(v.monthlyTrend > 0, 'a rising market is reported as rising');
    ok(v.marginalSqft !== null && v.marginalSqft < 900, 'the reported rate is marginal, well under average $/sqft');
    ok(v.notModelled.some((s) => s.toLowerCase().includes('condition')), 'condition is named as not modelled');
    ok(
      v.comps.every((c) => c.adjustments.some((a) => a.label === 'Market conditions since sale')),
      'every comp carries a visible market-conditions line'
    );
    ok(v.tier.index <= 2, `a dense market resolves at a tight tier (got ${v.tier.index}: ${v.tier.label})`);
  }
}

{
  // The adjustment must actually move the number: a comp 400 sqft smaller than
  // the subject has to be adjusted UP.
  // 1,950 against a 2,200 subject is an 11% difference — inside tier 0's 15%
  // band, so the comp is genuinely selected and the adjustment is what is being
  // tested. At 1,800 it would be 18% and correctly rejected, which would make
  // this a test of the tier bound rather than of the grid.
  const small = makeComp(1234, { living_area: 1950, distance_km: 0.2, settled_date: dateMonthsAgo(1) });
  const result = valuate(SUBJECT, [...market, small], NOW);
  if ('valuation' in result) {
    const found = result.valuation.comps.find((c) => c.mls_number === 'C1234');
    ok(!!found, 'the injected small comp was selected');
    if (found) {
      const line = found.adjustments.find((a) => a.label === 'Floor area');
      ok(!!line && line.amount > 0, 'a smaller comp is adjusted upward for floor area');
      ok(found.adjustedPrice > found.timeAdjustedPrice, 'and its adjusted price exceeds its time-adjusted price');
    }
  }
}

console.log('\n--- refusals ---');

ok(!supports({ prop_type: 'RN', prop_subtype: null }), 'rentals are unsupported');
ok(
  supports({ prop_type: 'SF', prop_subtype: null }) && supports({ prop_type: 'CC', prop_subtype: null }),
  'single-family and condo are supported'
);
ok(supports({ prop_type: 'MF', prop_subtype: 'G' }), 'a multi-family with a known unit count is supported');
ok(!supports({ prop_type: 'MF', prop_subtype: null }), 'a multi-family with NO unit count is refused, not guessed');
ok(!supports({ prop_type: 'MF', prop_subtype: 'Z' }), 'an unrecognised MF subtype is refused');

ok(unitClass('A') === '2' && unitClass('G') === '2' && unitClass('F') === '2', 'A, F, G are all two-family');
ok(unitClass('B') === '3' && unitClass('J') === '3', 'B and J are three-family');
ok(unitClass('C') === '4' && unitClass('P') === '5+', 'C is four-family, P is five-plus');
ok(unitClass(null) === null && unitClass('') === null, 'no subtype is no unit class');
ok(unitClass('DF') === null, 'a malformed two-letter code is not read as a two-family');

{
  // A two-family subject must never draw a three-family comp, at any rung.
  const twoFam: ValuationSubject = { ...SUBJECT, prop_type: 'MF', prop_subtype: 'G', style: null };
  const three = makeComp(4242, { prop_type: 'MF', prop_subtype: 'B', living_area: 2200, distance_km: 0.1, settled_date: dateMonthsAgo(1) });
  const two = makeComp(4243, { prop_type: 'MF', prop_subtype: 'A', living_area: 2200, distance_km: 0.1, settled_date: dateMonthsAgo(1) });
  ok(TIERS.every((t) => !matchesTier(twoFam, three, t, NOW)), 'a three-family is never a comp for a two-family');
  ok(matchesTier(twoFam, two, TIERS[0], NOW), 'a different two-family subtype (A vs G) still matches');
  ok(matchesTier(twoFam, { ...two, style: 'E' }, TIERS[0], NOW), 'style is ignored on multi-family, where it has no codebook');

  const twoFamMarket = market.map((c) => ({ ...c, prop_type: 'MF', prop_subtype: 'G' }));
  const r = valuate(twoFam, twoFamMarket, NOW);
  ok('valuation' in r, 'a two-family against a two-family market produces an estimate');
}

{
  const r = valuate({ ...SUBJECT, prop_type: 'RN' }, market, NOW);
  ok('refusal' in r && r.refusal === 'unsupported-property-type', 'a rental is refused by type');
}
{
  const r = valuate({ ...SUBJECT, living_area: null }, market, NOW);
  ok('refusal' in r && r.refusal === 'no-floor-area', 'a subject with no floor area is refused');
}
{
  const r = valuate({ ...SUBJECT, living_area: 40 }, market, NOW);
  ok('refusal' in r && r.refusal === 'no-floor-area', 'an absurd floor area is refused rather than used');
}
{
  const r = valuate(SUBJECT, market.slice(0, 3), NOW);
  ok('refusal' in r && r.refusal === 'too-few-comps', 'three comps is refused');
}
{
  const r = valuate(SUBJECT, [], NOW);
  ok('refusal' in r && r.refusal === 'too-few-comps', 'no comps at all is refused');
}

{
  // Wildly disagreeing comps: the range is still useful, the point estimate is
  // not, and only the point estimate is withheld.
  const chaotic = market.slice(0, 20).map((c, i) => ({
    ...c,
    sale_price: i % 2 === 0 ? 400_000 : 4_000_000,
    living_area: 2200,
    settled_date: dateMonthsAgo(1),
    distance_km: 0.2,
  }));
  const r = valuate(SUBJECT, chaotic, NOW);
  ok('valuation' in r, 'a chaotic market still returns comps and a range');
  if ('valuation' in r) {
    ok(r.valuation.estimate === null, 'but the point estimate is withheld when the comps disagree too much');
    ok(r.valuation.high > r.valuation.low, 'and the range is still reported');
    ok(r.valuation.comps.length > 0, 'and the comps are still listed');
  }
}

console.log('');
if (failures > 0) {
  console.error(`${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('All assertions passed.');
