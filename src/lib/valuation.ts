/**
 * The comparable-sales estimate: what closed sales say a home is worth.
 *
 * PURE. Nothing here touches the network, the DOM or Supabase — it takes a
 * subject and a bag of candidate sales and returns a number or refuses to. That
 * is deliberate: this is the only part of the feature that makes a claim about
 * somebody's house, and a claim nobody can re-run by hand is one nobody can
 * check. Fetching lives in idxComps.ts, rendering in ListingValuation.tsx.
 *
 * WHAT THIS IS MODELLED ON. The sales-comparison approach, which is how an
 * appraiser actually arrives at a number: select closed arm's-length sales in
 * the same market area, bracket the subject above and below on each axis that
 * matters, adjust each comp line by line for how it differs, and reconcile.
 * Two details from that practice are load-bearing here and are the difference
 * between this and a spreadsheet of averages:
 *
 *   1. A MARKET-CONDITIONS TIME ADJUSTMENT. A sale six months ago is evidence
 *      about six months ago. Fannie Mae made this mandatory for appraisals
 *      dated on or after 2025-03-01 and names its omission an unacceptable
 *      practice, for the good reason that in a moving market it is the largest
 *      adjustment on the grid.
 *
 *   2. ADJUSTMENTS DERIVED FROM THE DATA, NOT DECLARED. Every dollar figure
 *      below comes out of a regression on the comp set that was just fetched,
 *      and a coefficient that comes back the wrong sign or fails significance
 *      is DROPPED rather than forced to a plausible-looking constant. A
 *      hardcoded "$40 a square foot" is a number about no particular market.
 *
 * WHAT THIS REFUSES TO DO, and why each refusal is the point:
 *
 *   * PRICE PER SQUARE FOOT IS NOT AN ADJUSTMENT RATE. The average $/sqft of a
 *     house includes its land, its kitchen and its location; the MARGINAL value
 *     of one more square foot is typically 40-60% of it. Adjusting a 2,000 sqft
 *     comp up to a 2,400 sqft subject at full average $/sqft overshoots by half
 *     the difference. This site has a blog post about exactly that error
 *     (/blog/how-to-read-a-comp-massachusetts); shipping it would be poor.
 *
 *   * BEDROOMS ARE A SELECTION AXIS, NOT A DOLLAR LINE. They are collinear with
 *     floor area, so adjusting for both counts the same square feet twice. They
 *     filter which sales are comparable and then stay out of the arithmetic.
 *
 *   * A SALE THAT IS NOT LIKE THE SUBJECT IS NOT A COMP, HOWEVER MANY THERE ARE.
 *     Every comp is the same property type, within 20% of the floor area, within
 *     a bedroom and a bathroom, and at most FIVE are used — the nearest and most
 *     alike. See LIKENESS and MAX_COMPS below for what that replaced and what it
 *     measured.
 *
 *   * A MEAN IS NOT USED ANYWHERE. One estate sale or one teardown moves an
 *     average somewhere no house transacted. The same reasoning medianAskingRent
 *     sets out in idxSearch.ts, applied to a stronger claim.
 *
 *   * NO CONFIDENCE PERCENTAGE. The panel reports how many sales, how close,
 *     how recent and how much they disagree. A single "87% confident" is a
 *     fabricated statistic dressed as a measurement.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Everything the estimate reads off the subject, and nothing else.
 *
 * Narrower than IdxListing on purpose. An IdxListing satisfies it structurally,
 * so callers pass one straight in, while this module stays callable — and
 * testable — without fabricating sixty fields it never looks at. It also states
 * the dependency honestly: these eleven columns are what an estimate rests on.
 */
export interface ValuationSubject {
  mls_number: string;
  prop_type: string | null;
  /** MLS PIN MF_TYPE on a multi-family; carries the unit count. */
  prop_subtype: string | null;
  town: string | null;
  state: string | null;
  zip: string | null;
  address: string | null;
  style: string | null;
  bedrooms: number | null;
  full_baths: number | null;
  half_baths: number | null;
  living_area: number | null;
  acres: number | null;
  year_built: number | null;
  garage_spaces: number | null;
}

/** One closed sale, as idx_comparable_sales returns it. */
export interface Comp {
  mls_number: string;
  address: string | null;
  street_name: string | null;
  town: string | null;
  zip: string | null;
  prop_type: string | null;
  prop_subtype: string | null;
  style: string | null;
  sale_price: number | null;
  list_price: number | null;
  settled_date: string | null;
  bedrooms: number | null;
  full_baths: number | null;
  half_baths: number | null;
  living_area: number | null;
  lot_size: number | null;
  acres: number | null;
  year_built: number | null;
  garage_spaces: number | null;
  basement: boolean | null;
  photo_count: number | null;
  lat: number | null;
  lon: number | null;
  geocode_precision: string | null;
  /** Kilometres from the subject, or null when either side has no coordinate. */
  distance_km: number | null;
}

/** A comp with everything the estimate derived about it, for display. */
export interface AdjustedComp extends Comp {
  /** Whole months between this closing and today. */
  monthsAgo: number;
  /** Sale price brought to today's dollars by the market-conditions trend. */
  timeAdjustedPrice: number;
  /** …and then adjusted for how this house differs from the subject. */
  adjustedPrice: number;
  /** Each line of the grid, for the panel to show its working. */
  adjustments: { label: string; amount: number }[];
  /** Relative influence on the estimate, 0-1, normalised across the set. */
  weight: number;
}

/** A feature whose coefficient survived significance testing. */
export interface DerivedRate {
  label: string;
  /** Dollars per unit of the feature. */
  perUnit: number;
  unit: string;
  tStat: number;
}

