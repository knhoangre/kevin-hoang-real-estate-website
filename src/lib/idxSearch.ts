/**
 * Client-side helpers for the IDX search at /search.
 *
 * The listing data itself comes from Supabase (`idx_listings`), populated hourly
 * by the idx-sync Edge Function. Unlike every other page on this site, /search
 * is genuinely dynamic: there is no snapshot, nothing is prerendered, and the
 * page is `noindex`. See the comment block at the top of Search.tsx for why all
 * three of those are correct here and wrong everywhere else.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { IDX_CODES, type IdxPropType } from '@/lib/idx-codes';

/**
 * The three price-tracking columns added by
 * `supabase/migrations/20260901220000_idx_price_history.sql`.
 *
 * Declared as an intersection rather than waiting for `types.ts` to be
 * regenerated, because that file is generated from a live project and cannot be
 * hand-edited (see CLAUDE.md). Once it is regenerated the generated Row will
 * carry these three fields with the same names and types, and this intersection
 * becomes a no-op rather than a conflict — so it is safe either way.
 */
interface IdxPriceTracking {
  /** What the price was before the most recent change; null if none observed. */
  previous_list_price: number | null;
  price_change_at: string | null;
  /** Whether the last observed movement was a reduction. */
  price_cut: boolean | null;
  first_seen_at: string | null;
}

export type IdxListing = Database['public']['Tables']['idx_listings']['Row'] &
  Partial<IdxPriceTracking>;

/** How many results one page of /search shows. */
export const PAGE_SIZE = 24;

/**
 * A listing photo from MLS PIN's own media host.
 *
 * NOT copied into our storage, which is the opposite of the decision made for
 * Kevin's own sold listings in public/listings/ — and deliberately so. Those are
 * his, they are permanent, there are 339 of them, and serving them from Supabase
 * was costing 228 MB of egress per page read. These are MLS PIN's, they number
 * 582,561 across the active feed alone, they change hourly, and MLS PIN serves
 * them free from a host built for it. Copying them would be a bandwidth bill in
 * exchange for nothing.
 *
 * Photos are numbered from 0 and the feed's `photo_count` says how many exist,
 * so every URL is a pure function of the MLS number and the index.
 */
export const photoUrl = (mls: string, n = 0, size: 'card' | 'full' = 'card') => {
  const [w, h] = size === 'full' ? [1024, 768] : [600, 450];
  return `https://media.mlspin.com/photo.aspx?nopadding=1&w=${w}&h=${h}&mls=${encodeURIComponent(mls)}&o=&n=${n}`;
};

/** Every photo index a listing has, as URLs. Empty when it has none. */
export const photoUrls = (listing: Pick<IdxListing, 'mls_number' | 'photo_count'>, size: 'card' | 'full' = 'full') =>
  Array.from({ length: Math.max(0, listing.photo_count ?? 0) }, (_, n) =>
    photoUrl(listing.mls_number, n, size)
  );

/** Human labels for the feed's property-type codes. */
export const PROP_TYPES: { value: string; label: string }[] = [
  { value: 'SF', label: 'Single family' },
  { value: 'CC', label: 'Condo' },
  { value: 'MF', label: 'Multi-family' },
  { value: 'RN', label: 'Rental' },
];

export const propTypeLabel = (code: string | null) =>
  PROP_TYPES.find((p) => p.value === code)?.label ?? code ?? 'Property';

/**
 * MLS PIN status codes, spelled out.
 *
 * These are the ten codes that actually occur across all eight feeds, counted
 * rather than assumed: SLD, RNT, ACT, UAG, NEW, CTG, PCG, BOM, EXT, RAC. An
 * unrecognised code falls through to itself rather than to a guess — a status
 * is a statement about whether a home can still be bought, and inventing one is
 * worse than showing four letters.
 *
 * Confirm against the Field Reference when it is to hand; these are the
 * standard MLS PIN meanings but have not been read off the official table.
 */
const STATUS_LABELS: Record<string, string> = {
  ACT: 'Active',
  NEW: 'New listing',
  BOM: 'Back on market',
  PCG: 'Price changed',
  EXT: 'Extended',
  RAC: 'Reactivated',
  CTG: 'Contingent',
  UAG: 'Under agreement',
  SLD: 'Sold',
  RNT: 'Rented',
};

export const statusLabel = (code: string | null) =>
  code ? STATUS_LABELS[code.trim().toUpperCase()] ?? code : null;

