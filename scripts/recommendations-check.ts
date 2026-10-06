/**
 * Assertions for src/lib/recommendations.ts — the taste profile, offline.
 *
 *   node scripts/recommendations-check.ts
 *
 * The profile decides what a signed-in visitor is shown under "Recommended for
 * you", and it is the kind of code that is wrong quietly: a history of rentals
 * with one house in it producing a $3,000-to-$900,000 band, one unaffordable
 * home somebody kept reopening dragging the whole range upward, or Dover NH
 * listings recommended to somebody shopping in Dover MA. None of those error;
 * they just recommend the wrong homes to a person who then stops looking.
 *
 * Each block below builds a history whose right answer is known and asserts
 * the profile recovers it. No dependencies, no network.
 */
import {
  FAVORITE_WEIGHT,
  describeProfile,
  rankCandidates,
  tasteProfile,
  viewWeight,
  type TasteSignal,
} from '../src/lib/recommendations.ts';

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

const view = (
  town: string,
  price: number,
  bedrooms: number | null = 3,
  propType = 'SF',
  views = 1,
  state = 'MA'
): TasteSignal => ({ town, state, propType, price, bedrooms, weight: viewWeight(views) });
const saved = (town: string, price: number, bedrooms: number | null = 3, propType = 'SF'): TasteSignal => ({
  town,
  state: 'MA',
  propType,
  price,
  bedrooms,
  weight: FAVORITE_WEIGHT,
});

console.log('--- nothing to go on ---');
eq(tasteProfile([]), null, 'an empty history has no profile');
eq(
  tasteProfile([{ town: null, state: 'MA', propType: 'SF', price: 900000, bedrooms: 3, weight: 1 }]),
  null,
  'a home with no town is not a signal'
);
eq(
  tasteProfile([{ town: 'Newton', state: 'MA', propType: 'SF', price: null, bedrooms: 3, weight: 1 }]),
  null,
  'nor is one with no price — "price on request" says nothing about a budget'
);

console.log('--- one home ---');
{
  const p = tasteProfile([view('Newton', 1000000, 4)])!;
  eq(p.towns, [{ town: 'Newton', state: 'MA' }], 'one view is one town');
  eq([p.minPrice, p.maxPrice], [850000, 1150000], 'and a band of 15% either side of its price');
  eq(p.bedrooms, 4, 'and its bedroom count');
  eq(p.market, 'sale', 'a house is the sale market');
}

console.log('--- towns ---');
{
  const p = tasteProfile([
    view('Needham', 900000),
    view('Needham', 950000),
    view('Newton', 1000000),
    view('Wellesley', 1100000),
    view('Weston', 1200000),
    view('Newton', 1050000),
    view('Needham', 980000),
  ])!;
  eq(p.towns.map((t) => t.town), ['Needham', 'Newton', 'Wellesley'], 'the three most-viewed towns, strongest first');
}
{
  const p = tasteProfile([view('Needham', 900000), view('Needham', 950000), view('Needham', 980000), saved('Newton', 1000000)])!;
  eq(p.towns[0].town, 'Newton', 'one saved home outweighs three single views elsewhere');
}
{
  const p = tasteProfile([view('Dover', 900000, 3, 'SF', 1, 'NH'), view('Dover', 950000, 3, 'SF', 1, 'NH'), view('Dover', 1000000)])!;
  eq(p.towns, [{ town: 'Dover', state: 'NH' }], 'a town carries the state its listings were in — Dover is in two');
}