export interface Valuation {
  /** The point estimate, or null when it is withheld — see `withheld`. */
  estimate: number | null;
  /**
   * Why the point estimate is null, so the page can say so in the right words.
   * Null when there IS an estimate. The range, the chart and the comps are
   * shown in every case.
   */
  withheld:
    | 'dispersion'
    | 'larger-than-comps'
    | 'smaller-than-comps'
    | 'lot-beyond-comps'
    /** Set by againstAsking(), not by valuate() — see that function. */
    | 'far-from-asking'
    | null;
  /** Weighted 25th and 75th percentile of adjusted prices. Always present. */
  low: number;
  high: number;
  comps: AdjustedComp[];
  /** Which tier of the ladder was satisfied — the honest confidence disclosure. */
  tier: CompTier;
  /** Monthly market trend actually applied, as a rate. Zero when not significant. */
  monthlyTrend: number;
  /** Marginal dollars per square foot, derived. Never the average $/sqft. */
  marginalSqft: number | null;
  /** Every feature adjustment the data supported. */
  rates: DerivedRate[];
  /** Named so the panel can say what it did NOT look at. */
  notModelled: string[];
  /** Median distance of the comps used, km. Null when none are geocoded. */
  medianDistanceKm: number | null;
  /** Spread of adjusted prices as a fraction of the midpoint. */
  dispersion: number;
}

/** Why an estimate was not produced. Every one is shown to the reader as-is. */
export type ValuationRefusal =
  | 'unsupported-property-type'
  | 'no-floor-area'
  | 'too-few-comps';

/**
 * One rung of the ladder: WHERE a sale may be and HOW LONG ago. What a sale has
 * to be like is not a rung's business — that is LIKENESS, and it is the same on
 * every rung.
 */
export interface CompTier {
  index: number;
  label: string;
  radiusKm: number | null;
  months: number;
  /** Whether the tier insists a comp share the subject's five-digit ZIP. */
  sameZip?: boolean;
}

/**
 * What makes a sale comparable at all, and it does NOT loosen as the ladder
 * widens.
 *
 * Until 2026-10-09 it did: the last rung took any sale within 45% of the floor
 * area with any number of bedrooms, and every rung used ALL the sales it
 * matched. Kevin read the result on live listings — up to seventy "comparables"
 * under one house, some of them thousands of square feet apart from it — and
 * asked for what an agent would actually pull: the same kind of home, about the
 * same size, the same beds and baths, and a handful of them.
 *
 *   size   within 20% of the subject's floor area, on every rung
 *   beds   within one (two on a multi-family, where the count is the total
 *          across units, so one bedroom is a smaller difference)
 *   baths  within one, half-baths at half weight
 *
 * An UNKNOWN bedroom or bath count is not a mismatch, for the reason an unknown
 * style is not: "we were not told" would otherwise empty the comp set for every
 * listing whose agent left a field blank.
 *
 * MEASURED 2026-10-09 on 1,276 real closings (thirty per town and type, each
 * hidden from its own comps): on the homes both rules could value the error is
 * about the same (median 9.6% before, 8.8% after — closer on 301 homes, further
 * on 288). Five like sales are as accurate as dozens of loose ones; they are
 * not much MORE accurate. What changed is which homes get a number: the rule
 * now declines where five like sales do not exist — 19% of those closings
 * instead of 8% — and the homes that lost their number were the ones the old
 * rule was worst on (median 13.0% off, against 9.6% for the rest). The furthest
 * comp from its subject went from 3,093 sq ft away to 1,725, and the typical
 * furthest from 500 to 296.
 */
export const LIKENESS = {
  sqftTolerance: 0.2,
  bedTolerance: 1,
  bedToleranceMultiFamily: 2,
  bathTolerance: 1,
} as const;

/**
 * What to ask the database for: TWO questions, because one cannot serve both
 * jobs.
 *
 *   like  every sale a comp could be — within LIKENESS of the subject's size,
 *         over the longest rung. Asked on its own so that it comes back WHOLE.
 *   pool  a wide sample of the town's market, 45% either side in size, which is
 *         what the market trend and the adjustment rates are fitted on. A
 *         regression cannot measure what a square foot is worth from houses
 *         that are all the same size, so this band is deliberately wider than
 *         a comp may be.
 *
 * Until 2026-10-09 there was only the pool query, capped at its 250 most recent
 * rows. In a busy town that cap is weeks, not months: Boston condos filled it
 * with six weeks of sales, so a listing there found almost nothing from its own
 * ZIP code and fell back to sales from anywhere in the city. Newton and
 * Cambridge lose their older sales to the same cap. The like band is narrow
 * enough to come back complete in every town but Boston, and there it reaches
 * months instead of weeks.
 *
 * idxComps.ts and the backtest both call this, so the page and the instrument
 * that measures it cannot ask different questions.
 */
export const candidateBounds = (
  area: number
): { months: number; minSqft: number; maxSqft: number; limit: number }[] => [
  {
    months: Math.max(...TIERS.map((t) => t.months)),
    minSqft: Math.round(area * (1 - LIKENESS.sqftTolerance)),
    maxSqft: Math.round(area * (1 + LIKENESS.sqftTolerance)),
    // The function's own ceiling.
    limit: 500,
  },
  {
    months: 18,
    minSqft: Math.round(area * 0.55),
    maxSqft: Math.round(area * 1.45),
    limit: 250,
  },
];

/**
 * The ladder, nearest first. The caller walks it and stops at the first rung
 * holding MAX_COMPS like sales, then keeps the best MAX_COMPS of that rung.
 *
 * Each rung widens WHERE. None of them widens what a comp has to be like — see
 * LIKENESS — and none goes past twelve months.
 *
 * THERE IS NO TOWN-WIDE RUNG, and there was one until 2026-10-09. A sale from
 * somewhere else in the town, at a distance nobody knows, is not a comparable:
 * "Boston" is one MLS town from Back Bay to Mattapan. Measured on 1,276 real
 * closings the town-wide rung was the worst on the ladder — off by 18% on
 * average against 13% for the rest, and one number in five more than 25% out —
 * and on a sample of 152 homes for sale statewide, where it was mostly Boston,
 * its estimates sat a median of 28% from the asking price against 11% for the
 * ZIP rung. A thin town used to be answered by widening until something
 * matched; it is now answered by saying there is no estimate. An eighteen-month
 * same-ZIP rung was tried in its place and added nothing.
 *
 * Distance is in kilometres because the query measures in kilometres; the UI
 * renders miles, which is what a reader in Massachusetts thinks in.
 */
