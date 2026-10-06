/**
 * Read access to the kept sold data — the sold tab, sold listing pages and the
 * comparable sales behind the price estimate.
 *
 * Sold listings live in CockroachDB (see cockroach/schema/001_idx_sold.sql for
 * why). The site is a static bundle with no server of its own, and CockroachDB
 * has no equivalent of the PostgREST endpoint the browser talks to on Supabase,
 * so this function is that endpoint: the browser asks it, and it asks the
 * database.
 *
 * A FIXED SET OF QUESTIONS, NOT A QUERY INTERFACE. Callers choose an `op` and
 * supply values; every statement is written here and every value is bound as a
 * parameter. Nothing a caller sends is ever part of the SQL text. This matters
 * more than usual because the endpoint is public — the anon key is in every
 * visitor's browser — and it connects with a login that can only SELECT.
 *
 *   search   one page of the sold tab          count    how many it matches
 *   byMls    one sale, or a short list         similar  a few like one sale
 *   comps    candidates for the price estimate
 *
 * ROWS COME BACK SHAPED LIKE idx_listings ROWS, so the pages that render a
 * sold listing did not change when the data moved. The few columns that table
 * has and this one does not are filled in with what they would have been for a
 * sold row.
 *
 * EVERY CALL SPENDS REQUEST UNITS, and the free allowance is 50 million a
 * month, after which the cluster is disabled until the next. Three things keep
 * a visitor's cost small: every statement is an index lookup on a key the
 * schema was built around, every result is capped, and totals — the one answer
 * no index can shortcut — are remembered for a few minutes. If the allowance
 * were ever spent, this function answers with an error, the pages that call it
 * show no sold results and no estimate, and the search of what is on the market
 * is untouched, because it never comes here.
 *
 * WHAT IS SHOWN IS NOT EVERYTHING THAT IS KEPT. The table holds every sale it
 * has ever been sent and `comps` reads all of it — an estimate is a statistic,
 * and MLS content may be used to develop those. The ops that DISPLAY a listing
 * are limited to DISPLAY_MONTHS, which is the twelve months MLS PIN's own feed
 * shows. Widening it is a question for MLS PIN's rules, not a code decision;
 * when that is answered, it is this one constant.
 */
import { openSoldDb, soldDbConfigured, type SoldSql } from './soldDb.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

/** How far back a sold listing may be DISPLAYED. See the header. */
const DISPLAY_MONTHS = 12;

/** Matches PAGE_SIZE in src/lib/idxSearch.ts — the sold tab pages the same as the rest. */
const PAGE_SIZE = 24;
const MAX_PAGE = 400;

/* -------------------------------------------------------------------------- */
/* Reading what was sent                                                       */
/* -------------------------------------------------------------------------- */

const text = (value: unknown, max = 120): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
};

const number = (value: unknown): number | null => {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const integer = (value: unknown, min: number, max: number): number | null => {
  const n = number(value);
  return n === null ? null : Math.min(max, Math.max(min, Math.round(n)));
};

const mls = (value: unknown): string | null =>
  typeof value === 'string' && /^[0-9]{5,12}$/.test(value) ? value : null;

/** LIKE's own wildcards, typed literally, must match literally. */
const likeEscape = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

/** "west newton" -> "West Newton", which is how the feed spells a town. */
const titleCase = (value: string) =>
  value.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, lead, letter) => lead + letter.toUpperCase());

/* -------------------------------------------------------------------------- */
/* Rows                                                                        */
/* -------------------------------------------------------------------------- */

type Row = Record<string, unknown>;

/**
 * An idx_sold row, as the idx_listings row the pages expect.
 *
 * What this table adds for its own bookkeeping comes off; what idx_listings has
 * and this does not is put on, with the value a sold row there would carry.
 */
const asListing = (row: Row): Row => {
  const { row_hash: _h, address_key: _k, lat: _a, lon: _o, geocode_precision: _p, updated_at, ...rest } = row;
  return {
    ...rest,
    feed: 'sold',
    synced_at: updated_at,
    // Price changes are watched on ACTIVE listings between syncs. A sale has a
    // sale price; it has no "cut".
    price_cut: false,
    previous_list_price: null,
    price_change_at: null,
  };
};

/* -------------------------------------------------------------------------- */
/* The sold tab                                                                */
/* -------------------------------------------------------------------------- */

interface SearchInput {
  q: string | null;
  town: string | null;
  propType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  beds: number | null;
  baths: number | null;
}

const searchInput = (body: Row): SearchInput => ({
  q: text(body.q)?.replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim() || null,
  town: text(body.town, 60),
  propType: text(body.propType, 4),
  minPrice: number(body.minPrice),
  maxPrice: number(body.maxPrice),
  beds: number(body.beds),
  baths: number(body.baths),
});