console.log('--- price ---');
{
  // Nine homes around $900k and one $4M dream house opened once.
  const history = [800000, 850000, 880000, 900000, 900000, 920000, 950000, 980000, 1000000].map((n) => view('Newton', n));
  const p = tasteProfile([...history, view('Newton', 4000000)])!;
  ok(p.maxPrice < 1300000, `one dream house does not move the top of the band (max ${p.maxPrice})`);
  ok(p.minPrice > 650000 && p.minPrice < 850000, `and the bottom sits under the cheap end of the cluster (min ${p.minPrice})`);
}
{
  // The same dream house, reopened 25 times. sqrt weighting: it counts as 5, not 25.
  const history = [800000, 850000, 880000, 900000, 900000, 920000, 950000, 980000, 1000000].map((n) => view('Newton', n));
  const p = tasteProfile([...history, view('Newton', 4000000, 3, 'SF', 25)])!;
  ok(p.minPrice < 900000, `a home reopened 25 times does not swallow the range (min ${p.minPrice})`);
}
eq(viewWeight(1), 1, 'one view weighs 1');
eq(viewWeight(4), 2, 'four views weigh 2, not 4');
eq(viewWeight(0), 1, 'a row is never worth less than one view');

console.log('--- rent and sale are different markets ---');
{
  const p = tasteProfile([
    view('Boston', 3200, 2, 'RN'),
    view('Boston', 3500, 2, 'RN'),
    view('Cambridge', 3800, 1, 'RN'),
    view('Newton', 950000, 4, 'SF'),
  ])!;
  eq(p.market, 'rent', 'mostly rentals is the rental market');
  eq(p.propType, 'RN', 'so the type is RN');
  ok(p.maxPrice < 10000, `and the house is left out of the band entirely (max ${p.maxPrice})`);
  ok(!p.towns.some((t) => t.town === 'Newton'), 'and out of the towns');
}
{
  const p = tasteProfile([view('Newton', 950000, 4, 'SF'), view('Newton', 900000, 3, 'CC'), view('Newton', 880000, 3, 'CC'), view('Boston', 3200, 2, 'RN')])!;
  eq(p.market, 'sale', 'mostly sales is the sale market');
  eq(p.propType, 'CC', 'and the type is the commonest within it');
  ok(p.minPrice > 100000, `with the one rental left out of the band (min ${p.minPrice})`);
}

console.log('--- ranking ---');
{
  const profile = tasteProfile([view('Newton', 1000000), view('Newton', 1000000), view('Needham', 1000000)])!;
  const pool = [
    { mls: 'n1', town: 'Newton', price: 1000000 },
    { mls: 'n2', town: 'Newton', price: 1100000 },
    { mls: 'n3', town: 'Newton', price: 900000 },
    { mls: 'd1', town: 'Needham', price: 1010000 },
    { mls: 'd2', town: 'Needham', price: 1140000 },
    { mls: 'x1', town: 'Quincy', price: 1000000 },
  ];
  eq(
    rankCandidates(pool, profile, new Set()).map((c) => c.mls),
    ['n1', 'd1', 'n2', 'd2', 'n3'],
    'towns are interleaved, nearest the middle of the band first, and other towns are left out'
  );
  eq(
    rankCandidates(pool, profile, new Set(['n1', 'd1'])).map((c) => c.mls),
    ['n2', 'd2', 'n3'],
    'a home already seen is never recommended'
  );
  eq(rankCandidates(pool, profile, new Set(), 2).map((c) => c.mls), ['n1', 'd1'], 'the limit is honoured');
  eq(rankCandidates([], profile, new Set()), [], 'no candidates is an empty list, not an error');
}

console.log('--- saying what it is based on ---');
{
  const money = (n: number) => `$${n.toLocaleString('en-US')}`;
  const three = tasteProfile([view('Needham', 1000000), view('Needham', 1000000), view('Needham', 1000000), view('Newton', 1000000), view('Newton', 1000000), view('Wellesley', 1000000)])!;
  eq(describeProfile(three, money), 'Needham, Newton and Wellesley, $850,000 to $1,150,000', 'three towns and the band');
  const rent = tasteProfile([view('Boston', 3000, 2, 'RN')])!;
  eq(describeProfile(rent, money), 'Boston, $2,550 to $3,450 a month', 'a rental band says it is monthly');
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('\nAll assertions passed.');