/**
 * Whether a status still means "you can buy this".
 *
 * Contingent and under-agreement listings are still shown — they fall through
 * often enough to matter — but they are marked, because presenting one as
 * simply available wastes a buyer's afternoon.
 */
export const AVAILABLE_STATUSES = ['ACT', 'NEW', 'BOM', 'PCG', 'EXT', 'RAC'];

export const isAvailable = (code: string | null) =>
  AVAILABLE_STATUSES.includes((code ?? '').trim().toUpperCase());

/**
 * The filter state, which lives entirely in the URL query string.
 *
 * Deliberately not component state: `?town=Needham&maxPrice=900000` is itself a
 * link Kevin can text to a client, which is the whole point of this feature.
 * State held in a component is a search only the person who typed it can see.
 */
/**
 * What the search is looking at.
 *
 * NOT a free-form status filter, even though four of the seven are statuses.
 * These are the questions people actually arrive with, and each one implies a
 * feed, a property-type rule and a sort together — sold results ordered by
 * price would bury last week's closings under a mansion that closed eleven
 * months ago, and rentals priced per month sort a $4,000 apartment above a $2M
 * house. That coupling is why this is one control rather than a status dropdown
 * beside a feed dropdown.
 *
 * `sale` NARROWED when the status tabs were added, and that is the substantive
 * change here. It used to mean "everything in the active feed", so a third of a
 * Needham result page could be homes already under agreement, marked but still
 * counted. Now it means what the words say — available to buy today — and the
 * homes that are spoken for have their own tabs, with `all` for anyone who
 * wants the whole active market in one list. Nothing is hidden; it is reachable
 * in one click and stated on the button.
 */
export type ListingType = 'sale' | 'uag' | 'ctg' | 'pricecut' | 'all' | 'sold' | 'rent';

/**
 * Order is the reading order of the question: what is available, what is nearly
 * gone, what just got cheaper, then everything, then the two other markets.
 */
export const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'sale', label: 'For sale' },
  { value: 'uag', label: 'Under agreement' },
  { value: 'ctg', label: 'Contingent' },
  { value: 'pricecut', label: 'Price cut' },
  { value: 'all', label: 'All active' },
  { value: 'sold', label: 'Sold' },
  { value: 'rent', label: 'For rent' },
];

export interface SearchFilters {
  listingType: ListingType;
  /** Free text, matched against address, town and MLS number. */
  q: string;
  town: string;
  propType: string;
  minPrice: string;
  maxPrice: string;
  beds: string;
  baths: string;
  page: number;
}

export const EMPTY_FILTERS: SearchFilters = {
  listingType: 'sale',
  q: '',
  town: '',
  propType: '',
  minPrice: '',
  maxPrice: '',
  beds: '',
  baths: '',
  page: 1,
};

const LISTING_TYPE_VALUES = LISTING_TYPES.map((t) => t.value);

export const filtersFromParams = (params: URLSearchParams): SearchFilters => ({
  listingType: (LISTING_TYPE_VALUES as string[]).includes(params.get('for') ?? '')
    ? (params.get('for') as ListingType)
    : 'sale',
  q: params.get('q') ?? '',
  town: params.get('town') ?? '',
  propType: params.get('type') ?? '',
  minPrice: params.get('min') ?? '',
  maxPrice: params.get('max') ?? '',
  beds: params.get('beds') ?? '',
  baths: params.get('baths') ?? '',
  page: Math.max(1, Number(params.get('page') ?? '1') || 1),
});

/** Only non-empty values are written, so a shared URL stays readable. */
export const paramsFromFilters = (f: SearchFilters): URLSearchParams => {
  const p = new URLSearchParams();
  // 'sale' is the default, so it stays out of the URL — a shared link should
  // carry what was chosen, not restate the defaults.
  if (f.listingType !== 'sale') p.set('for', f.listingType);
  if (f.q) p.set('q', f.q);
  if (f.town) p.set('town', f.town);
  if (f.propType) p.set('type', f.propType);
  if (f.minPrice) p.set('min', f.minPrice);
  if (f.maxPrice) p.set('max', f.maxPrice);
  if (f.beds) p.set('beds', f.beds);
  if (f.baths) p.set('baths', f.baths);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
};