/**
 * The WHERE clause a page of results and its total have in common.
 *
 * The filters are the sold tab's, as `matching()` applies them on the Supabase
 * side: rentals excluded, prices compared on what a home SOLD for, beds and
 * baths as minimums.
 *
 * Free text is an MLS number when it is all digits, and otherwise an address —
 * or a town, spelled as the feed spells one. On Supabase it is a three-way
 * ILIKE; here that would be a scan of every sale ever kept on every keystroke,
 * so each branch is something an index answers: the primary key, the trigram
 * index on address, and equality on town.
 */
const searchWhere = (sql: SoldSql, f: SearchInput) => sql`
  prop_type != 'RN'
  AND settled_date >= (now() - (${DISPLAY_MONTHS}::INT * INTERVAL '1 month'))::DATE
  ${
    f.q === null
      ? sql``
      : /^[0-9]{6,}$/.test(f.q)
        ? sql`AND mls_number = ${f.q}`
        : sql`AND (address ILIKE ${`%${likeEscape(f.q).split(' ').join('%')}%`} OR town = ${titleCase(f.q)})`
  }
  ${f.town === null ? sql`` : sql`AND town = ${f.town}`}
  ${f.propType === null ? sql`` : sql`AND prop_type = ${f.propType}`}
  ${f.minPrice === null ? sql`` : sql`AND sale_price >= ${f.minPrice}`}
  ${f.maxPrice === null ? sql`` : sql`AND sale_price <= ${f.maxPrice}`}
  ${f.beds === null ? sql`` : sql`AND bedrooms >= ${f.beds}`}
  ${f.baths === null ? sql`` : sql`AND full_baths >= ${f.baths}`}
`;

/*
 * Totals, remembered briefly.
 *
 * "of 74,812" is a count of every match and no index order shortcuts it; for
 * the unfiltered sold tab that is every sale in the display window. It is the
 * most expensive thing this function does and the least time-sensitive — the
 * sold feed changes once a night. Ten minutes per distinct filter, per warm
 * instance, is enough to make paging through results cost one count instead of
 * one per page.
 */
const COUNT_TTL_MS = 10 * 60 * 1000;
const counts = new Map<string, { at: number; value: number }>();

/* -------------------------------------------------------------------------- */
/* Handler                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The whole endpoint, as a function from a request to a response.
 *
 * Exported from here rather than written inline in sold-api/index.ts so that
 * cockroach/tests can call it directly against a real cluster — importing a
 * file that calls serve() starts a server, which a test cannot ask questions of
 * without also starting a process.
 */
