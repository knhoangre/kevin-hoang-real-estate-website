/**
 * What a home would rent for, from what homes like it actually leased for.
 *
 * PURE — no network, no DOM — like valuation.ts and recommendations.ts, and
 * checked by scripts/investment-check.ts against samples whose answer is known.
 * The rows come from investmentData.ts.
 *
 * LEASED, NOT ASKING. The sold half of the MLS PIN feed carries rentals too:
 * about thirty thousand a year, and on a leased rental `sale_price` is the rent
 * the unit actually went for. The listing page's calculator seeds its rent from
 * ASKING rents (medianAskingRent), which is all it had; an asking rent is what a
 * landlord hopes for. Measured 2026-10-19: Newton had 624 leases in twelve
 * months — 37 three-bed houses at a median of $5,000, 96 two-bed apartments at
 * $2,900 — so the better number was in the database all along.
 *
 * THE LADDER, narrowest first, and the first rung with enough leases wins:
 *
 *   1. the same ZIP code, the same bedrooms, the same kind of home
 *   2. the town, the same bedrooms, the same kind
 *   3. the town, the same bedrooms, the neighbouring kinds
 *   4. the town, a bedroom either side, the same kind, then the neighbours
 *   5. ASKING rents in the town (fewer needed, and labelled as asking)
 *
 * and below that nothing: a blank the investor fills in beats a number built
 * from two apartments. Every answer says which rung it came from, how many
 * leases are behind it and over what dates, and the page prints all three.
 *
 * NOT TIME-ADJUSTED. A lease from eleven months ago counts as much as last
 * week's. Rents in these towns did not move enough in a year to matter against
 * the spread between one apartment and the next, and fitting a trend to them
 * would add a precision the data does not have. The page says so.
 */

export type RentKind = 'house' | 'condo' | 'apartment';

export interface RentRow {
  rent: number;
  bedrooms: number | null;
  /** RN_TYPE: A single family, B attached, C condo, D apartment… */
  subtype: string | null;
  zip: string | null;
  /** When the lease was recorded (leases) — null for asking rents. */
  date: string | null;
}

export interface RentEstimate {
  /** Median monthly rent. */
  rent: number;
  /** The middle half of the leases behind it: 25th to 75th percentile. */
  low: number;
  high: number;
  n: number;
  source: 'leased' | 'asking';
  scope: 'zip' | 'town';
  /** True when the bedrooms were widened by one either side. */
  nearBeds: boolean;
  /** True when other kinds of home were let in. */
  nearKinds: boolean;
  beds: number | null;
  kind: RentKind;
  /** The earliest and latest lease counted. */
  from: string | null;
  to: string | null;
  /** True when the query hit its row limit, so older leases were left out. */
  capped: boolean;
}

/**
 * Outside this, a "rent" is a typo, a parking space or a building. The feed has
 * both: a $100 lease and a $45,000 one sat in Newton's twelve months.
 */
export const RENT_BAND = { min: 500, max: 30_000 } as const;

/** Enough leases to call a median a median. */
export const MIN_LEASES = 5;
/** Asking rents are weaker evidence, and fewer of them are listed at once. */
export const MIN_ASKING = 3;

/**
 * RN_TYPE codes by kind: the kind itself first, then its neighbours. Parking (G),
 * mobile homes (E) and farms (F) are never a comparable for anything.
 */
export const RN_KINDS: Record<RentKind, { same: string[]; near: string[] }> = {
  house: { same: ['A'], near: ['A', 'B'] },
  condo: { same: ['C'], near: ['C', 'B', 'D'] },
  apartment: { same: ['D'], near: ['D', 'B', 'C'] },
};

/** What a for-sale listing would be let as. A multi-family is let by the unit. */
export const kindFor = (propType: string | null): RentKind =>
  propType === 'SF' ? 'house' : propType === 'CC' ? 'condo' : 'apartment';

const code = (subtype: string | null) => (subtype ?? '').split(',')[0].trim().toUpperCase();

/** Nearest-rank percentile on a sorted list: no interpolation, so every answer is a real lease. */
const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];