export const TIERS: CompTier[] = [
  { index: 0, label: 'within half a mile, in the last 12 months', radiusKm: 0.8, months: 12 },
  { index: 1, label: 'within 1 mile, in the last 12 months', radiusKm: 1.6, months: 12 },
  { index: 2, label: 'within 2 miles, in the last 12 months', radiusKm: 3.2, months: 12 },
  /*
   * THE RUNG THAT WORKS WITHOUT COORDINATES. Everything above needs a geocode on
   * both sides, and sales outside the seventeen served towns have none. ZIP
   * codes track a city's neighbourhoods closely, and every row has one:
   * single-family estimates in Boston were 26% off against the whole town and
   * 12% against the ZIP (backtest, 2026-09-26).
   */
  { index: 3, label: 'in the same ZIP code, in the last 12 months', radiusKm: null, months: 12, sameZip: true },
];

/**
 * The floor, and it is a judgement rather than a convention.
 *
 * medianAskingRent sets three, for a median of ASKING rents offered as a
 * starting point in an editable field. This is a statement about what one
 * specific house is worth, shown next to somebody else's asking price, so it
 * carries more weight and needs more behind it.
 *
 * Three was tried again on 2026-10-09, when the size band tightened and more
 * homes fell short of five: it would have put a number on about forty more of
 * 1,276 closings, and those were off by nearly 20% on average against 13% for
 * the rest. With fewer than five like sales the page shows nothing.
 */
export const MIN_COMPS = 5;

/**
 * The most sales an estimate is built from — the five nearest and most alike.
 *
 * It used to be every sale a rung matched, which in a busy town was dozens and
 * once 173. A reader cannot check seventy sales, and an estimate nobody can
 * check is the thing this module exists not to be. Five is also what an
 * appraiser's grid holds. Equal to MIN_COMPS on purpose: an estimate rests on
 * exactly five like sales or it is not made.
 *
 * The ladder stops at the first rung that HOLDS five. Asking a rung for eight
 * before trusting it (TIER_TARGET, until 2026-10-09) was a fix for estimates
 * leaning on five loosely matched sales; with the likeness band fixed it
 * measured as no different, and it was removed.
 */
export const MAX_COMPS = 5;

/**
 * Above this, the comps disagree too much to name a single number.
 *
 * The interquartile spread as a fraction of the midpoint. At 35% the middle
 * half of the evidence runs from roughly 0.8x to 1.2x — a range a reader can
 * still use, but not one a point estimate honestly summarises. The range is
 * still shown; only the headline number is withheld. This is the same shape as
 * percentOfAsking() returning null rather than assuming two prices were equal.
 */
const MAX_DISPERSION = 0.35;

/** How far past the largest comp's lot a subject's may go. See the bracketing note in valuate(). */
const LOT_BRACKET_SLACK = 1.5;

/** Property types this can speak about at all. See `supports()`. */
const SUPPORTED_PROP_TYPES = ['SF', 'CC', 'MF'];

/* -------------------------------------------------------------------------- */
/* Small statistics                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Weighted quantile over values that are NOT assumed sorted.
 *
 * Walks the sorted values accumulating weight and returns the first value at
 * which the cumulative weight crosses the target fraction. No interpolation:
 * every value returned is a real adjusted sale price rather than a blend of two
 * of them, which matters because the panel shows the comps beside the number.
 */
export const weightedQuantile = (
  pairs: { value: number; weight: number }[],
  q: number
): number => {
  const sorted = [...pairs].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, p) => sum + p.weight, 0);
  if (total <= 0) return sorted[Math.floor(sorted.length / 2)]?.value ?? 0;

  let cumulative = 0;
  for (const p of sorted) {
    cumulative += p.weight;
    if (cumulative >= q * total) return p.value;
  }
  return sorted[sorted.length - 1].value;
};

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
};

/**
 * Ordinary least squares with an intercept, solved through the normal
 * equations with partial pivoting.
 *
 * Returns per-coefficient t-statistics alongside the coefficients, because a
 * coefficient this code is not entitled to believe is the whole reason the
 * regression is here. With comp sets of five to forty rows, an unfiltered
 * regression will happily report that a garage bay is worth minus $90,000.
 *
 * Null when the system is singular or there are not enough degrees of freedom —
 * which is a real case, not a defensive flourish: a Dover tier-4 comp set can
 * be six rows wide.
 */
export const ols = (
  X: number[][],
  y: number[]
): { coefficients: number[]; intercept: number; tStats: number[]; n: number } | null => {
  const n = y.length;
  const k = X[0]?.length ?? 0;
  // One column for the intercept, one residual degree of freedom minimum, and
  // at least a few observations per coefficient or the t-stats are theatre.
  if (n < k + 3) return null;

  // Design matrix with a leading 1s column.
  const A = X.map((row) => [1, ...row]);
  const p = k + 1;

  // Normal equations: (X'X) b = X'y
  const XtX: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  const Xty: number[] = new Array(p).fill(0);
  for (let i = 0; i < n; i += 1) {
    for (let a = 0; a < p; a += 1) {
      Xty[a] += A[i][a] * y[i];
      for (let b = 0; b < p; b += 1) XtX[a][b] += A[i][a] * A[i][b];
    }
  }

  // Gauss-Jordan on [XtX | I], giving both the solution and the inverse whose
  // diagonal the standard errors need.
  const M = XtX.map((row, i) => [...row, ...Array.from({ length: p }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < p; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < p; r += 1) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-10) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const d = M[col][col];
    for (let c = 0; c < 2 * p; c += 1) M[col][c] /= d;
    for (let r = 0; r < p; r += 1) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let c = 0; c < 2 * p; c += 1) M[r][c] -= f * M[col][c];
    }
  }
  const inv = M.map((row) => row.slice(p));
  const b = inv.map((row) => row.reduce((sum, v, j) => sum + v * Xty[j], 0));

  // Residual variance, then se(b_j) = sqrt(s2 * inv_jj).
  let rss = 0;
  for (let i = 0; i < n; i += 1) {
    const fitted = A[i].reduce((sum, v, j) => sum + v * b[j], 0);
    rss += (y[i] - fitted) ** 2;
  }
  const s2 = rss / (n - p);
  const tStats = b.map((coef, j) => {
    const se = Math.sqrt(Math.max(s2 * inv[j][j], 0));
    return se > 0 ? coef / se : 0;
  });

  return { coefficients: b.slice(1), intercept: b[0], tStats: tStats.slice(1), n };
};

