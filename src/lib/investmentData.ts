/**
 * What /investments reads from the database. Every read is retried
 * (withRetry, for the cold-cache timeout CLAUDE.md describes) and decides
 * nothing: the arithmetic is in investment.ts and rentComps.ts.
 *
 * THREE QUESTIONS PER TOWN, each shaped for an index that already exists:
 *
 *   listings    feed=active, town, state, available, ordered by price —
 *               idx_listings_active_town_price. Capped at 300, which every
 *               served town fits; the page says when the cap is hit.
 *   leases      feed=sold, RN, state, town, last twelve months, newest first —
 *               idx_listings_sold_comps exactly. Ordered DESC with NO nulls
 *               modifier: that index is DESC, which Postgres keeps NULLS FIRST,
 *               and asking for NULLS LAST is the one way not to use it.
 *   asking      feed=active, RN, state, town — the rentals on the market now,
 *               used only where there are too few leases.
 *
 * Measured 2026-10-19 on the live project: Cambridge, the largest served
 * town, answered the listings in 0.44 s and its 1,000 leases in 0.80 s.
 */
import { supabase } from '@/integrations/supabase/client';
import { AVAILABLE_STATUSES, CARD_COLUMNS, withRetry, type CardListing, type IdxListing } from '@/lib/idxSearch';
import type { RentRow } from '@/lib/rentComps';

export const SCREENER_LIMIT = 300;
export const LEASE_LIMIT = 1000;

const SCREENER_EXTRA = [
  'street_no',
  'street_name',
  'prop_subtype',
  'num_units',
  'lot_size',
  'acres',
  'year_built',
  'taxes',
  'tax_year',
  'hoa',
  'hoa_fee',
  'heating',
  'sewer',
  'remarks',
  'price_cut',
  'first_seen_at',
] as const;

export type ScreenerListing = CardListing & Pick<IdxListing, (typeof SCREENER_EXTRA)[number]>;

export type InvestmentType = 'SF' | 'CC' | 'MF';
export const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'SF', label: 'Single-family' },
  { value: 'CC', label: 'Condo' },
  { value: 'MF', label: 'Multi-family' },
];

export interface ScreenerQuery {
  town: string;
  state: string;
  type: InvestmentType | '';
  min: number | null;
  max: number | null;
  /** 'high' = dearest first (the index's own order); 'low' = cheapest first. */
  order: 'high' | 'low';
}

export const screenerListings = async (
  q: ScreenerQuery
): Promise<{ listings: ScreenerListing[]; capped: boolean }> =>
  withRetry(async () => {
    let query = supabase
      .from('idx_listings')
      .select([...CARD_COLUMNS, ...SCREENER_EXTRA].join(','))
      .eq('feed', 'active')
      .eq('town', q.town)
      .eq('state', q.state)
      .in('status', AVAILABLE_STATUSES);
    query = q.type ? query.eq('prop_type', q.type) : query.in('prop_type', ['SF', 'CC', 'MF']);
    if (q.min) query = query.gte('list_price', q.min);
    if (q.max) query = query.lte('list_price', q.max);
    // Cheapest first is a backward walk of the same index — ASC NULLS FIRST
    // mirrors its DESC NULLS LAST — and the $10,000 floor drops the $1
    // placeholders auctions are entered at, which would otherwise lead it.
    query =
      q.order === 'low'
        ? query.gte('list_price', 10_000).order('list_price', { ascending: true, nullsFirst: true })
        : query.order('list_price', { ascending: false, nullsFirst: false });
    const { data, error } = await query.limit(SCREENER_LIMIT);
    if (error) throw error;
    const listings = (data ?? []) as unknown as ScreenerListing[];
    return { listings, capped: listings.length >= SCREENER_LIMIT };
  }, 'Investment listings');

/** The first of the twelve months of leases counted, as YYYY-MM-DD. */
const yearAgo = () => new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);

export interface RentEvidence {
  leases: RentRow[];
  asking: RentRow[];
  /** True when the leases hit their limit, so the oldest were left out. */
  capped: boolean;
}

export const rentEvidence = async (town: string, state: string): Promise<RentEvidence> => {
  const [leased, listed] = await Promise.all([
    withRetry(async () => {
      const { data, error } = await supabase
        .from('idx_listings')
        .select('sale_price, bedrooms, prop_subtype, zip, settled_date')
        .eq('feed', 'sold')
        .eq('prop_type', 'RN')
        .eq('state', state)
        .eq('town', town)
        .gte('settled_date', yearAgo())
        .order('settled_date', { ascending: false })
        .limit(LEASE_LIMIT);
      if (error) throw error;
      return data ?? [];
    }, 'Leased rents'),
    withRetry(async () => {
      const { data, error } = await supabase
        .from('idx_listings')
        .select('list_price, bedrooms, prop_subtype, zip')
        .eq('feed', 'active')
        .eq('prop_type', 'RN')
        .eq('state', state)
        .eq('town', town)
        // By MLS number, not price, so a capped sample is not the dearest end.
        .order('mls_number', { ascending: false })
        .limit(LEASE_LIMIT);
      if (error) throw error;
      return data ?? [];
    }, 'Asking rents'),
  ]);
  return {
    leases: leased.map((r) => ({
      rent: Number(r.sale_price),
      bedrooms: r.bedrooms,
      subtype: r.prop_subtype,
      zip: r.zip,
      date: r.settled_date,
    })),
    asking: listed.map((r) => ({
      rent: Number(r.list_price),
      bedrooms: r.bedrooms,
      subtype: r.prop_subtype,
      zip: r.zip,
      date: null,
    })),
    capped: leased.length >= LEASE_LIMIT,
  };
};
