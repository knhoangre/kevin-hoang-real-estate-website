/**
 * What a NEW house sells for in a town — the exit of a teardown.
 *
 * PURE and checked (scripts/investment-check.ts). The rows are recent
 * single-family sales from idx_comparable_sales; a "new build" is one sold
 * within two years of the year it was built.
 *
 * SIZE-BANDED, because a price per square foot falls as houses get bigger:
 * Newton's new builds sold at a median $540 a sq ft against $619 for all its
 * houses (measured 2026-10-19) — the new ones are larger, not cheaper. So the
 * exit for a planned 4,000 sq ft house is read from new houses of about that
 * size, ±25%, widened once to ±40%, and the page shows how many and over what
 * dates. Too few, and there is no answer rather than a thin one.
 *
 * The planned SIZE, when the investor has not chosen one, is what has been
 * built on lots like this one in this town: the median size of new builds
 * whose lots were within 35% of this lot. Where too few were, it is the town's
 * own ratio of house to lot — new builds in Newton and Needham carry 0.49 sq ft
 * of house per sq ft of lot, Wellesley 0.38, Lexington 0.35 (2026-10-20) —
 * times this lot. Never the town's median new house on any lot: that proposed
 * a 6,100 sq ft house for a 1,456 sq ft lot in Newton before this rule. And
 * the ratio stops at the size of the largest new houses the town is selling
 * (their 90th percentile): house size does not keep growing with land, and an
 * acre in Newton is a subdivision question, not a 20,000 sq ft house.
 */

export interface SaleRow {
  sale_price: number | null;
  living_area: number | null;
  year_built: number | null;
  settled_date: string | null;
  lot_size: number | null;
  acres?: number | null;
}

export interface NewBuildExit {
  medianPrice: number;
  medianPerSqft: number;
  n: number;
  /** ±25 or ±40 (percent) around the planned size. */
  bandPct: number;
  from: string | null;
  to: string | null;
}

export const MIN_NEW_BUILDS = 3;

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const lotSqftOf = (r: SaleRow): number | null =>
  r.lot_size && r.lot_size > 100 ? r.lot_size : r.acres && r.acres > 0 ? r.acres * 43_560 : null;

/** Sold within two years of being built, with a real price and size. */
export const newBuilds = (rows: SaleRow[]): SaleRow[] =>
  rows.filter((r) => {
    const year = Number((r.settled_date ?? '').slice(0, 4));
    return (
      r.year_built !== null &&
      year > 0 &&
      r.year_built >= year - 2 &&
      (r.sale_price ?? 0) > 100_000 &&
      (r.living_area ?? 0) > 500
    );
  });

export const newBuildExit = (rows: SaleRow[], plannedSqft: number): NewBuildExit | null => {
  if (!(plannedSqft > 0)) return null;
  const built = newBuilds(rows);
  for (const bandPct of [25, 40]) {
    const lo = plannedSqft * (1 - bandPct / 100);
    const hi = plannedSqft * (1 + bandPct / 100);
    const inBand = built.filter((r) => (r.living_area as number) >= lo && (r.living_area as number) <= hi);
    if (inBand.length >= MIN_NEW_BUILDS) {
      const dates = inBand.map((r) => r.settled_date as string).sort();
      return {
        medianPrice: Math.round(median(inBand.map((r) => r.sale_price as number))),
        medianPerSqft: Math.round(median(inBand.map((r) => (r.sale_price as number) / (r.living_area as number)))),
        n: inBand.length,
        bandPct,
        from: dates[0] ?? null,
        to: dates[dates.length - 1] ?? null,
      };
    }
  }
  return null;
};

/** The median size of what has been built on lots like this one, or null. */
export const typicalNewSize = (
  rows: SaleRow[],
  lotSqft: number | null
): { sqft: number; n: number; basis: 'similar-lots' | 'ratio' | 'town'; ratio?: number; capped?: boolean } | null => {
  const built = newBuilds(rows);
  const round50 = (n: number) => Math.round(n / 50) * 50;
  if (lotSqft && lotSqft > 0) {
    const alike = built.filter((r) => {
      const lot = lotSqftOf(r);
      return lot !== null && Math.abs(lot - lotSqft) / lotSqft <= 0.35;
    });
    if (alike.length >= MIN_NEW_BUILDS) {
      return { sqft: round50(median(alike.map((r) => r.living_area as number))), n: alike.length, basis: 'similar-lots' };
    }
    const ratios = built
      .map((r) => {
        const lot = lotSqftOf(r);
        return lot ? (r.living_area as number) / lot : null;
      })
      .filter((x): x is number => x !== null && Number.isFinite(x));
    if (ratios.length >= MIN_NEW_BUILDS) {
      const ratio = median(ratios);
      const sizes = built.map((r) => r.living_area as number).sort((a, b) => a - b);
      const largest = sizes[Math.min(sizes.length - 1, Math.ceil(0.9 * sizes.length) - 1)];
      const byRatio = ratio * lotSqft;
      return {
        sqft: round50(Math.min(byRatio, largest)),
        n: ratios.length,
        basis: 'ratio',
        ratio: Math.round(ratio * 100) / 100,
        capped: byRatio > largest,
      };
    }
    return null;
  }
  if (built.length >= MIN_NEW_BUILDS) {
    return { sqft: round50(median(built.map((r) => r.living_area as number))), n: built.length, basis: 'town' };
  }
  return null;
};
