/**
 * Reads one town's market out of Supabase in the shapes market.ts takes.
 *
 * Asks and decides nothing, like idxComps.ts beside valuation.ts. The client is
 * a PARAMETER rather than the app's `supabase` import because two callers need
 * this: scripts/sync-market.ts under plain Node, where the app's client (which
 * reads `import.meta.env`) cannot load, and /admin/market in the browser.
 *
 * Three questions per town, each paged by MLS number:
 *   1. the sold feed  — closed sales, and the homes under agreement (UAG), which
 *                       MLS PIN files with the sales, without a price or a date;
 *   2. the archive    — closings older than the feed's rolling twelve months,
 *                       which is what lets a year-ago month be compared at all;
 *   3. the active feed — for sale, contingent, and rentals on the market.
 *
 * WHEN SUPABASE STOPS HOLDING SOLD ROWS (step 6 of the CockroachDB cutover in
 * CLAUDE.md), questions 1 and 2 have to move to the sold-api first, or every
 * report after that date is built from an empty year.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { addMonths, firstDay, type Lease, type Listing, type Sale, type SaleType } from './market.ts';
import type { RentRow } from './rentComps.ts';
import { AVAILABLE_STATUSES } from './idxDecode.ts';

type Client = SupabaseClient<Database>;

const PAGE = 1000;
const SALE_TYPES = ['SF', 'CC', 'MF'];

/** Every page of a query, ordered by MLS number so pages do not overlap. */
const everyRow = async <T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) => {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
};

/** The anon role times out at 8s, and a cold cache can take that long once. */
const retry = async <T>(run: () => Promise<T>, label: string): Promise<T> => {
  let last: unknown;
  for (const wait of [0, 1500, 4000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      return await run();
    } catch (err) {
      last = err;
      console.warn(`${label}: ${err instanceof Error ? err.message : err}`);
    }
  }
  throw last;
};

const SOLD_COLUMNS =
  'mls_number,prop_type,status,sale_price,list_price,settled_date,living_area,bedrooms,zip,prop_subtype,first_seen_at,price_cut,previous_list_price,price_change_at';
const ACTIVE_COLUMNS =
  'mls_number,prop_type,status,list_price,living_area,bedrooms,zip,prop_subtype,first_seen_at,price_cut,previous_list_price,price_change_at';
const ARCHIVE_COLUMNS = 'mls_number,prop_type,sale_price,list_price,settled_date,living_area,bedrooms,zip';

type Row = {
  mls_number: string;
  prop_type: string | null;
  status?: string | null;
  sale_price?: number | null;
  list_price: number | null;
  settled_date?: string | null;
  living_area: number | null;
  bedrooms: number | null;
  zip: string | null;
  prop_subtype?: string | null;
  first_seen_at?: string | null;
  price_cut?: boolean | null;
  previous_list_price?: number | null;
  price_change_at?: string | null;
};