/**
 * Roughly the 95% two-sided critical value.
 *
 * A flat 2.0 rather than a t-table lookup. At the sample sizes here (five to a
 * few hundred) the true value runs from about 2.8 down to 1.96, so 2.0 is
 * slightly permissive at the small end — and the small end is also where a
 * coefficient is dropped anyway for want of degrees of freedom. Naming the
 * approximation is better than importing a distribution table to make a
 * judgement call look exact.
 */
const T_CRITICAL = 2.0;

/* -------------------------------------------------------------------------- */
/* Feature extraction                                                          */
/* -------------------------------------------------------------------------- */

const MONTH_MS = 1000 * 60 * 60 * 24 * 30.4375;

export const monthsSince = (iso: string | null, now = new Date()): number => {
  if (!iso) return Number.POSITIVE_INFINITY;
  const then = new Date(`${iso}T00:00:00Z`).getTime();
  if (!Number.isFinite(then)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - then) / MONTH_MS);
};

/**
 * Baths as one number, half-baths at half weight.
 *
 * NOT the "2.1" MLS notation, which is two full and one half rather than two
 * point one — listings.ts already refuses to render that because it reads as a
 * decimal. Here a genuine decimal is wanted, for arithmetic rather than display.
 */
export const bathCount = (full: number | null, half: number | null): number | null => {
  if (full === null && half === null) return null;
  return (full ?? 0) + (half ?? 0) * 0.5;
};

/**
 * Style codes as a set.
 *
 * The feed stores a comma-separated LIST — "A,D" (Colonial and Contemporary) is
 * a real value on the live data — so style comparison is set overlap, not string
 * equality. The codes also COLLIDE across property types ("A" is Colonial on a
 * single-family and Detached on a condo), so this is only ever compared between
 * two listings of the same prop_type, which every tier already guarantees.
 */