/**
 * Run one search. Returns the page of rows plus the total match count, which is
 * what drives the pager.
 *
 * `count: 'exact'` on 22,000 rows is cheap because every filtered column is
 * indexed; without it the page could not say "1–24 of 378" and a user could not
 * tell a narrow search from a broken one.
 */
export const searchListings = async (f: SearchFilters) => {
  const sold = f.listingType === 'sold';

  let query = supabase.from('idx_listings').select('*', { count: 'exact' });

  /*
   * Rentals live in the same table as sales and are priced per month, so mixing
   * them sorts a $4,000/mo apartment above a $2M house. They are a separate
   * choice rather than a property type filter for that reason.
   */
  if (f.listingType === 'rent') {
    query = query.eq('feed', 'active').eq('prop_type', 'RN');
  } else if (sold) {
    query = query.eq('feed', 'sold').neq('prop_type', 'RN');
  } else {
    query = query.eq('feed', 'active').neq('prop_type', 'RN');

    /*
     * The status tabs, applied within the active feed.
     *
     * `all` deliberately adds nothing — it is the absence of this filter, which
     * is what makes it a meaningful choice next to the other three rather than
     * a duplicate of `sale`.
     */
    if (f.listingType === 'sale') query = query.in('status', AVAILABLE_STATUSES);
    else if (f.listingType === 'uag') query = query.eq('status', 'UAG');
    else if (f.listingType === 'ctg') query = query.eq('status', 'CTG');
    else if (f.listingType === 'pricecut') {
      /*
       * TWO SOURCES, because neither is sufficient alone.
       *
       * `price_cut` is what this site watched happen between two syncs: exact,
       * dated, and reduction-only — but it knows nothing about a cut made
       * before the listing first appeared here. PCG is MLS PIN's own flag,
       * which covers those, but says only that a price moved at some point and
       * is replaced by whatever status the listing takes next.
       *
       * Together they are the honest answer to "what got cheaper". A listing
       * matching only PCG still renders no cut figure on its card, because we
       * do not know what the old price was and inventing one would be a false
       * claim about someone else's listing.
       */
      query = query.or('status.eq.PCG,price_cut.is.true');
    }
  }

  // Sold listings are ordered by WHEN they closed. By price, last week's sales
  // would sit behind a mansion that closed eleven months ago — useless for
  // anyone judging what a street is doing now.
  query = sold
    ? query.order('settled_date', { ascending: false, nullsFirst: false })
    : query.order('list_price', { ascending: false, nullsFirst: false });

  /*
   * Free text across address, town AND MLS number, so someone can paste
   * "73524017" or type "Wiswall" without deciding which field it belongs to.
   *
   * Backed by the GIN trigram indexes; mls_number is the primary key, and an
   * exact paste hits it directly.
   *
   * Commas and parentheses are stripped because they are PostgREST's own
   * delimiters inside an `or` filter: "12 Main St, Newton" would otherwise be
   * read as two conditions and error.
   */
  if (f.q) {
    const term = f.q.replace(/[(),]/g, ' ').trim();
    if (term) {
      query = query.or(
        `address.ilike.%${term}%,town.ilike.%${term}%,mls_number.ilike.%${term}%`
      );
    }
  }

  if (f.town) query = query.eq('town', f.town);
  if (f.propType) query = query.eq('prop_type', f.propType);

  // Sold rows are filtered on what they SOLD for, not what they asked. Filtering
  // a sold search by list price would answer a question nobody asked.
  const priceColumn = sold ? 'sale_price' : 'list_price';
  const min = Number(f.minPrice);
  const max = Number(f.maxPrice);
  if (f.minPrice && Number.isFinite(min)) query = query.gte(priceColumn, min);
  if (f.maxPrice && Number.isFinite(max)) query = query.lte(priceColumn, max);

  // Beds and baths are minimums, which is how anyone actually shops: "at least
  // three bedrooms", never "exactly three".
  const beds = Number(f.beds);
  if (f.beds && Number.isFinite(beds)) query = query.gte('bedrooms', beds);
  const baths = Number(f.baths);
  if (f.baths && Number.isFinite(baths)) query = query.gte('full_baths', baths);

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;

  return { listings: (data ?? []) as IdxListing[], total: count ?? 0 };
};

/** What a listing's headline price is, given which list it appears in. */
export const headlinePrice = (listing: IdxListing) =>
  listing.feed === 'sold' ? listing.sale_price ?? listing.list_price : listing.list_price;