const num = (x: unknown): number | null => {
  const n = typeof x === 'string' ? Number(x) : (x as number | null);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const toSale = (r: Row): Sale => ({
  type: r.prop_type as SaleType,
  price: num(r.sale_price) ?? 0,
  list: num(r.list_price),
  date: r.settled_date as string,
  sqft: num(r.living_area),
  beds: num(r.bedrooms),
  zip: r.zip,
});

const toListing = (r: Row): Listing => ({
  type: r.prop_type as SaleType,
  status: (r.status ?? '').trim().toUpperCase(),
  list: num(r.list_price),
  sqft: num(r.living_area),
  beds: num(r.bedrooms),
  firstSeen: r.first_seen_at ? r.first_seen_at.slice(0, 10) : null,
  cutAt: r.price_cut && r.price_change_at ? r.price_change_at.slice(0, 10) : null,
  cutFrom: r.price_cut ? num(r.previous_list_price) : null,
});

/** A signed lease: the sold feed's "sale price" on a rental is the rent agreed. */
const toLease = (r: Row): Lease => ({
  rent: num(r.sale_price) ?? 0,
  bedrooms: num(r.bedrooms),
  subtype: r.prop_subtype ?? null,
  zip: r.zip,
  date: r.settled_date as string,
});

/** A rental on the market, at its asking rent. */
const toAsking = (r: Row): RentRow => ({
  rent: num(r.list_price) ?? 0,
  bedrooms: num(r.bedrooms),
  subtype: r.prop_subtype ?? null,
  zip: r.zip,
  date: null,
});

export interface TownRows {
  sales: Sale[];
  listings: Listing[];
  leases: Lease[];
  rentalListings: RentRow[];
}

/**
 * Everything one town's report is built from. `month` is the month the report
 * closes on; sales are read from two years before it, so the same windows a
 * year earlier can be compared once the archive reaches back that far.
 */
export const fetchTownRows = async (client: Client, town: string, month: string, state = 'MA'): Promise<TownRows> => {
  const from = firstDay(addMonths(month, -23));

  const [sold, archive, active] = await Promise.all([
    retry(
      () =>
        everyRow<Row>((a, b) =>
          client
            .from('idx_listings')
            .select(SOLD_COLUMNS)
            .eq('feed', 'sold')
            .eq('state', state)
            .eq('town', town)
            .order('mls_number')
            .range(a, b) as unknown as PromiseLike<{ data: Row[] | null; error: { message: string } | null }>
        ),
      `${town} sold feed`
    ),
    retry(
      () =>
        everyRow<Row>((a, b) =>
          client
            .from('idx_sold_archive')
            .select(ARCHIVE_COLUMNS)
            .eq('state', state)
            .eq('town', town)
            .gte('settled_date', from)
            .order('mls_number')
            .range(a, b) as unknown as PromiseLike<{ data: Row[] | null; error: { message: string } | null }>
        ),
      `${town} archive`
    ),
    retry(
      () =>
        everyRow<Row>((a, b) =>
          client
            .from('idx_listings')
            .select(ACTIVE_COLUMNS)
            .eq('feed', 'active')
            .eq('state', state)
            .eq('town', town)
            .order('mls_number')
            .range(a, b) as unknown as PromiseLike<{ data: Row[] | null; error: { message: string } | null }>
        ),
      `${town} active feed`
    ),
  ]);

  // The live row wins over the archive's copy: MLS PIN corrects closings after
  // they are recorded, and the archive only catches up on the next batch.
  const bySale = new Map<string, Row>();
  for (const r of archive) bySale.set(r.mls_number, r);
  for (const r of sold) if (r.settled_date && SALE_TYPES.includes(r.prop_type ?? '')) bySale.set(r.mls_number, r);

  const sales = [...bySale.values()]
    .filter((r) => SALE_TYPES.includes(r.prop_type ?? '') && r.settled_date && r.settled_date >= from)
    .map(toSale);

  const listings = [
    ...active.filter((r) => SALE_TYPES.includes(r.prop_type ?? '')),
    // Under agreement: in the sold feed, with no closing yet.
    ...sold.filter((r) => SALE_TYPES.includes(r.prop_type ?? '') && !r.settled_date && (r.status ?? '').trim().toUpperCase() === 'UAG'),
  ].map(toListing);

  const leases = sold
    .filter((r) => r.prop_type === 'RN' && r.settled_date && r.settled_date >= from)
    .map(toLease);

  const rentalListings = active
    .filter((r) => r.prop_type === 'RN')
    .filter((r) => AVAILABLE_STATUSES.includes((r.status ?? '').trim().toUpperCase()))
    .map(toAsking);

  return { sales, listings, leases, rentalListings };
};

/** The earliest closing the archive holds: how far back sales reach. */
export const fetchSalesCoverage = async (client: Client): Promise<string | null> => {
  const { data, error } = await client
    .from('idx_sold_archive')
    .select('settled_date')
    .not('settled_date', 'is', null)
    .order('settled_date', { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0]?.settled_date ?? null;
};
