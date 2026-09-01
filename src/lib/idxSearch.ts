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
export const isAvailable = (code: string | null) =>
  ['ACT', 'NEW', 'BOM', 'PCG', 'EXT', 'RAC'].includes((code ?? '').trim().toUpperCase());

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
 * Not a free-form status filter: these three are the questions people actually
 * arrive with, and each implies a different feed, a different property-type
 * rule AND a different sort. Sold results ordered by price would bury last
 * week's closings under a mansion from eleven months ago.
 */
export type ListingType = 'sale' | 'sold' | 'rent';

export const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'sale', label: 'For sale' },
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