export const handleSoldRequest = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  let body: Row;
  try {
    body = (await req.json()) as Row;
  } catch {
    return json({ error: 'Expected a JSON body' }, 400);
  }

  const op = body?.op;
  if (op !== 'search' && op !== 'count' && op !== 'byMls' && op !== 'similar' && op !== 'comps') {
    return json({ error: 'Unknown op' }, 400);
  }

  if (!soldDbConfigured('ro')) {
    // Before the cluster exists, and if its secret is ever removed. The pages
    // that call this treat an error as "no sold data" and stay standing.
    return json({ error: 'The sold database is not configured' }, 503);
  }

  let sql: SoldSql | null = null;
  try {
    sql = openSoldDb('ro');

    if (op === 'search') {
      const filters = searchInput(body);
      const page = integer(body.page, 1, MAX_PAGE) ?? 1;
      const rows = await sql<Row[]>`
        SELECT * FROM idx_sold
        WHERE ${searchWhere(sql, filters)}
        ORDER BY settled_date DESC, mls_number
        LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
      `;
      return json({ rows: rows.map(asListing) });
    }

    if (op === 'count') {
      const filters = searchInput(body);
      const key = JSON.stringify(filters);
      const cached = counts.get(key);
      if (cached && Date.now() - cached.at < COUNT_TTL_MS) return json({ count: cached.value });

      const [row] = await sql<{ n: number }[]>`
        SELECT count(*)::INT8 AS n FROM idx_sold WHERE ${searchWhere(sql, filters)}
      `;
      const value = Number(row?.n ?? 0);
      // Bounded, so a stream of distinct filters cannot grow this without limit.
      if (counts.size > 500) counts.clear();
      counts.set(key, { at: Date.now(), value });
      return json({ count: value });
    }

    if (op === 'byMls') {
      const list = Array.isArray(body.mls) ? body.mls : [body.mls];
      const wanted = [...new Set(list.map(mls).filter((m): m is string => m !== null))].slice(0, 100);
      if (wanted.length === 0) return json({ rows: [] });
      const rows = await sql<Row[]>`
        SELECT * FROM idx_sold
        WHERE mls_number IN ${sql(wanted)}
          AND settled_date >= (now() - (${DISPLAY_MONTHS}::INT * INTERVAL '1 month'))::DATE
      `;
      return json({ rows: rows.map(asListing) });
    }

    if (op === 'similar') {
      /*
       * A few sales like this one: same town and state, same kind of home,
       * within a quarter of its price and a bedroom of its size, nearest in
       * price first. `similarListings()` asks Supabase for this as two queries,
       * one each side of the price, because PostgREST cannot order by a
       * distance; SQL can, so here it is one.
       */
      const town = text(body.town, 60);
      const propType = text(body.propType, 4);
      const price = number(body.price);
      if (!town || !propType || price === null || price <= 0) return json({ rows: [] });
      const state = text(body.state, 4) ?? 'MA';
      const bedrooms = number(body.bedrooms);
      const exclude = mls(body.excludeMls);
      const limit = integer(body.limit, 1, 12) ?? 3;

      const rows = await sql<Row[]>`
        SELECT * FROM idx_sold
        WHERE prop_type = ${propType}
          AND state = ${state}
          AND town = ${town}
          AND settled_date >= (now() - (${DISPLAY_MONTHS}::INT * INTERVAL '1 month'))::DATE
          AND sale_price BETWEEN ${price * 0.75} AND ${price * 1.25}
          ${exclude === null ? sql`` : sql`AND mls_number != ${exclude}`}
          ${bedrooms === null ? sql`` : sql`AND bedrooms BETWEEN ${bedrooms - 1} AND ${bedrooms + 1}`}
        ORDER BY abs(sale_price - ${price}), mls_number
        LIMIT ${limit}
      `;
      return json({ rows: rows.map(asListing) });
    }

    /*
     * comps — the candidates for one subject's estimate.
     *
     * The same arguments, bounds and columns as idx_comparable_sales() on the
     * Supabase side, so valuation.ts is given exactly what it was before.
     * Every predicate on the leading columns is an equality on idx_sold_comps
     * (prop_type, state, town, settled_date DESC): that is the whole lesson of
     * the function it replaces, which took seven seconds when one of them was
     * optional.
     *
     * The sanity bands that the materialized view applied when it was built —
     * a real sale date, a believable floor area, a price above zero — are
     * applied here instead, since there is no view.
     *
     * AN UNKNOWN DISTANCE IS NOT A NEAR ONE. A sale with no coordinate is
     * returned when no radius is asked for, with a null distance, and excluded
     * when one is.
     */
    const propType = text(body.p_prop_type, 4);
    const town = text(body.p_town, 60);
    // A missing town returns nothing rather than every sale of a type in a state.
    if (!propType || !town) return json({ rows: [] });
    const state = text(body.p_state, 4) ?? 'MA';
    const lat = number(body.p_lat);
    const lon = number(body.p_lon);
    const located = lat !== null && lon !== null;
    const radius = located ? number(body.p_radius_km) : null;
    const months = integer(body.p_months, 1, 240) ?? 18;
    const minSqft = number(body.p_min_sqft);
    const maxSqft = number(body.p_max_sqft);
    const exclude = mls(body.p_exclude_mls);
    const limit = integer(body.p_limit, 1, 500) ?? 250;

    // Great-circle distance, the same formula and Earth radius as idx_distance_km().
    // The radius is cast because CockroachDB reads a bare 6371.0088 as a DECIMAL
    // and, unlike Postgres, will not multiply one by the FLOAT that asin() returns.
    const distance = located
      ? sql`6371.0088::FLOAT8 * 2 * asin(sqrt(
          power(sin(radians(lat - ${lat}::FLOAT8) / 2), 2) +
          cos(radians(${lat}::FLOAT8)) * cos(radians(lat)) *
          power(sin(radians(lon - ${lon}::FLOAT8) / 2), 2)
        ))`
      : sql`NULL::FLOAT8`;

    const rows = await sql<Row[]>`
      SELECT
        mls_number, address, street_name, town, zip, prop_type, prop_subtype, style,
        sale_price, list_price, settled_date, bedrooms, full_baths, half_baths,
        living_area, lot_size, acres, year_built, garage_spaces, basement, photo_count,
        lat, lon, geocode_precision,
        CASE WHEN lat IS NULL OR lon IS NULL THEN NULL ELSE ${distance} END AS distance_km
      FROM idx_sold
      WHERE prop_type = ${propType}
        AND state = ${state}
        AND town = ${town}
        AND settled_date >= (now() - (${months}::INT * INTERVAL '1 month'))::DATE
        AND living_area BETWEEN 300 AND 15000
        AND sale_price > 0
        ${exclude === null ? sql`` : sql`AND mls_number != ${exclude}`}
        ${minSqft === null ? sql`` : sql`AND living_area >= ${minSqft}`}
        ${maxSqft === null ? sql`` : sql`AND living_area <= ${maxSqft}`}
        ${
          radius === null
            ? sql``
            : sql`AND lat IS NOT NULL AND lon IS NOT NULL AND ${distance} <= ${radius}::FLOAT8`
        }
      ORDER BY settled_date DESC, mls_number
      LIMIT ${limit}
    `;
    return json({ rows });
  } catch (err) {
    // The message can name hosts and logins; it goes to the log and not the caller.
    console.error(`sold-api ${String(op)} failed:`, err instanceof Error ? err.message : err);
    return json({ error: 'Sold data is unavailable right now' }, 503);
  } finally {
    await sql?.end({ timeout: 5 }).catch(() => {});
  }
};