export const styleSet = (style: string | null): Set<string> =>
  new Set(
    (style ?? '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  );

const sharesStyle = (a: string | null, b: string | null): boolean => {
  const sa = styleSet(a);
  const sb = styleSet(b);
  // An unknown style cannot be said to differ. Treating "we were not told" as a
  // mismatch would count against every listing whose agent left the field
  // blank.
  if (sa.size === 0 || sb.size === 0) return true;
  for (const s of sa) if (sb.has(s)) return true;
  return false;
};

/**
 * The join key between an address and its coordinate.
 *
 * A DELIBERATE MIRROR of idx_address_key() in migration 20260920130000, the same
 * arrangement as the town/ZIP normalisation shared between sync-listings.mjs and
 * fromRow(), and as formatProperty() mirrored into the invite edge function. If
 * the two ever disagree the symptom is a cache miss and a re-geocode, not a
 * wrong coordinate — which is why this mirror is safe to have and the ones that
 * decide what a reader SEES are not.
 */
export const addressKey = (
  address: string | null,
  town: string | null,
  state: string | null,
  zip: string | null
): string => {
  const norm = (v: string | null) =>
    (v ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const zip5 = (zip ?? '').replace(/[^0-9]/g, '').slice(0, 5);
  return `${norm(address)}|${norm(town)}|${norm(state).replace(/\s/g, '')}|${zip5}`;
};

/** Five-digit ZIP, or null. The feed carries both ZIP and ZIP+4. */
export const zip5 = (zip: string | null): string | null => {
  const digits = (zip ?? '').replace(/[^0-9]/g, '').slice(0, 5);
  return digits.length === 5 ? digits : null;
};

/* -------------------------------------------------------------------------- */
/* The estimate                                                                */
/* -------------------------------------------------------------------------- */

/**
 * How many units a multi-family has, from its MLS PIN MF_TYPE code.
 *
 * The feed encodes it in the subtype rather than reliably in `num_units`:
 * A/D/F/G/H are two-family (side by side, up/down, rooming house), B/I/J/K
 * three, C/L/M/N four, and E/O/P/Q five or more. 100% of the multi-family sales
 * in the archive carry a subtype (measured 2026-09-26), which is why this is
 * the key rather than `num_units`.
 *
 * Null for anything unrecognised, and a null here means the listing is REFUSED,
 * not guessed at: comparing a two-family to a four-family is comparing two
 * buildings that earn and sell on entirely different terms.
 */
export const unitClass = (subtype: string | null): '2' | '3' | '4' | '5+' | null => {
  const code = (subtype ?? '').split(',')[0].trim().toUpperCase();
  // Exact membership, not String.includes: "ADFGH".includes("DF") is true, and a
  // malformed two-letter code must not be read as a two-family.
  if (['A', 'D', 'F', 'G', 'H'].includes(code)) return '2';
  if (['B', 'I', 'J', 'K'].includes(code)) return '3';
  if (['C', 'L', 'M', 'N'].includes(code)) return '4';
  if (['E', 'O', 'P', 'Q'].includes(code)) return '5+';
  return null;
};

/**
 * Whether this listing can be valued at all.
 *
 * RENTALS are the one type excluded outright: a sale-price estimate on a unit
 * that is for rent answers a question nobody viewing it asked.
 *
 * MULTI-FAMILY is supported, but only against its own unit count. This used to
 * be refused on the grounds that an MF `bedrooms` is the total across every
 * unit, so a "4 bedroom" two-family and a "4 bedroom" house are different
 * statements — which is true, and irrelevant: comps are always drawn from the
 * same property type, so a two-family is only ever set beside other buildings
 * whose bedroom count means the same thing. What DOES have to match is the unit
 * count, which is what `unitClass` enforces in every tier.
 */
export const supports = (
  listing: Pick<ValuationSubject, 'prop_type' | 'prop_subtype'>
): boolean => {
  if (!SUPPORTED_PROP_TYPES.includes(listing.prop_type ?? '')) return false;
  if (listing.prop_type === 'MF') return unitClass(listing.prop_subtype) !== null;
  return true;
};

/** Does this comp satisfy a given rung of the ladder? */
export const matchesTier = (
  subject: ValuationSubject,
  comp: Comp,
  tier: CompTier,
  now = new Date()
): boolean => {
  const area = subject.living_area ?? 0;
  if (area <= 0 || !comp.living_area) return false;

  if (monthsSince(comp.settled_date, now) > tier.months) return false;

  if (tier.sameZip) {
    const a = zip5(subject.zip);
    // An unknown ZIP cannot satisfy a same-ZIP bound, for the same reason an
    // unknown distance cannot satisfy a radius.
    if (a === null || a !== zip5(comp.zip)) return false;
  }

  if (tier.radiusKm !== null) {
    // An unknown distance is not a near one. Including ungeocoded rows in a
    // half-mile band is how a comp from the far side of town gets presented as
    // next door; the wide rungs, which set no radius, are where those rows
    // legitimately come back.
    if (comp.distance_km === null || comp.distance_km > tier.radiusKm) return false;
  }

  // LIKENESS — the same on every rung. See the note on the constant.
  if (Math.abs(comp.living_area - area) / area > LIKENESS.sqftTolerance) return false;

  const bedTolerance =
    subject.prop_type === 'MF' ? LIKENESS.bedToleranceMultiFamily : LIKENESS.bedTolerance;
  if (subject.bedrooms !== null && comp.bedrooms !== null) {
    if (Math.abs(comp.bedrooms - subject.bedrooms) > bedTolerance) return false;
  }

  const subjectBaths = bathCount(subject.full_baths, subject.half_baths);
  const compBaths = bathCount(comp.full_baths, comp.half_baths);
  if (subjectBaths !== null && compBaths !== null) {
    if (Math.abs(compBaths - subjectBaths) > LIKENESS.bathTolerance) return false;
  }

  // A two-family is never a comp for a three-family, at any rung.
  if (subject.prop_type === 'MF' && unitClass(comp.prop_subtype) !== unitClass(subject.prop_subtype)) {
    return false;
  }

  return true;
};

/**
 * The market-conditions trend, as a monthly rate.
 *
 * Regresses log price-per-square-foot on months-ago across the whole candidate
 * set — the widest evidence available, not just the comps that survived the
 * tier, because a trend estimated from six sales is noise. Log so the result is
 * a RATE that compounds rather than a dollar figure that does not travel across
 * price points.
 *
 * Returns 0 when the slope fails significance, and 0 is the right answer there:
 * Fannie Mae requires the adjustment be MARKET-DERIVED, and inventing a drift
 * from a slope the data does not support is exactly the fabrication the
 * requirement exists to prevent. A flat market and an unmeasurable one both
 * correctly produce no adjustment.
 *
 * Also clamped: the sign can be either way, but a derived trend beyond ±3% a
 * month compounds to nonsense over an 18-month window and is a sign the sample
 * is being driven by a handful of extreme sales rather than by the market.
 */
export const marketTrend = (candidates: Comp[], now = new Date()): number => {
  const rows = candidates
    .filter((c) => c.sale_price && c.living_area && c.settled_date)
    .map((c) => ({
      months: monthsSince(c.settled_date, now),
      logPpsf: Math.log((c.sale_price as number) / (c.living_area as number)),
    }))
    .filter((r) => Number.isFinite(r.logPpsf) && Number.isFinite(r.months));

  if (rows.length < 12) return 0;

  const fit = ols(rows.map((r) => [r.months]), rows.map((r) => r.logPpsf));
  if (!fit || Math.abs(fit.tStats[0]) < T_CRITICAL) return 0;

  // The slope is per month going BACKWARDS in time, so a market that has risen
  // gives a negative slope against months-ago. Flip it to read forwards.
  const monthly = Math.expm1(-fit.coefficients[0]);
  if (!Number.isFinite(monthly)) return 0;
  return Math.max(-0.03, Math.min(0.03, monthly));
};

/** One feature the grid may adjust on, if the data supports it. */
interface FeatureSpec {
  key: string;
  label: string;
  unit: string;
  /** Null when this comp/subject does not carry the feature. */
  of: (c: Pick<Comp, 'living_area' | 'full_baths' | 'half_baths' | 'acres' | 'year_built' | 'garage_spaces'>) => number | null;
  /** Reject an implausible sign outright — see `deriveRates`. */
  expectPositive: boolean;
}

const FEATURES: FeatureSpec[] = [
  { key: 'living_area', label: 'Floor area', unit: 'sq ft', of: (c) => c.living_area, expectPositive: true },
  { key: 'baths', label: 'Bathrooms', unit: 'bath', of: (c) => bathCount(c.full_baths, c.half_baths), expectPositive: true },
  // Log lot size: the second acre is not worth what the first one is, and a
  // linear term makes an estimate on a ten-acre parcel absurd.
  { key: 'lot', label: 'Lot size', unit: 'log acre', of: (c) => (c.acres && c.acres > 0 ? Math.log(c.acres) : null), expectPositive: true },
  { key: 'age', label: 'Year built', unit: 'year', of: (c) => c.year_built, expectPositive: true },
  { key: 'garage', label: 'Garage', unit: 'space', of: (c) => c.garage_spaces, expectPositive: true },
];

/**
 * Fit the adjustment grid to this particular comp set.
 *
 * Every feature is offered to one multivariate regression, and each one has to
 * earn its place twice: it must be present on at least 80% of the comps and
 * vary among them, and its coefficient must clear significance AND come back
 * with the sign the world has. A regression on nine houses will report that a
 * bathroom is worth minus $200,000 often enough that not checking is not an
 * option — and a wrong-signed adjustment is worse than no adjustment, because
 * it moves the estimate confidently in the wrong direction.
 *
 * Features that fail are simply absent from the returned rates, the panel does
 * not claim them, and they appear in `notModelled` instead.
 */
export const deriveRates = (
  comps: Comp[]
): { rates: Map<string, DerivedRate>; dropped: string[] } => {
  const rates = new Map<string, DerivedRate>();
  const dropped: string[] = [];

  const usable = comps.filter((c) => c.sale_price && c.sale_price > 0);
  if (usable.length < 8) {
    // Too few rows to fit anything honestly. Floor area still gets a fallback
    // below, because without it there is no grid at all.
    return { rates, dropped: FEATURES.map((f) => f.label) };
  }

  const present = FEATURES.filter((f) => {
    const values = usable.map((c) => f.of(c)).filter((v): v is number => v !== null);
    if (values.length < usable.length * 0.8) {
      dropped.push(f.label);
      return false;
    }
    // A feature that does not vary carries no information and makes the normal
    // equations singular.
    if (new Set(values).size < 3) {
      dropped.push(f.label);
      return false;
    }
    return true;
  });

  if (present.length === 0) return { rates, dropped };

  const rows = usable.filter((c) => present.every((f) => f.of(c) !== null));
  if (rows.length < present.length + 3) {
    return { rates, dropped: FEATURES.map((f) => f.label) };
  }

  const fit = ols(
    rows.map((c) => present.map((f) => f.of(c) as number)),
    rows.map((c) => c.sale_price as number)
  );
  if (!fit) return { rates, dropped: FEATURES.map((f) => f.label) };

  present.forEach((f, i) => {
    const coef = fit.coefficients[i];
    const t = fit.tStats[i];
    if (!Number.isFinite(coef) || Math.abs(t) < T_CRITICAL || (f.expectPositive && coef <= 0)) {
      dropped.push(f.label);
      return;
    }
    rates.set(f.key, { label: f.label, perUnit: coef, unit: f.unit, tStat: t });
  });

  return { rates, dropped };
};

/**
 * Marginal dollars per square foot, with a stated fallback.
 *
 * Prefers the regression coefficient, which is the marginal rate. When the
 * regression could not produce one — a thin comp set, most often — falls back
 * to HALF the median average $/sqft, and half is not arbitrary: the marginal
 * rate runs 40-60% of the average across residential markets because the
 * average carries the land and the fixed value of a dwelling, neither of which
 * scales with the next square foot. The fallback is flagged so the panel can
 * say which it used.
 */
const sqftRate = (
  comps: Comp[],
  rates: Map<string, DerivedRate>
): { perUnit: number; derived: boolean } | null => {
  const fromFit = rates.get('living_area');
  if (fromFit) return { perUnit: fromFit.perUnit, derived: true };

  const ppsf = comps
    .filter((c) => c.sale_price && c.living_area && c.living_area > 0)
    .map((c) => (c.sale_price as number) / (c.living_area as number));
  if (ppsf.length < 3) return null;
  return { perUnit: median(ppsf) * 0.5, derived: false };
};

/**
 * How much this comp counts — and, since 2026-10-09, which five are kept.
 *
 * Exponential decays multiplied together: distance, age of sale, and how unlike
 * the subject it is in floor area, bedrooms, bathrooms and style. This is the
 * standard comparables-AVM weighting: a comp is better the nearer, more recent
 * and more alike it is, and the decay is smooth so that no comp falls off a
 * cliff at a rung's boundary.
 *
 * ONE SCORE FOR BOTH JOBS. chooseComps() ranks a rung by this and keeps the top
 * five; the estimate then weights those five by it. A second, different score
 * for selection would be a second opinion about what "alike" means.
 *
 * A comp with NO coordinate is not discarded but it is discounted, because "we
 * do not know where this is" is genuinely weaker evidence than "this is 300
 * metres away" and should not be able to outweigh it.
 *
 * Style is a preference here and no longer a filter: a Colonial is a better
 * comp for a Colonial than a Ranch is, but a Ranch the same size on the same
 * street is still better than nothing. Multi-family is exempt — the column has
 * no codebook there, see _shared/idx.ts.
 */
export const compWeight = (subject: ValuationSubject, comp: Comp, now = new Date()): number => {
  const area = subject.living_area ?? 0;

  /*
   * With a distance, decay on it. Without one, fall back to the ZIP: a same-ZIP
   * sale is genuinely better evidence than one from the other end of town, and
   * the ZIP rung — where every ungeocoded valuation ends up — has no finer
   * signal. Either unknown half is still weaker than any measured distance
   * under about a kilometre.
   */
  const sameZip = zip5(subject.zip) !== null && zip5(subject.zip) === zip5(comp.zip);
  const distance =
    comp.distance_km !== null
      ? Math.exp(-comp.distance_km / 1.5)
      : sameZip
        ? 0.6
        : 0.3;
  const recency = Math.exp(-monthsSince(comp.settled_date, now) / 12);
  const size =
    area > 0 && comp.living_area
      ? Math.exp(-Math.abs(comp.living_area - area) / area / 0.25)
      : 0.5;

  // Each bedroom of difference costs 40%; a full bathroom about half.
  const beds =
    subject.bedrooms !== null && comp.bedrooms !== null
      ? 0.6 ** Math.abs(subject.bedrooms - comp.bedrooms)
      : 1;
  const subjectBaths = bathCount(subject.full_baths, subject.half_baths);
  const compBaths = bathCount(comp.full_baths, comp.half_baths);
  const baths =
    subjectBaths !== null && compBaths !== null
      ? Math.exp(-Math.abs(subjectBaths - compBaths) / 1.5)
      : 1;
  const style =
    subject.prop_type !== 'MF' && !sharesStyle(subject.style, comp.style) ? 0.7 : 1;

  return Math.max(distance * recency * size * beds * baths * style, 1e-6);
};

/**
 * The five sales an estimate is built from, out of everything a rung matched.
 *
 * The five highest-scoring, with one exception that an appraiser makes on
 * purpose: THE COMPS SHOULD BRACKET THE SUBJECT, one at least as large and one
 * at least as small, so the estimate is read between real sales rather than
 * projected past them. Five sales chosen for likeness alone often leave the
 * subject just outside their size range, by chance. So when the
 * best five are all smaller and the rung holds a larger one, that sale replaces
 * the weakest of the five — and the same the other way. Measured 2026-10-09:
 * without the swap about sixty more of 1,276 homes lost their single number to
 * the bracketing rule in valuate(), for no gain in accuracy on the rest.
 *
 * Ties break on the MLS number so the same listing always shows the same five.
 */
export const chooseComps = (subject: ValuationSubject, matched: Comp[], now = new Date()): Comp[] => {
  const ranked = matched
    .map((comp) => ({ comp, score: compWeight(subject, comp, now) }))
    .sort((a, b) => b.score - a.score || a.comp.mls_number.localeCompare(b.comp.mls_number))
    .map((r) => r.comp);

  const chosen = ranked.slice(0, MAX_COMPS);
  const rest = ranked.slice(MAX_COMPS);
  const area = subject.living_area ?? 0;

  const sides = [
    (c: Comp) => (c.living_area ?? 0) >= area,
    (c: Comp) => (c.living_area ?? 0) <= area,
  ];
  for (const onSide of sides) {
    if (chosen.some(onSide)) continue;
    // Every chosen comp is on the OTHER side, so replacing the weakest cannot
    // unbracket it.
    const standIn = rest.find(onSide);
    if (standIn) chosen[chosen.length - 1] = standIn;
  }
  return chosen;
};

/**
 * Value one subject against a set of candidate sales.
 *
 * Returns a refusal rather than a number whenever the evidence does not support
 * one. Every branch that returns null here is a branch where a competitor would
 * print a figure anyway.
 */
export const valuate = (
  subject: ValuationSubject,
  candidates: Comp[],
  now = new Date()
): { valuation: Valuation } | { refusal: ValuationRefusal } => {
  if (!supports(subject)) return { refusal: 'unsupported-property-type' };

  const area = subject.living_area ?? 0;
  // The same sanity band the SQL applies, restated because this function must
  // be correct on any input rather than only on what that query returns.
  if (area < 300 || area > 15000) return { refusal: 'no-floor-area' };

  // Walk the ladder and stop at the first rung holding five like sales, then
  // keep the best five of it. If no rung holds five there is no estimate.
  let tier: CompTier | null = null;
  let rung: Comp[] = [];
  let selected: Comp[] = [];
  for (const candidate of TIERS) {
    const matched = candidates.filter(
      (c) =>
        c.mls_number !== subject.mls_number &&
        !!c.sale_price &&
        matchesTier(subject, c, candidate, now)
    );
    if (matched.length >= MIN_COMPS) {
      tier = candidate;
      rung = matched;
      selected = chooseComps(subject, matched, now);
      break;
    }
  }

  if (tier === null) return { refusal: 'too-few-comps' };

  const monthlyTrend = marketTrend(candidates, now);

  /*
   * RATES FROM THE MARKET, APPLIED TO THE NEAREST COMPS — which is how an
   * appraiser separates the two jobs. The comps chosen above are five by design
   * (the nearest and most alike), and a regression on five sales cannot
   * support five coefficients: it either fails to fit or fits noise, and the
   * grid falls back to a crude flat rate. The whole candidate pool — every sale
   * of this type in the town within the window, typically one to two hundred —
   * is what actually measures how this market prices a square foot or a bath.
   * Same reasoning as marketTrend() above, which was always fitted on the pool.
   *
   * The pool's prices are brought to today first, or the regression would read
   * the market's drift over eighteen months as a property of floor area. For a
   * multi-family it is restricted to the same unit count, since a two-family's
   * square foot and a four-family's are priced as different things.
   */
  const pool = candidates
    .filter(
      (c) =>
        c.mls_number !== subject.mls_number &&
        c.sale_price &&
        c.living_area &&
        (subject.prop_type !== 'MF' || unitClass(c.prop_subtype) === unitClass(subject.prop_subtype))
    )
    .map((c) => ({
      ...c,
      sale_price: (c.sale_price as number) * (1 + monthlyTrend) ** monthsSince(c.settled_date, now),
    }));
  const rateSource = pool.length >= selected.length ? pool : selected;
  const { rates, dropped } = deriveRates(rateSource);
  const sqft = sqftRate(rateSource, rates);

  const adjusted: AdjustedComp[] = selected.map((comp) => {
    const monthsAgo = monthsSince(comp.settled_date, now);
    const sale = comp.sale_price as number;

    // 1. Market conditions first: bring the closing into today's dollars. This
    //    is the appraisal ordering, and it matters — a feature adjustment
    //    derived from today's market applied to a year-old price would be
    //    mixing two currencies.
    const timeAdjustedPrice = sale * (1 + monthlyTrend) ** monthsAgo;
    const adjustments: { label: string; amount: number }[] = [];
    if (Math.abs(timeAdjustedPrice - sale) >= 1) {
      adjustments.push({ label: 'Market conditions since sale', amount: timeAdjustedPrice - sale });
    }

    // 2. Then the feature grid: add what the subject has more of, subtract what
    //    it has less of, at the rates this comp set supports.
    let adjustedPrice = timeAdjustedPrice;

    if (sqft && comp.living_area) {
      const delta = (area - comp.living_area) * sqft.perUnit;
      if (Math.abs(delta) >= 1) {
        adjustments.push({ label: 'Floor area', amount: delta });
        adjustedPrice += delta;
      }
    }

    for (const f of FEATURES) {
      if (f.key === 'living_area') continue;
      const rate = rates.get(f.key);
      if (!rate) continue;
      const subjectValue = f.of({
        living_area: subject.living_area,
        full_baths: subject.full_baths,
        half_baths: subject.half_baths,
        acres: subject.acres,
        year_built: subject.year_built,
        garage_spaces: subject.garage_spaces,
      });
      const compValue = f.of(comp);
      if (subjectValue === null || compValue === null) continue;
      const delta = (subjectValue - compValue) * rate.perUnit;
      if (Math.abs(delta) < 1) continue;
      adjustments.push({ label: rate.label, amount: delta });
      adjustedPrice += delta;
    }

    return {
      ...comp,
      monthsAgo,
      timeAdjustedPrice,
      adjustedPrice,
      adjustments,
      weight: compWeight(subject, comp, now),
    };
  });

  const totalWeight = adjusted.reduce((sum, c) => sum + c.weight, 0);
  const normalised = adjusted.map((c) => ({ ...c, weight: c.weight / totalWeight }));

  const pairs = normalised.map((c) => ({ value: c.adjustedPrice, weight: c.weight }));
  const low = weightedQuantile(pairs, 0.25);
  const high = weightedQuantile(pairs, 0.75);
  const mid = weightedQuantile(pairs, 0.5);
  const dispersion = mid > 0 ? (high - low) / mid : Number.POSITIVE_INFINITY;

  const distances = normalised
    .map((c) => c.distance_km)
    .filter((d): d is number => d !== null);

  const notModelled = [
    'Condition and how recently it was renovated',
    'Layout, and whether the rooms work',
    'The particular lot — outlook, grade, what it backs onto',
    'Anything unrecorded: a new roof, a finished basement, a replaced septic',
    // A multi-family trades on its income more than its floor area, and the
    // feed carries no rents. Backtested 2026-09-26 it is the weakest of the three
    // types (65% within 20%, against 84% for single-family) and this is why.
    ...(subject.prop_type === 'MF'
      ? ['What the units rent for — usually the biggest driver of a multi-family’s price']
      : []),
    ...dropped.filter((d) => d !== 'Floor area').map((d) => `${d} (the sales here did not support a rate)`),
  ];

  /*
   * BRACKETING. An appraiser's comps must bracket the subject: at least one
   * larger and one smaller, so the estimate is interpolated between real sales
   * rather than projected past them. A house bigger than every comp is being
   * valued by extending a line beyond the last point on it — which is exactly
   * where the marginal rate is least trustworthy and where, measured on the live
   * listings on 2026-09-26, the estimates were furthest off: a $2.7M Hanover
   * house resolved against ten smaller sales and came out 48% under its ask.
   * The range and the comps are still shown; only the single number is not.
   */
  const areas = selected.map((c) => c.living_area as number);

  /*
   * chooseComps() brackets whenever the rung allows it, so this fires only when
   * NO like sale on the missing side exists — every sale within 20% of this
   * home's size, nearby, was smaller than it (or every one larger).
   *
   * The same test on LOT size, on the large side only and with slack. Measured
   * on a live Mansfield listing on 2026-09-26: a 2,500 sq ft ranch on ten acres,
   * marketed as a three-lot development parcel, was valued as a ranch — the
   * house comps all sat on ordinary lots, and "asking is 57% above" was a
   * statement about land the model never priced. Past a certain size a lot is
   * valued as land, and no house comp says anything about that.
   *
   * Large side only: a small lot is what the lot adjustment is for, and is not
   * where the price turns into something else. 1.5x of slack because a lot
   * slightly bigger than the biggest comp's is still the same kind of property.
   * Single-family and multi-family only — a condo's `acres` is the complex's,
   * or absent.
   *
   * Measured against every like sale on the RUNG, not only the five kept. Five
   * sales have a smaller largest lot than thirty do, so against the five this
   * fired on 31 of 1,276 closings instead of 17 (2026-10-09), and the fourteen
   * it added were ordinary houses the estimate was no worse on than any other.
   */
  const subjectAcres = subject.acres ?? 0;
  const compAcres = rung.map((c) => c.acres ?? 0).filter((a) => a > 0);
  const lotBeyond =
    subject.prop_type !== 'CC' &&
    subjectAcres > 0 &&
    compAcres.length > 0 &&
    subjectAcres > Math.max(...compAcres) * LOT_BRACKET_SLACK;

  const withheld: Valuation['withheld'] =
    area > Math.max(...areas)
      ? 'larger-than-comps'
      : area < Math.min(...areas)
        ? 'smaller-than-comps'
        : lotBeyond
          ? 'lot-beyond-comps'
          : dispersion > MAX_DISPERSION
            ? 'dispersion'
            : null;

  return {
    valuation: {
      estimate: withheld === null ? Math.round(mid / 1000) * 1000 : null,
      withheld,
      low: Math.round(low / 1000) * 1000,
      high: Math.round(high / 1000) * 1000,
      comps: normalised.sort((a, b) => b.weight - a.weight),
      tier,
      monthlyTrend,
      marginalSqft: sqft ? sqft.perUnit : null,
      rates: [...rates.values()],
      notModelled,
      medianDistanceKm: distances.length ? median(distances) : null,
      dispersion,
    },
  };
};

/**
 * The asking price, if it is one — or null if it is a placeholder.
 *
 * MLS listings are sometimes entered at $1 (auctions, "price on request",
 * a listing awaiting its real figure). Comparing that to an estimate printed
 * "asking is 100% below what these sales suggest" on a live Chicopee listing
 * (2026-09-26), and the same $1 would have stretched the chart's price axis
 * down to zero. No house in Massachusetts is genuinely offered for sale under
 * $10,000, so below that the figure is treated as absent: no comparison, no
 * mark on the chart. Everything else about the estimate still shows.
 */
export const comparableAsking = (asking: number | null): number | null =>
  asking !== null && Number.isFinite(asking) && asking >= 10_000 ? asking : null;

/**
 * How far the estimate may sit from the asking price and still be shown.
 *
 * MEASURED, AND THE RESULT IS BLUNT. On 812 real closings that had both an
 * estimate and a list price (2026-10-09), the list price was a median of 3.0%
 * from what the home sold for. Where the estimate was more than 20% from the
 * list price — 162 homes — the estimate was the closer of the two ONCE in the
 * 20-25% band and twice in everything beyond it, and it was off by a median of
 * 21% rising to 43%. An estimate that far from the asking price is not news
 * about the asking price. It is the model missing something about the home —
 * the building, the condition, the exact street — that the person who priced
 * it could see.
 *
 * So past this point there is no number. Applying it took the estimates that
 * ARE shown from a median of 9.3% off to 6.8%, from 80% within 20% of the sale
 * price to 96%, and from 113 that were more than 25% out to 12.
 *
 * What it costs is stated plainly, because it is real: the estimate can no
 * longer be the thing that says a listing is wildly overpriced. It can say 15%.
 * It was never right when it said 40%.
 */
export const ASKING_DISAGREEMENT = 0.2;

/**
 * Withhold the estimate when it and the asking price are too far apart.
 *
 * Separate from valuate() on purpose: that function answers "what do these
 * sales say" and knows nothing about what anyone is asking, which is what lets
 * the backtest and the synthetic check run it on homes with no list price at
 * all. This is the second question — "is that answer fit to print beside this
 * asking price" — and the page asks it once, in useListingValuation.
 *
 * A placeholder price ($1, an auction) is no price to compare with, so the
 * valuation passes through untouched. So does a valuation with nothing to
 * compare: when the number was already withheld for another reason, the RANGE
 * is what the page would print, and the same test is applied to its nearer
 * edge — a range of $600k-$660k under a $1.4M asking price is the same wrong
 * statement as a single figure.
 */
export const againstAsking = (valuation: Valuation, asking: number | null): Valuation => {
  const ask = comparableAsking(asking);
  if (ask === null) return valuation;

  const nearest =
    valuation.estimate !== null
      ? valuation.estimate
      : Math.min(Math.max(ask, valuation.low), valuation.high);
  if (Math.abs(nearest - ask) / ask <= ASKING_DISAGREEMENT) return valuation;

  return { ...valuation, estimate: null, withheld: 'far-from-asking' };
};

/** Kilometres to miles, for display. The query measures in km; readers do not. */
export const toMiles = (km: number): number => km * 0.621371;
