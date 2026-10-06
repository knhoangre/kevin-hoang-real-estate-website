/**
 * What to recommend to somebody, worked out from what they have looked at.
 *
 * PURE — no network, no DOM, no imports — like valuation.ts, and for the same
 * reason: `node scripts/recommendations-check.ts` runs it against histories
 * whose right answer is known. The fetching is in favorites.ts and holds no
 * judgement.
 *
 * NOT A SIMILARITY SCORE. A profile is four plain statements anybody can read
 * back and disagree with — these towns, this kind of home, this price range,
 * about this many bedrooms — because a recommendation the reader cannot explain
 * to themselves is one they have no reason to trust. `similarListings` makes the
 * same choice for one listing; this is that, for a history.
 */

/** One home somebody saved or opened, reduced to the axes that matter here. */
export interface TasteSignal {
  town: string | null;
  state: string | null;
  propType: string | null;
  price: number | null;
  bedrooms: number | null;
  /**
   * How much this counts. A saved home is a decision and a view is a glance, so
   * favourites weigh more; a home opened five times weighs more than one opened
   * once, but not five times more — see `viewWeight`.
   */
  weight: number;
}

export interface TasteProfile {
  /** Rentals and sales are different markets and never mixed. */
  market: 'sale' | 'rent';
  /** Up to three, strongest first, each with the state its listings were in. */
  towns: { town: string; state: string | null }[];
  /** The dominant property type within the market. Null when there is none. */
  propType: string | null;
  minPrice: number;
  maxPrice: number;
  /** The typical bedroom count. Null when no signal carried one. */
  bedrooms: number | null;
}

/** A saved home counts as four first views. */
export const FAVORITE_WEIGHT = 4;

/**
 * Repeat visits count, with diminishing returns: 1 view is 1, 4 views is 2,
 * 9 views is 3. Linear weighting lets one home somebody kept reopening — often
 * the one they cannot afford — outvote the dozen they looked at once and could.
 */
export const viewWeight = (viewCount: number): number => Math.sqrt(Math.max(1, viewCount));

const isRental = (propType: string | null) => propType === 'RN';

/** The value at a cumulative weight fraction `q`, by weight rather than by row. */
const weightedQuantile = (points: { value: number; weight: number }[], q: number): number => {
  const sorted = [...points].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, p) => sum + p.weight, 0);
  let running = 0;
  for (const p of sorted) {
    running += p.weight;
    if (running >= total * q) return p.value;
  }
  return sorted[sorted.length - 1].value;
};

/** Heaviest key first. Ties break alphabetically so the answer is the same every time. */
const ranked = <T extends string>(weights: Map<T, number>): T[] =>
  [...weights.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key]) => key);

/**
 * The profile, or null when there is nothing to go on.
 *
 * NULL IS A REAL ANSWER. With no priced, located home in the history there is no
 * honest recommendation — the page says so and shows none, rather than falling
 * back to "popular listings", which would be the site's taste presented as the
 * visitor's.
 *
 * THE PRICE BAND is the middle of what they looked at, by weight — the 20th to
 * the 80th percentile — widened by 15% each side. The middle, because every
 * history has a dream house and a floor in it and neither is what they are
 * shopping for; widened, because a band drawn exactly around five homes
 * recommends those five homes' twins and nothing a little cheaper.
 */
export const tasteProfile = (signals: TasteSignal[]): TasteProfile | null => {
  const usable = signals.filter(
    (s) => s.town && s.price !== null && s.price > 0 && s.weight > 0
  );
  if (usable.length === 0) return null;

  // Which market first: everything after is computed inside it, so a history
  // of rentals with one house in it does not get a $3,000-to-$900,000 band.
  const rentWeight = usable.filter((s) => isRental(s.propType)).reduce((n, s) => n + s.weight, 0);
  const saleWeight = usable.filter((s) => !isRental(s.propType)).reduce((n, s) => n + s.weight, 0);
  const market: TasteProfile['market'] = rentWeight > saleWeight ? 'rent' : 'sale';
  const inMarket = usable.filter((s) => isRental(s.propType) === (market === 'rent'));

  // Town names are not unique across the feed — Dover is in two states — so a
  // town is always carried with the state its listings were in.
  const townWeights = new Map<string, number>();
  const townState = new Map<string, Map<string, number>>();
  for (const s of inMarket) {
    const town = s.town as string;
    townWeights.set(town, (townWeights.get(town) ?? 0) + s.weight);
    const states = townState.get(town) ?? new Map<string, number>();
    states.set(s.state ?? '', (states.get(s.state ?? '') ?? 0) + s.weight);
    townState.set(town, states);
  }
  const towns = ranked(townWeights)
    .slice(0, 3)
    .map((town) => ({
      town,
      state: ranked(townState.get(town) ?? new Map<string, number>())[0] || null,
    }));

  const typeWeights = new Map<string, number>();
  for (const s of inMarket) {
    if (s.propType) typeWeights.set(s.propType, (typeWeights.get(s.propType) ?? 0) + s.weight);
  }
  const propType = market === 'rent' ? 'RN' : ranked(typeWeights)[0] ?? null;

  const prices = inMarket.map((s) => ({ value: s.price as number, weight: s.weight }));
  const minPrice = Math.floor(weightedQuantile(prices, 0.2) * 0.85);
  const maxPrice = Math.ceil(weightedQuantile(prices, 0.8) * 1.15);

  const beds = inMarket
    .filter((s) => s.bedrooms !== null)
    .map((s) => ({ value: s.bedrooms as number, weight: s.weight }));
  const bedrooms = beds.length > 0 ? weightedQuantile(beds, 0.5) : null;

  return { market, towns, propType, minPrice, maxPrice, bedrooms };
};

/** What ranking needs to know about a candidate. */
export interface Candidate {
  mls: string;
  town: string | null;
  price: number | null;
}

/**
 * Candidates in the order to show them, with anything already seen removed.
 *
 * Favourite town first, then nearest the middle of the price band. The towns
 * are INTERLEAVED rather than exhausted one at a time: a list that is twelve
 * homes in the top town never shows the second and third, and those are the
 * ones the reader has not already gone through.
 */
export const rankCandidates = <T extends Candidate>(
  candidates: T[],
  profile: TasteProfile,
  seen: ReadonlySet<string>,
  limit = 12
): T[] => {
  const middle = (profile.minPrice + profile.maxPrice) / 2;
  const byTown = profile.towns.map(({ town }) =>
    candidates
      .filter((c) => c.town === town && !seen.has(c.mls))
      .sort(
        (a, b) =>
          Math.abs((a.price ?? 0) - middle) - Math.abs((b.price ?? 0) - middle) ||
          a.mls.localeCompare(b.mls)
      )
  );

  const out: T[] = [];
  const taken = new Set<string>();
  for (let round = 0; out.length < limit; round += 1) {
    let added = false;
    for (const list of byTown) {
      const next = list[round];
      if (next && !taken.has(next.mls) && out.length < limit) {
        out.push(next);
        taken.add(next.mls);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
};

/** "Newton, Needham and Wellesley" — for the line that says what the list is based on. */
export const describeProfile = (profile: TasteProfile, formatPrice: (n: number) => string): string => {
  const names = profile.towns.map((t) => t.town);
  const where =
    names.length <= 1
      ? names[0] ?? ''
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const suffix = profile.market === 'rent' ? ' a month' : '';
  return `${where}, ${formatPrice(profile.minPrice)} to ${formatPrice(profile.maxPrice)}${suffix}`;
};