/** One listing by MLS number, for /search/<mls>. */
export const listingByMls = async (mls: string) => {
  const { data, error } = await supabase
    .from('idx_listings')
    .select('*')
    .eq('mls_number', mls)
    .maybeSingle();
  if (error) throw error;
  return (data as IdxListing | null) ?? null;
};

/** The listing office, for the attribution line MLS PIN requires. */
export const officeName = async (officeId: string | null) => {
  if (!officeId) return null;
  const { data } = await supabase
    .from('idx_offices')
    .select('name')
    .eq('office_id', officeId)
    .maybeSingle();
  return data?.name ?? null;
};

/**
 * When the feed last loaded successfully.
 *
 * MLS PIN requires an IDX display to show how current its data is, so this is a
 * compliance requirement rather than a nicety — and it reads the last SUCCESSFUL
 * run, not the last attempt, because a page claiming freshness on the strength
 * of a failed sync is exactly the false claim the requirement exists to prevent.
 */
export const lastSyncedAt = async (): Promise<string | null> => {
  const { data } = await supabase
    .from('idx_sync_runs')
    .select('finished_at')
    .eq('ok', true)
    .order('finished_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.finished_at ?? null;
};

/**
 * Expand one coded feed field into readable labels.
 *
 * The feed stores these as comma-separated letter codes — HEATING "B,N",
 * APPLIANCES "A,C,F,I,K,L". THE PROPERTY TYPE IS REQUIRED, not optional:
 * HEATING "C" is "Gas" on a rental, "Hot Air Gravity" on a single-family and
 * "Hot Water Baseboard" on a condo. A lookup that ignored it would mislabel
 * thousands of listings while looking entirely plausible.
 *
 * A code with no entry in the codebook is DROPPED rather than shown raw. The
 * reference is regenerated from MLS PIN, so an unknown code means the reference
 * is behind — and "Heating: Forced Air, N" is worse than "Heating: Forced Air".
 * If every code is unknown the field renders as nothing at all, which is the
 * same honest silence the rest of the site uses for data it does not have.
 */
export const decodeCodes = (
  field: string,
  value: string | null,
  propType: string | null
): string | null => {
  if (!value) return null;

  const byType = IDX_CODES[field];
  if (!byType) return null;

  const table = byType[(propType ?? '') as IdxPropType];
  if (!table) return null;

  const labels = value
    .split(',')
    .map((code) => table[code.trim()])
    .filter(Boolean);

  // De-duplicated: several codes can map to the same label across a revision
  // of the reference, and "Other (See Remarks), Other (See Remarks)" is noise.
  return labels.length ? [...new Set(labels)].join(', ') : null;
};

/** The towns that actually have listings, with a count each, for the filter. */
export const townsWithListings = async (): Promise<{ town: string; listings: number }[]> => {
  // Through an RPC because PostgREST exposes no DISTINCT: reading the town
  // column for all ~22,000 rows and deduping in the browser is a ~300 KB
  // response to populate one dropdown, on every visit. Postgres answers this
  // from the town index instead. See the migration for the full note.
  const { data, error } = await supabase.rpc('idx_towns_with_listings');
  if (error) throw error;
  return (data ?? []) as { town: string; listings: number }[];
};

/**
 * A price movement, or null when there is nothing honest to say about one.
 *
 * Null covers three different situations that must all render as silence: no
 * change has been observed, the listing is sold (the movement that matters
 * there is asked-vs-closed, which the page already states), or one of the two
 * numbers is missing. A cut is the single most useful thing a buyer can know
 * about a listing that has been sitting — and a *fabricated* one, derived from
 * a price we never actually saw before, would be a false claim about someone
 * else's listing.
 */
export interface PriceChange {
  direction: 'down' | 'up';
  from: number;
  to: number;
  /** Always positive; the direction carries the sign. */
  amount: number;
  percent: number;
  at: string | null;
}

export const priceChange = (listing: IdxListing): PriceChange | null => {
  if (listing.feed === 'sold') return null;
  const from = listing.previous_list_price ?? null;
  const to = listing.list_price;
  if (from === null || to === null || from <= 0 || from === to) return null;
  return {
    direction: to < from ? 'down' : 'up',
    from,
    to,
    amount: Math.abs(to - from),
    // Whole percent. The prices are exact, but two decimals about a seller's
    // negotiating position is false precision.
    percent: Math.round((Math.abs(to - from) / from) * 100),
    at: listing.price_change_at ?? null,
  };
};

/** One entry in a listing's observed price history. */
export interface PriceHistoryEntry {
  list_price: number | null;
  previous_list_price: number | null;
  recorded_at: string;
}

/**
 * The price CHANGES observed for one listing, newest first.
 *
 * "Observed" is the operative word and the UI says so: the feed is a snapshot
 * with no history in it, so this starts the day the listing first appeared in
 * our copy. Presenting it as the listing's complete history would be a claim we
 * cannot support.
 *
 * CHANGES ONLY — `previous_list_price` must be present. The first-observation
 * row (previous NULL) is deliberately excluded: "we saw this listing at its
 * asking price" is not history, it is the price, and it is already the largest
 * number on the page. A timeline whose only entry restates the headline is
 * noise dressed as data.
 *
 * That exclusion is also what made this section survivable while the ingest was
 * broken. A trigger bug appended a fresh first-observation row on every hourly
 * sync — 278,000 of them against 25 real changes — and the page rendered
 * fourteen identical "First seen $21,500,000" lines for a single listing. The
 * trigger is fixed in
 * supabase/migrations/20260903090000_fix_idx_price_history_upsert.sql, but this
 * filter is the second line of defence: the display now shows nothing at all
 * unless a price actually moved, whatever the table happens to contain.
 *
 * Consecutive duplicates are collapsed for the same reason. Two rows claiming
 * the same move are a bug wherever they come from, and rendering both states
 * that a house was cut twice to the same number.
 */
export const priceHistory = async (mls: string): Promise<PriceHistoryEntry[]> => {
  const { data, error } = await supabase
    // idx_price_history is not in the generated types yet; see IdxPriceTracking
    // above. The cast is scoped to this one call rather than to the client, so
    // it cannot collapse the rest of the data layer to `any` the way the old
    // `as any` client cast did.
    .from('idx_price_history' as never)
    .select('list_price, previous_list_price, recorded_at')
    .eq('mls_number', mls)
    .not('previous_list_price', 'is', null)
    .order('recorded_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as PriceHistoryEntry[];

  return rows.filter((row, i) => {
    if (row.list_price === null) return false;
    // A move to the price it was already at is not a move.
    if (row.list_price === row.previous_list_price) return false;
    const prev = rows[i - 1];
    return !(
      prev &&
      prev.list_price === row.list_price &&
      prev.previous_list_price === row.previous_list_price
    );
  });
};

/**
 * Price per square foot — the number two listings are actually compared on.
 *
 * Uses `headlinePrice`, so a sold listing gives SALE price per square foot,
 * which is the more useful of the two and the one a buyer means. Null unless
 * both numbers are genuinely present: dividing by a missing `living_area`
 * yields Infinity, and deriving it from a null price yields NaN — either would
 * print a confident wrong figure about another brokerage's listing.
 */
export const pricePerSqft = (listing: IdxListing): number | null => {
  const price = headlinePrice(listing);
  const area = listing.living_area;
  if (price === null || price <= 0 || area === null || area <= 0) return null;
  return Math.round(price / area);
};

/**
 * A few listings like this one, so the page is not a dead end.
 *
 * Matched on the axes someone actually substitutes across — same town, same
 * property type, comparable price and bed count — rather than on a similarity
 * score nobody can audit. The ±25% price band and ±1 bedroom are wide enough to
 * find something in a thin town and narrow enough that the results are
 * genuinely alternatives.
 *
 * Active listings are additionally restricted to statuses you can still buy:
 * offering someone an under-agreement home as an alternative to the one they
 * are looking at wastes the afternoon this feature exists to save.
 *
 * Returns [] rather than throwing. Like `priceHistory`, this is context and not
 * the subject of the page — a failed query here must never take the listing
 * down with it.
 */
export const similarListings = async (
  listing: IdxListing,
  limit = 3
): Promise<IdxListing[]> => {
  const price = headlinePrice(listing);
  if (!listing.town || !listing.prop_type || price === null || price <= 0) return [];

  // Sold rows are compared on what they SOLD for, matching how searchListings
  // filters them — a sold comp banded by its asking price answers a different
  // question.
  const priceColumn = listing.feed === 'sold' ? 'sale_price' : 'list_price';

  const side = (direction: 'above' | 'below') => {
    let query = supabase
      .from('idx_listings')
      .select('*')
      .eq('feed', listing.feed)
      .eq('town', listing.town!)
      .eq('prop_type', listing.prop_type!)
      .neq('mls_number', listing.mls_number);

    if (listing.feed !== 'sold') query = query.in('status', AVAILABLE_STATUSES);

    if (listing.bedrooms !== null) {
      query = query.gte('bedrooms', listing.bedrooms - 1).lte('bedrooms', listing.bedrooms + 1);
    }

    return direction === 'above'
      ? query
          .gte(priceColumn, price)
          .lte(priceColumn, price * 1.25)
          .order(priceColumn, { ascending: true })
          .limit(limit)
      : query
          .gte(priceColumn, price * 0.75)
          .lt(priceColumn, price)
          .order(priceColumn, { ascending: false })
          .limit(limit);
  };

  try {
    /*
     * TWO QUERIES, ONE EACH SIDE OF THE PRICE — and this is the whole trick.
     *
     * The obvious single query (band the price, LIMIT 3, sort by proximity in
     * the browser) is wrong in exactly the markets that matter, because a LIMIT
     * with no ORDER BY returns whatever Postgres reaches first. Against a
     * $1,149,000 Boston single-family it returned twelve listings at $865k-$899k
     * — every one of them the far edge of the band — so the "closest" three were
     * the three worst matches available while genuine $1.1M comps sat unfetched.
     * Sorting by proximity afterwards cannot fix a slice that never contained
     * the near ones.
     *
     * Ordering by price and walking outwards from the subject in both
     * directions fetches the actual nearest neighbours, which is what a comp is.
     */
    const [above, below] = await Promise.all([side('above'), side('below')]);
    if (above.error) throw above.error;
    if (below.error) throw below.error;

    return [...((above.data ?? []) as IdxListing[]), ...((below.data ?? []) as IdxListing[])]
      .sort(
        (a, b) =>
          Math.abs((headlinePrice(a) ?? 0) - price) - Math.abs((headlinePrice(b) ?? 0) - price)
      )
      .slice(0, limit);
  } catch {
    return [];
  }
};

/**
 * The median asking rent for comparable units in a town, or null.
 *
 * Seeds the investment panel on a listing page. An investor can type their own
 * rent — and should — but a panel that opens at $0 shows a catastrophic cash
 * flow for every property and reads as broken rather than as empty.
 *
 * MEDIAN, NOT MEAN. One $12,000 Back Bay penthouse in a sample of Boston
 * two-beds drags an average somewhere no actual unit rents for; the median
 * survives it. Null below a floor of three comparable listings, because a
 * "median" of one is that one listing wearing a statistic's clothes.
 *
 * This is asking rent from the active rental feed, not achieved rent, and the
 * UI says so. Returns null rather than throwing: like every other supporting
 * query on that page, a failure here must leave the listing standing.
 */
export const medianAskingRent = async (
  town: string | null,
  bedrooms: number | null
): Promise<{ rent: number; sampleSize: number } | null> => {
  if (!town) return null;

  try {
    let query = supabase
      .from('idx_listings')
      .select('list_price')
      .eq('feed', 'active')
      .eq('prop_type', 'RN')
      .eq('town', town)
      .not('list_price', 'is', null)
      .gt('list_price', 0);

    if (bedrooms !== null) {
      query = query.gte('bedrooms', bedrooms - 1).lte('bedrooms', bedrooms + 1);
    }

    /*
     * Capped at 200 rows, which in a big rental market (Boston runs well past
     * it) makes this the median of a SAMPLE rather than of the whole town. That
     * is acceptable here and would not have been in similarListings: an
     * unordered LIMIT there systematically returned one end of the price band,
     * because the caller then picked the extremes of what it fetched. Here the
     * rows arrive in physical order — which tracks when the sync inserted them,
     * not what they cost — so the sample is uncorrelated with price and its
     * median is a fair estimate of the population's.
     */
    const { data, error } = await query.limit(200);
    if (error) throw error;

    const rents = (data ?? [])
      .map((r) => Number((r as { list_price: number | null }).list_price))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);

    if (rents.length < 3) return null;

    const mid = Math.floor(rents.length / 2);
    const rent =
      rents.length % 2 === 0 ? (rents[mid - 1] + rents[mid]) / 2 : rents[mid];

    return { rent: Math.round(rent), sampleSize: rents.length };
  } catch {
    return null;
  }
};
