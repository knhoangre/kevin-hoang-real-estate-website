/**
 * The browser's side of the kept sold data.
 *
 * Sold listings are moving out of Supabase — whose free 500 MB is why they were
 * deleted after twelve months — into CockroachDB, which keeps every one. That
 * database has no endpoint a browser can talk to, so the `sold-api` edge
 * function is the endpoint, and this is the one place the app calls it from.
 *
 * `SITE.soldData.backend` decides whether anything here is used. While it reads
 * 'supabase' — the state until the new database has been loaded and checked —
 * no function in this file is called and the site reads sold listings exactly
 * as it always has. See the note on that setting for the order of cutover.
 *
 * NOTHING HERE THROWS PAST ITS CALLER'S CONTRACT. The search functions throw,
 * as the Supabase ones do, so the page shows its error state; the lookups that
 * are supporting context return empty, as theirs do. If the free monthly
 * allowance over there were ever spent, the visible result is no sold results
 * and no estimate — never a broken search of what is on the market, which does
 * not come through here at all.
 */
import { supabase } from '@/integrations/supabase/client';
import { SITE } from '@/lib/siteConfig';
import type { IdxListing, SearchFilters } from '@/lib/idxSearch';

/** True once sold reads have been moved. Every caller checks this first. */
export const soldOnCockroach = (): boolean => SITE.soldData.backend === 'cockroach';

type Op = 'search' | 'count' | 'byMls' | 'similar' | 'comps';

/**
 * One call. A non-2xx arrives from supabase-js as an error VALUE, so it is
 * thrown here — the callers wrap this in `withRetry`, which retries on a throw.
 */
const call = async <T>(op: Op, params: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke('sold-api', { body: { op, ...params } });
  if (error) throw error;
  return data as T;
};

/** The sold tab's filters, as the function reads them. Listing type is implied. */
const filterParams = (f: SearchFilters) => ({
  q: f.q,
  town: f.town,
  propType: f.propType,
  minPrice: f.minPrice,
  maxPrice: f.maxPrice,
  beds: f.beds,
  baths: f.baths,
});

export const soldSearch = async (f: SearchFilters): Promise<IdxListing[]> =>
  (await call<{ rows: IdxListing[] }>('search', { ...filterParams(f), page: f.page })).rows ?? [];

export const soldCount = async (f: SearchFilters): Promise<number> =>
  (await call<{ count: number }>('count', filterParams(f))).count ?? 0;

/** Sold rows for a set of MLS numbers. The function takes at most a hundred at a time. */
export const soldByMls = async (mls: string[]): Promise<IdxListing[]> => {
  const unique = [...new Set(mls)];
  const out: IdxListing[] = [];
  for (let i = 0; i < unique.length; i += 100) {
    const { rows } = await call<{ rows: IdxListing[] }>('byMls', { mls: unique.slice(i, i + 100) });
    out.push(...(rows ?? []));
  }
  return out;
};

export const soldSimilar = async (listing: IdxListing, limit: number): Promise<IdxListing[]> =>
  (
    await call<{ rows: IdxListing[] }>('similar', {
      town: listing.town,
      state: listing.state,
      propType: listing.prop_type,
      price: listing.sale_price ?? listing.list_price,
      bedrooms: listing.bedrooms,
      excludeMls: listing.mls_number,
      limit,
    })
  ).rows ?? [];

/**
 * Comparable sales, with the arguments idx_comparable_sales() takes — passed
 * through under the same names so the two paths cannot drift on what a bound
 * means.
 */
export const soldComps = async <T>(params: Record<string, unknown>): Promise<T[]> =>
  (await call<{ rows: T[] }>('comps', params)).rows ?? [];