const median = (sorted: number[]) => {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

/** Rows that could be a rent at all. */
export const cleanRents = (rows: RentRow[]): RentRow[] =>
  rows.filter(
    (r) =>
      Number.isFinite(r.rent) &&
      r.rent >= RENT_BAND.min &&
      r.rent <= RENT_BAND.max &&
      !['E', 'F', 'G'].includes(code(r.subtype))
  );

const summarise = (
  rows: RentRow[],
  base: Pick<RentEstimate, 'source' | 'scope' | 'nearBeds' | 'nearKinds' | 'beds' | 'kind' | 'capped'>
): RentEstimate => {
  const rents = rows.map((r) => r.rent).sort((a, b) => a - b);
  const dates = rows
    .map((r) => r.date)
    .filter((d): d is string => Boolean(d))
    .sort();
  return {
    ...base,
    rent: Math.round(median(rents)),
    low: Math.round(percentile(rents, 25)),
    high: Math.round(percentile(rents, 75)),
    n: rents.length,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
  };
};

/**
 * The rent for one home (or one unit of a multi-family), or null.
 *
 * `beds` null means the bedroom count is unknown: every bedroom count is let
 * in, and `nearBeds` is set so the page says so.
 */
export const estimateRent = (
  leases: RentRow[],
  asking: RentRow[],
  subject: { kind: RentKind; beds: number | null; zip: string | null },
  capped = false
): RentEstimate | null => {
  const { kind, beds, zip } = subject;
  const leased = cleanRents(leases);
  const kinds = RN_KINDS[kind];
  const ofKind = (codes: string[]) => (r: RentRow) => codes.includes(code(r.subtype));
  const exactBeds = (r: RentRow) => beds === null || r.bedrooms === beds;
  const nearBeds = (r: RentRow) => beds === null || (r.bedrooms !== null && Math.abs(r.bedrooms - beds) <= 1);
  const zip5 = (zip ?? '').slice(0, 5);

  const rungs: {
    rows: RentRow[];
    scope: RentEstimate['scope'];
    nearBeds: boolean;
    nearKinds: boolean;
  }[] = [
    {
      rows: zip5 ? leased.filter((r) => (r.zip ?? '').slice(0, 5) === zip5 && exactBeds(r) && ofKind(kinds.same)(r)) : [],
      scope: 'zip',
      nearBeds: beds === null,
      nearKinds: false,
    },
    { rows: leased.filter((r) => exactBeds(r) && ofKind(kinds.same)(r)), scope: 'town', nearBeds: beds === null, nearKinds: false },
    { rows: leased.filter((r) => exactBeds(r) && ofKind(kinds.near)(r)), scope: 'town', nearBeds: beds === null, nearKinds: true },
    { rows: leased.filter((r) => nearBeds(r) && ofKind(kinds.same)(r)), scope: 'town', nearBeds: true, nearKinds: false },
    { rows: leased.filter((r) => nearBeds(r) && ofKind(kinds.near)(r)), scope: 'town', nearBeds: true, nearKinds: true },
  ];

  for (const rung of rungs) {
    if (rung.rows.length >= MIN_LEASES) {
      return summarise(rung.rows, { source: 'leased', scope: rung.scope, nearBeds: rung.nearBeds, nearKinds: rung.nearKinds, beds, kind, capped });
    }
  }

  const listed = cleanRents(asking);
  for (const [rows, near] of [
    [listed.filter((r) => exactBeds(r) && ofKind(kinds.near)(r)), beds === null],
    [listed.filter((r) => nearBeds(r) && ofKind(kinds.near)(r)), true],
  ] as const) {
    if (rows.length >= MIN_ASKING) {
      return summarise(rows, { source: 'asking', scope: 'town', nearBeds: near, nearKinds: true, beds, kind, capped: false });
    }
  }
  return null;
};

/* -------------------------------------------------------------------------- */
/* Multi-family units                                                          */
/* -------------------------------------------------------------------------- */

/**
 * How many units a multi-family has, and how its bedrooms are most likely
 * split between them.
 *
 * The unit count comes from MF_TYPE — the same field valuation.ts's unitClass
 * reads, 100% filled — not from `num_units`, which is partly filled and
 * sometimes disagrees (a two-family "A" listed with 3 units). When the two
 * disagree the page says so rather than choosing silently.
 *
 * The feed carries only the building's TOTAL bedrooms, so the split is an even
 * one, larger units first: seven bedrooms in three units is 3, 2, 2. The real
 * split is in the listing's photos and the agent's remarks, and the page lets
 * the investor correct it unit by unit.
 */
export interface UnitMix {
  units: number;
  /** True for a five-plus building, where the count may be higher. */
  atLeast: boolean;
  bedsPerUnit: (number | null)[];
  /** False when `num_units` names a different count from MF_TYPE. */
  agrees: boolean;
}

const UNIT_CODES: Record<string, number> = {
  A: 2, D: 2, F: 2, G: 2, H: 2,
  B: 3, I: 3, J: 3, K: 3,
  C: 4, L: 4, M: 4, N: 4,
  E: 5, O: 5, P: 5, Q: 5,
};

export const unitMix = (l: {
  prop_subtype: string | null;
  num_units: number | null;
  bedrooms: number | null;
}): UnitMix | null => {
  const fromType = UNIT_CODES[code(l.prop_subtype)];
  if (!fromType) return null;
  const fivePlus = fromType === 5;
  const units = fivePlus && (l.num_units ?? 0) > 5 ? (l.num_units as number) : fromType;
  const agrees =
    l.num_units === null || l.num_units === undefined || (fivePlus ? l.num_units >= 5 : l.num_units === fromType);
  const total = l.bedrooms;
  const bedsPerUnit: (number | null)[] =
    total === null || total === undefined || total < units
      ? Array.from({ length: units }, () => null)
      : Array.from({ length: units }, (_, i) => Math.floor(total / units) + (i < total % units ? 1 : 0));
  return { units, atLeast: fivePlus && units === 5, bedsPerUnit, agrees };
};

/* -------------------------------------------------------------------------- */
/* A listing's rent                                                            */
/* -------------------------------------------------------------------------- */

export interface ListingRent {
  /** All units together, per month; null when any unit has no estimate. */
  gross: number | null;
  /** One estimate per unit — a single entry for a house or a condo. */
  units: (RentEstimate | null)[];
  mix: UnitMix | null;
}

/**
 * What a for-sale listing would rent for, whole.
 *
 * A house or a condo is one estimate. A multi-family is one per unit, each at
 * the bedrooms unitMix gives it, summed — and if any unit has no evidence the
 * building has no total, rather than a total that quietly leaves a unit out.
 */
export const rentForListing = (
  l: { prop_type: string | null; prop_subtype: string | null; num_units: number | null; bedrooms: number | null; zip: string | null },
  leases: RentRow[],
  asking: RentRow[],
  capped = false
): ListingRent => {
  if (l.prop_type === 'MF') {
    const mix = unitMix(l);
    if (!mix) return { gross: null, units: [], mix: null };
    const units = mix.bedsPerUnit.map((beds) => estimateRent(leases, asking, { kind: 'apartment', beds, zip: l.zip }, capped));
    const gross = units.every((u) => u !== null) ? units.reduce((s, u) => s + (u as RentEstimate).rent, 0) : null;
    return { gross, units, mix };
  }
  const one = estimateRent(leases, asking, { kind: kindFor(l.prop_type), beds: l.bedrooms, zip: l.zip }, capped);
  return { gross: one?.rent ?? null, units: [one], mix: null };
};

const KIND_WORD: Record<RentKind, string> = { house: 'house', condo: 'condo', apartment: 'apartment' };
const NUMBER_WORDS = ['studio', 'one-bed', 'two-bed', 'three-bed', 'four-bed', 'five-bed', 'six-bed'];

/** "Mar–Oct 2026", from two YYYY-MM-DD dates. */
const span = (from: string | null, to: string | null): string | null => {
  if (!from || !to) return null;
  const month = (d: string) => new Date(`${d.slice(0, 7)}-15T12:00:00Z`).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const fy = from.slice(0, 4);
  const ty = to.slice(0, 4);
  return fy === ty ? `${month(from)}\u2013${month(to)} ${ty}` : `${month(from)} ${fy}\u2013${month(to)} ${ty}`;
};

/**
 * Where a rent came from, in a sentence: "median of 37 three-bed house leases
 * in Newton, Nov 2025–Oct 2026". Every widening of the ladder is said aloud,
 * because "two-bed apartments" and "one- to three-bed homes of any kind" are
 * different evidence for the same number.
 */
export const describeRent = (e: RentEstimate, where: { town: string; zip: string | null }): string => {
  const beds = e.beds === null ? 'any size' : NUMBER_WORDS[e.beds] ?? `${e.beds}-bed`;
  const bedsText = e.beds !== null && e.nearBeds ? `${beds} (\u00b11 bedroom)` : beds;
  const kind = e.nearKinds ? 'home' : KIND_WORD[e.kind];
  const place = e.scope === 'zip' && where.zip ? `ZIP ${where.zip.slice(0, 5)}` : where.town;
  const what = e.source === 'leased' ? 'leases' : 'asking rents on the market now';
  const dates = e.source === 'leased' ? span(e.from, e.to) : null;
  return `median of ${e.n} ${bedsText} ${kind} ${what} in ${place}${dates ? `, ${dates}` : ''}${e.capped ? ' (the most recent 1,000)' : ''}`;
};
