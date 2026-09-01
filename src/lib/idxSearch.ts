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

export type IdxListing = Database['public']['Tables']['idx_listings']['Row'];

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
 * The filter state, which lives entirely in the URL query string.
 *
 * Deliberately not component state: `?town=Needham&maxPrice=900000` is itself a
 * link Kevin can text to a client, which is the whole point of this feature.
 * State held in a component is a search only the person who typed it can see.
 */
export interface SearchFilters {
  town: string;
  propType: string;
  minPrice: string;
  maxPrice: string;
  beds: string;
  baths: string;
  page: number;
}

export const EMPTY_FILTERS: SearchFilters = {
  town: '',
  propType: '',
  minPrice: '',
  maxPrice: '',
  beds: '',
  baths: '',
  page: 1,
};

export const filtersFromParams = (params: URLSearchParams): SearchFilters => ({
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
  if (f.town) p.set('town', f.town);
  if (f.propType) p.set('type', f.propType);
  if (f.minPrice) p.set('min', f.minPrice);
  if (f.maxPrice) p.set('max', f.maxPrice);
  if (f.beds) p.set('beds', f.beds);
  if (f.baths) p.set('baths', f.baths);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
};

export const hasAnyFilter = (f: SearchFilters) =>
  Boolean(f.town || f.propType || f.minPrice || f.maxPrice || f.beds || f.baths);

/**
 * Run one search. Returns the page of rows plus the total match count, which is
 * what drives the pager.
 *
 * `count: 'exact'` on 22,000 rows is cheap because every filtered column is
 * indexed; without it the page could not say "1–24 of 378" and a user could not
 * tell a narrow search from a broken one.
 */
export const searchListings = async (f: SearchFilters) => {
  let query = supabase
    .from('idx_listings')
    .select('*', { count: 'exact' })
    // Rentals are priced per month and everything else is a sale price, so
    // mixing them in one list sorts a $4,000/mo apartment above a $2M house.
    // The type filter is how they are separated; the default view excludes
    // rentals for the same reason.
    .order('list_price', { ascending: false, nullsFirst: false });

  if (f.town) query = query.eq('town', f.town);
  if (f.propType) query = query.eq('prop_type', f.propType);
  else query = query.neq('prop_type', 'RN');

  const min = Number(f.minPrice);
  const max = Number(f.maxPrice);
  if (f.minPrice && Number.isFinite(min)) query = query.gte('list_price', min);
  if (f.maxPrice && Number.isFinite(max)) query = query.lte('list_price', max);

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
