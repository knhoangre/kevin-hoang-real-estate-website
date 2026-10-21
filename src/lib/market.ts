/**
 * A town's housing market, measured: what sold, what is for sale, what rents.
 *
 * PURE — no network, no DOM — like valuation.ts and recommendations.ts, so
 * `node scripts/market-check.ts` can run it against a market whose answers are
 * known. marketFetch.ts does the asking and holds no judgement; marketText.ts
 * turns these numbers into sentences.
 *
 * ONE REPORT IS ONE TOWN AT THE END OF ONE MONTH. `buildReport()` is run on the
 * 3rd of each month for the month just ended (scripts/sync-market.ts, from a
 * GitHub Action) and the result is committed as
 * src/data/market/<slug>/<yyyy-mm>.json. That file is both the monthly post for
 * that month and, while it is the newest, the town's market page. It is never
 * rewritten afterwards: MLS PIN's sold feed is a rolling twelve months, so a
 * report is the only copy of a month's numbers that outlives the feed, and the
 * year-on-year comparison a report makes is read out of the one published a
 * year before it (`yearAgo`).
 *
 * WHAT THE FEED CAN AND CANNOT SAY. These are decisions, each made against the
 * live data on 2026-10-20:
 *
 * - **Windows are whole calendar months.** "The last three months" is July to
 *   September, not the 91 days to today: closings are recorded a few days after
 *   they happen, so a window ending today undercounts its own last week and
 *   reads as a slowdown that is not there.
 * - **Sale-to-asking is against the FINAL asking price**, the only one the IDX
 *   feed carries. A home cut from $1.2M to $1.1M that sold at $1.1M reads as
 *   100%. The pages say so; it is the most misread number in real estate.
 * - **There is no days-on-market.** The IDX export carries no list date. What
 *   exists is when OUR sync first saw a listing (`first_seen_at`), which is
 *   exact for anything listed after tracking began on 2026-09-02 and a lower
 *   bound for the rest. So "listed in the last 30 days" is a fact; "how long it
 *   takes to sell" is not, and nothing here claims it.
 * - **Under agreement is in the SOLD feed.** MLS PIN files a UAG listing with
 *   the sales, with no sale price and no closing date. Contingent (CTG) stays in
 *   the active feed. Both count as pending; neither as for sale.
 * - **Months of supply uses the twelve-month pace**, not the last month's: a
 *   town with six sales in a month swings from 2 to 6 months on one closing.
 *   Inventory itself is seasonal, and the page says that too.
 * - **A median needs five sales or it is not shown** (`MIN_SALES`), the same
 *   floor the comps and the rents use. The count is shown either way.
 */
import { cleanRents, type RentRow } from './rentComps.ts';
import { AVAILABLE_STATUSES } from './idxDecode.ts';

export type SaleType = 'SF' | 'CC' | 'MF';
export const SALE_TYPES: SaleType[] = ['SF', 'CC', 'MF'];

export const TYPE_NAMES: Record<SaleType, { one: string; many: string; short: string }> = {
  SF: { one: 'single-family home', many: 'single-family homes', short: 'Single-family' },
  CC: { one: 'condo', many: 'condos', short: 'Condos' },
  MF: { one: 'multi-family', many: 'multi-families', short: 'Multi-family' },
};

/** Fewer sales than this and a median is a list of prices, not a market. */
export const MIN_SALES = 5;

/** A list or sale price under this is a placeholder ($1 auctions, "price on request"). */
export const PRICE_FLOOR = 10_000;

/** Floor area below this is a data-entry slip, and its $/sq ft is fiction. */
const SQFT_FLOOR = 250;

/** Outside this a sale-to-asking ratio is a typo in one of the two prices. */
const RATIO_BAND = { min: 0.5, max: 2 } as const;

/** Statuses that mean a buyer has been found and the sale has not closed. */
export const PENDING_STATUSES = ['UAG', 'CTG'];

/**
 * The first idx-sync run. Every listing already on the market then was stamped
 * with this date, so `first_seen_at` means "listed on" only after it — measured
 * on 2026-10-20: 1,438 of Newton's sold rows and 156 of its active ones carry it.
 */
export const TRACKING_SINCE = '2026-09-02';

/** Days a listing must have been visible to count as "fresh". */
export const FRESH_DAYS = 30;

/* -------------------------------------------------------------------------- */
/* Inputs                                                                      */
/* -------------------------------------------------------------------------- */

/** One closed sale. */
export interface Sale {
  type: SaleType;
  price: number;
  /** The final asking price. */
  list: number | null;
  /** Closing date, YYYY-MM-DD. */
  date: string;
  sqft: number | null;
  beds: number | null;
  zip: string | null;
}

/** One home for sale or under agreement right now. */
export interface Listing {
  type: SaleType;
  status: string;
  list: number | null;
  sqft: number | null;
  beds: number | null;
  /** When the sync first saw it, YYYY-MM-DD. */
  firstSeen: string | null;
  /** The latest price change, if it was a cut: when, and from what. */
  cutAt: string | null;
  cutFrom: number | null;
}

/** A signed lease. `date` is when it was recorded. */
export type Lease = RentRow & { date: string };

export interface MarketInput {
  town: string;
  slug: string;
  state: string;
  /** The month the report closes on, YYYY-MM. */
  month: string;
  /** When inventory was read, YYYY-MM-DD. */
  asOf: string;
  /** When `first_seen_at` began meaning "listed", YYYY-MM-DD. */
  trackingSince: string;
  /** The earliest date each kind of record reaches back to. */
  coverage: { sales: string; leases: string };
  sales: Sale[];
  /** Every home for sale or pending in the town, any status. */
  listings: Listing[];
  leases: Lease[];
  /** Rentals on the market now, as asking rents. */
  rentalListings: RentRow[];
  /** The report published for the same month a year earlier, if any. */
  previousYear?: MarketReport | null;
}

/* -------------------------------------------------------------------------- */
/* Outputs                                                                     */
/* -------------------------------------------------------------------------- */

export interface Stats {
  sales: number;
  /** Sales per calendar month of the window. */
  perMonth: number;
  median: number | null;
  /** The middle half: 25th and 75th percentile sale prices. */
  low: number | null;
  high: number | null;
  /** Median price per square foot of living area. */
  ppsf: number | null;
  /** Median sale price ÷ final asking price. */
  ratio: number | null;
  /** Shares of sales above, at and below the final asking price. */
  over: number | null;
  at: number | null;
  under: number | null;
  /** Median dollars over asking, among the sales that went over. */
  premium: number | null;
  /** Median living area. */
  sqft: number | null;
}

export interface Window {
  months: number;
  /** First and last day covered, YYYY-MM-DD. `from` is never before the data. */
  from: string;
  to: string;
  byType: Record<SaleType, Stats>;
  all: Stats;
}

export interface MonthPoint {
  month: string;
  byType: Record<SaleType, Stats>;
  all: Stats;
}

export interface Supply {
  /** For sale now. */
  available: number;
  /** Under agreement or contingent now. */
  pending: number;
  /** pending ÷ (available + pending): the share of the market already spoken for. */
  pendingShare: number | null;
  /** available ÷ average monthly sales over twelve months. */
  monthsSupply: number | null;
  askMedian: number | null;
  askPpsf: number | null;
  /** For-sale listings whose price was cut in the last 30 days. */
  cuts: number;
  /** Median size of those cuts, as a fraction of the price before. */
  cutSize: number | null;
  /** For sale and first seen in the last FRESH_DAYS. Null before tracking covers it. */
  fresh: number | null;
}

export interface Band {
  label: string;
  min: number;
  max: number | null;
  /** Twelve months of closings in the band. */
  sales: number;
  ratio: number | null;
  over: number | null;
  available: number;
  pending: number;
  monthsSupply: number | null;
}

export interface Breakdown {
  label: string;
  sales: number;
  median: number | null;
  ppsf: number | null;
  ratio: number | null;
  sqft: number | null;
}

export interface RentCell {
  label: string;
  n: number;
  median: number | null;
  low: number | null;
  high: number | null;
}

export interface RentWindow {
  months: number;
  from: string;
  to: string;
  rows: RentCell[];
  n: number;
}

/**
 * The same figures a year earlier: what makes a change a TREND rather than a
 * season. Spring sells bigger houses at higher prices every year, so a summer
 * three months against a twelve-month figure mostly measures the calendar; the
 * same three months a year apart does not.
 *
 * Each piece is null until the data reaches back far enough. Sales are archived
 * from 2025-09-17, so the same-month comparison starts with October 2026 and a
 * full year against the year before with September 2027. Inventory has no
 * archive, so its year-ago figures come only from the report published then.
 */
export interface YearAgo {
  month: MonthPoint | null;
  /** Aligned with `windows`: twelve, six and three months, a year earlier. */
  windows: (Window | null)[];
  inventory: { byType: Record<SaleType, Supply>; all: Supply } | null;
}

export interface MarketReport {
  version: 1;
  town: string;
  slug: string;
  state: string;
  month: string;
  asOf: string;
  trackingSince: string;
  coverage: { sales: string; leases: string };
  /** Twelve, six and three months, each ending with `month`. */
  windows: Window[];
  /** Twelve calendar months, oldest first, ending with `month`. */
  series: MonthPoint[];
  yearAgo: YearAgo;
  inventory: { byType: Record<SaleType, Supply>; all: Supply };
  bands: Band[];
  beds: { SF: Breakdown[]; CC: Breakdown[] };
  zips: { SF: Breakdown[]; CC: Breakdown[] };
  rentals: { windows: RentWindow[]; month: RentWindow; asking: RentWindow };
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

const DAY_MS = 86_400_000;

/** '2026-09' + n months. */
export const addMonths = (month: string, n: number): string => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const firstDay = (month: string) => `${month}-01`;

export const lastDay = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

/** The month before the one `iso` falls in: the last COMPLETE month on that date. */
export const lastCompleteMonth = (iso: string): string => addMonths(iso.slice(0, 7), -1);

const daysBetween = (a: string, b: string) =>
  (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS;

const addDays = (iso: string, n: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/* -------------------------------------------------------------------------- */
/* Small statistics                                                            */
/* -------------------------------------------------------------------------- */

export const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
};

/** Nearest-rank percentile: every answer is a real sale, never a blend of two. */
export const percentile = (xs: number[], p: number): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))];
};

const enough = <T>(xs: T[]) => xs.length >= MIN_SALES;

/** Sale ÷ asking, or null when either price cannot be compared. */
export const saleRatio = (s: Pick<Sale, 'price' | 'list'>): number | null => {
  if (!s.list || s.list < PRICE_FLOOR) return null;
  const r = s.price / s.list;
  return r >= RATIO_BAND.min && r <= RATIO_BAND.max ? r : null;
};

const ppsfOf = (price: number | null, sqft: number | null): number | null =>
  price && sqft && sqft >= SQFT_FLOOR ? price / sqft : null;

const isNum = (x: number | null): x is number => x !== null && Number.isFinite(x);

/* -------------------------------------------------------------------------- */
/* Cleaning                                                                    */
/* -------------------------------------------------------------------------- */

/** A ZIP as five digits. MA ZIPs start with 0, which a numeric import eats. */
export const cleanZip = (zip: string | null): string | null => {
  const d = (zip ?? '').replace(/[^0-9]/g, '').slice(0, 5);
  if (d.length === 5) return d;
  if (d.length === 4) return `0${d}`;
  return null;
};

/** Sales that can be counted at all. */
export const cleanSales = (sales: Sale[]): Sale[] =>
  sales.filter(
    (s) =>
      SALE_TYPES.includes(s.type) &&
      Number.isFinite(s.price) &&
      s.price >= PRICE_FLOOR &&
      /^\d{4}-\d{2}-\d{2}$/.test(s.date)
  );

/* -------------------------------------------------------------------------- */
/* Stats over a set of sales                                                   */
/* -------------------------------------------------------------------------- */

export const stats = (sales: Sale[], months: number): Stats => {
  const prices = sales.map((s) => s.price);
  const ratios = sales.map(saleRatio).filter(isNum);
  const ppsf = sales.map((s) => ppsfOf(s.price, s.sqft)).filter(isNum);
  const sqft = sales.map((s) => s.sqft).filter((x): x is number => isNum(x) && x >= SQFT_FLOOR);
  // Above / at / below compares the two prices directly, not the rounded ratio:
  // $1,000,000 against $999,999 is over asking, and the reader of "sold over
  // asking" means exactly that.
  const compared = sales.filter((s) => saleRatio(s) !== null);
  const over = compared.filter((s) => s.price > (s.list as number));
  const at = compared.filter((s) => s.price === s.list);

  return {
    sales: sales.length,
    perMonth: months > 0 ? sales.length / months : 0,
    median: enough(prices) ? median(prices) : null,
    low: enough(prices) ? percentile(prices, 25) : null,
    high: enough(prices) ? percentile(prices, 75) : null,
    ppsf: enough(ppsf) ? median(ppsf) : null,
    ratio: enough(ratios) ? median(ratios) : null,
    over: enough(compared) ? over.length / compared.length : null,
    at: enough(compared) ? at.length / compared.length : null,
    under: enough(compared) ? (compared.length - over.length - at.length) / compared.length : null,
    // Five sales over asking, not five sales: a premium is a median of the
    // premiums, and two of them is two anecdotes.
    premium: enough(over) ? median(over.map((s) => s.price - (s.list as number))) : null,
    sqft: enough(sqft) ? median(sqft) : null,
  };
};

const byType = (sales: Sale[], months: number): Record<SaleType, Stats> => ({
  SF: stats(sales.filter((s) => s.type === 'SF'), months),
  CC: stats(sales.filter((s) => s.type === 'CC'), months),
  MF: stats(sales.filter((s) => s.type === 'MF'), months),
});

const inRange = (date: string, from: string, to: string) => date >= from && date <= to;

/** The `n` whole months ending with `month`, clipped to where the data starts. */
export const windowBounds = (month: string, n: number, coverage: string) => {
  const from = firstDay(addMonths(month, -(n - 1)));
  return { from: from < coverage ? coverage : from, to: lastDay(month) };
};

export const salesWindow = (sales: Sale[], month: string, n: number, coverage: string): Window => {
  const { from, to } = windowBounds(month, n, coverage);
  const inside = sales.filter((s) => inRange(s.date, from, to));
  // The pace divides by the months the data actually covers, so a window
  // clipped at the start of the feed does not read as a slow year.
  const months = Math.max(1, Math.round(daysBetween(from, to) / 30.4375));
  return { months: n, from, to, byType: byType(inside, months), all: stats(inside, months) };
};

const monthPoint = (sales: Sale[], month: string): MonthPoint => {
  const inside = sales.filter((s) => s.date.startsWith(month));
  return { month, byType: byType(inside, 1), all: stats(inside, 1) };
};

/* -------------------------------------------------------------------------- */
/* What is on the market                                                       */
/* -------------------------------------------------------------------------- */

const isAvailableStatus = (status: string) => AVAILABLE_STATUSES.includes(status.trim().toUpperCase());
const isPendingStatus = (status: string) => PENDING_STATUSES.includes(status.trim().toUpperCase());

/**
 * What is for sale and pending, against the pace of the past twelve months.
 *
 * `twelveMonthSales` is the count the pace is taken from; a type with none has
 * no months of supply rather than infinite ones.
 */
export const supply = (
  listings: Listing[],
  twelveMonthSales: number,
  asOf: string,
  trackingSince: string
): Supply => {
  const available = listings.filter((l) => isAvailableStatus(l.status));
  const pending = listings.filter((l) => isPendingStatus(l.status));
  const asks = available.map((l) => l.list).filter((x): x is number => isNum(x) && x >= PRICE_FLOOR);
  const askPpsf = available.map((l) => ppsfOf(l.list, l.sqft)).filter(isNum);

  const since = addDays(asOf, -FRESH_DAYS);
  const cuts = available.filter((l) => l.cutAt && l.cutAt >= since && l.cutFrom && l.list && l.list < l.cutFrom);
  const cutSizes = cuts.map((l) => ((l.cutFrom as number) - (l.list as number)) / (l.cutFrom as number));

  // Everything present at the first sync was stamped with that date, so "first
  // seen in the last 30 days" only means "listed in the last 30 days" once the
  // 30 days start after it.
  const freshKnown = since > addDays(trackingSince, 1);

  const pace = twelveMonthSales / 12;
  const total = available.length + pending.length;
  return {
    available: available.length,
    pending: pending.length,
    pendingShare: total >= MIN_SALES ? pending.length / total : null,
    monthsSupply: pace > 0 && twelveMonthSales >= MIN_SALES ? available.length / pace : null,
    askMedian: enough(asks) ? median(asks) : null,
    askPpsf: enough(askPpsf) ? median(askPpsf) : null,
    cuts: cuts.length,
    cutSize: cutSizes.length >= 3 ? median(cutSizes) : null,
    fresh: freshKnown ? available.filter((l) => l.firstSeen && l.firstSeen >= since).length : null,
  };
};

/* -------------------------------------------------------------------------- */
/* Price bands                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Fixed, so a band means the same thing in every town and every month. Bands
 * a town never touches are dropped when the report is built.
 */
export const BANDS: { label: string; min: number; max: number | null }[] = [
  { label: 'Under $500k', min: 0, max: 500_000 },
  { label: '$500k–$750k', min: 500_000, max: 750_000 },
  { label: '$750k–$1M', min: 750_000, max: 1_000_000 },
  { label: '$1M–$1.5M', min: 1_000_000, max: 1_500_000 },
  { label: '$1.5M–$2M', min: 1_500_000, max: 2_000_000 },
  { label: '$2M–$3M', min: 2_000_000, max: 3_000_000 },
  { label: '$3M and up', min: 3_000_000, max: null },
];

const inBand = (price: number | null, b: { min: number; max: number | null }) =>
  isNum(price) && price >= b.min && (b.max === null || price < b.max);

/**
 * Every sale type together, by price: a buyer shops by budget before type.
 *
 * Sales are banded by what they SOLD for and listings by what they ASK, which is
 * the comparison a buyer with that budget is actually making.
 */
export const bands = (sales12: Sale[], listings: Listing[]): Band[] =>
  BANDS.map((b) => {
    const sold = sales12.filter((s) => inBand(s.price, b));
    const s = stats(sold, 12);
    const available = listings.filter((l) => isAvailableStatus(l.status) && inBand(l.list, b)).length;
    const pending = listings.filter((l) => isPendingStatus(l.status) && inBand(l.list, b)).length;
    return {
      ...b,
      sales: sold.length,
      ratio: s.ratio,
      over: s.over,
      available,
      pending,
      monthsSupply: sold.length >= MIN_SALES ? available / (sold.length / 12) : null,
    };
  }).filter((b) => b.sales > 0 || b.available > 0);

/* -------------------------------------------------------------------------- */
/* Breakdowns                                                                  */
/* -------------------------------------------------------------------------- */

const breakdown = (label: string, sales: Sale[]): Breakdown => {
  const s = stats(sales, 12);
  return { label, sales: sales.length, median: s.median, ppsf: s.ppsf, ratio: s.ratio, sqft: s.sqft };
};

const BED_GROUPS: Record<'SF' | 'CC', { label: string; test: (b: number) => boolean }[]> = {
  SF: [
    { label: '2 bedrooms or fewer', test: (b) => b <= 2 },
    { label: '3 bedrooms', test: (b) => b === 3 },
    { label: '4 bedrooms', test: (b) => b === 4 },
    { label: '5 bedrooms', test: (b) => b === 5 },
    { label: '6 or more', test: (b) => b >= 6 },
  ],
  CC: [
    { label: 'Studio or 1 bedroom', test: (b) => b <= 1 },
    { label: '2 bedrooms', test: (b) => b === 2 },
    { label: '3 bedrooms or more', test: (b) => b >= 3 },
  ],
};

export const byBeds = (sales12: Sale[], type: 'SF' | 'CC'): Breakdown[] =>
  BED_GROUPS[type]
    .map((g) => breakdown(g.label, sales12.filter((s) => s.type === type && isNum(s.beds) && g.test(s.beds))))
    .filter((r) => r.sales > 0);

/**
 * By ZIP, for towns with more than one. Only ZIPs with MIN_SALES sales are
 * listed: the feed has a Cape Cod ZIP on a Newton sale, and a row for it would
 * be a typo given a line of its own.
 */
export const byZip = (sales12: Sale[], type: 'SF' | 'CC'): Breakdown[] => {
  const groups = new Map<string, Sale[]>();
  for (const s of sales12) {
    const z = cleanZip(s.zip);
    if (s.type !== type || !z) continue;
    groups.set(z, [...(groups.get(z) ?? []), s]);
  }
  const rows = [...groups.entries()]
    .filter(([, list]) => list.length >= MIN_SALES)
    .map(([zip, list]) => breakdown(zip, list))
    .sort((a, b) => a.label.localeCompare(b.label));
  return rows.length >= 2 ? rows : [];
};

/* -------------------------------------------------------------------------- */
/* Rents                                                                       */
/* -------------------------------------------------------------------------- */

const RENT_GROUPS: { label: string; test: (b: number) => boolean }[] = [
  { label: 'Studio', test: (b) => b === 0 },
  { label: '1 bedroom', test: (b) => b === 1 },
  { label: '2 bedrooms', test: (b) => b === 2 },
  { label: '3 bedrooms', test: (b) => b === 3 },
  { label: '4 or more', test: (b) => b >= 4 },
];

const rentCells = (rows: RentRow[]): RentCell[] =>
  RENT_GROUPS.map((g) => {
    const rents = rows.filter((r) => isNum(r.bedrooms) && g.test(r.bedrooms)).map((r) => r.rent);
    return {
      label: g.label,
      n: rents.length,
      median: enough(rents) ? median(rents) : null,
      low: enough(rents) ? percentile(rents, 25) : null,
      high: enough(rents) ? percentile(rents, 75) : null,
    };
  }).filter((c) => c.n > 0);

const rentWindow = (leases: Lease[], month: string, n: number, coverage: string): RentWindow => {
  const { from, to } = windowBounds(month, n, coverage);
  const inside = leases.filter((l) => inRange(l.date, from, to));
  return { months: n, from, to, rows: rentCells(inside), n: inside.length };
};

/* -------------------------------------------------------------------------- */
/* The report                                                                  */
/* -------------------------------------------------------------------------- */

export const buildReport = (input: MarketInput): MarketReport => {
  const { month, asOf, coverage, trackingSince } = input;
  const sales = cleanSales(input.sales);
  const listings = input.listings.filter((l) => SALE_TYPES.includes(l.type));
  const leases = cleanRents(input.leases) as Lease[];
  const asking = cleanRents(input.rentalListings);

  const windows = [12, 6, 3].map((n) => salesWindow(sales, month, n, coverage.sales));
  const twelve = windows[0];
  const { from: from12, to: to12 } = twelve;
  const sales12 = sales.filter((s) => inRange(s.date, from12, to12));

  const series = Array.from({ length: 12 }, (_, i) => monthPoint(sales, addMonths(month, i - 11)));

  // A year earlier: from the report published then where there is one, and
  // otherwise from the data itself when it reaches back far enough — which, for
  // sales, it does from the archive's first year on.
  const prior = input.previousYear ?? null;
  const yearAgoMonth = addMonths(month, -12);
  const covered = (n: number) => firstDay(addMonths(yearAgoMonth, -(n - 1))) >= coverage.sales;
  const yearAgo: YearAgo = {
    month:
      prior?.series.find((p) => p.month === yearAgoMonth) ??
      (covered(1) ? monthPoint(sales, yearAgoMonth) : null),
    windows: [12, 6, 3].map(
      (n) =>
        prior?.windows.find((w) => w.months === n) ??
        (covered(n) ? salesWindow(sales, yearAgoMonth, n, coverage.sales) : null)
    ),
    inventory: prior?.inventory ?? null,
  };

  const supplyOf = (type: SaleType | null) =>
    supply(
      type ? listings.filter((l) => l.type === type) : listings,
      type ? twelve.byType[type].sales : twelve.all.sales,
      asOf,
      trackingSince
    );

  const askingWindow: RentWindow = { months: 0, from: asOf, to: asOf, rows: rentCells(asking), n: asking.length };

  return {
    version: 1,
    town: input.town,
    slug: input.slug,
    state: input.state,
    month,
    asOf,
    trackingSince,
    coverage,
    windows,
    series,
    yearAgo,
    inventory: {
      byType: { SF: supplyOf('SF'), CC: supplyOf('CC'), MF: supplyOf('MF') },
      all: supplyOf(null),
    },
    bands: bands(sales12, listings),
    beds: { SF: byBeds(sales12, 'SF'), CC: byBeds(sales12, 'CC') },
    zips: { SF: byZip(sales12, 'SF'), CC: byZip(sales12, 'CC') },
    rentals: {
      windows: [12, 6, 3].map((n) => rentWindow(leases, month, n, coverage.leases)),
      month: rentWindow(leases, month, 1, coverage.leases),
      asking: askingWindow,
    },
  };
};

/* -------------------------------------------------------------------------- */
/* Reading a report                                                            */
/* -------------------------------------------------------------------------- */

export type Edge = 'sellers' | 'buyers' | 'balanced';

/**
 * Who has had the edge, from what actually happened rather than from a rule of
 * thumb about inventory.
 *
 * Half or more selling over asking, or a median above 101% of it, is a market
 * where an offer at the asking price usually lost. A median at or under 98% with
 * fewer than a quarter going over is one where buyers negotiated. The page
 * prints these thresholds beside the verdict — a label nobody can check is the
 * thing this module exists not to be.
 */
export const EDGE_RULE = { sellersOver: 0.5, sellersRatio: 1.01, buyersRatio: 0.98, buyersOver: 0.25 } as const;

export const edge = (s: Stats): Edge | null => {
  if (s.ratio === null || s.over === null) return null;
  if (s.over >= EDGE_RULE.sellersOver || s.ratio >= EDGE_RULE.sellersRatio) return 'sellers';
  if (s.ratio <= EDGE_RULE.buyersRatio && s.over < EDGE_RULE.buyersOver) return 'buyers';
  return 'balanced';
};

/**
 * The most recent window with enough sales to judge from: three months if they
 * hold MIN_SALES * 2, then six, then twelve. A three-month verdict on four
 * sales would be a verdict on four households.
 */
export const freshestWindow = (report: MarketReport, type: SaleType | null): Window | null => {
  const ordered = [...report.windows].sort((a, b) => a.months - b.months);
  for (const w of ordered) {
    const s = type ? w.byType[type] : w.all;
    if (s.sales >= MIN_SALES * 2 && s.ratio !== null) return w;
  }
  return null;
};

/** The types with enough twelve-month sales to be worth a section. */
export const activeTypes = (report: MarketReport): SaleType[] =>
  SALE_TYPES.filter((t) => report.windows[0].byType[t].sales >= MIN_SALES);

/** Whether a month is worth a post: enough closings to say something. */
export const MIN_MONTH_SALES = 8;

export const monthWorthAPost = (report: MarketReport): boolean =>
  (report.series[report.series.length - 1]?.all.sales ?? 0) >= MIN_MONTH_SALES;

/* -------------------------------------------------------------------------- */
/* The index of reports                                                        */
/* -------------------------------------------------------------------------- */

/**
 * src/data/market/index.json, written by scripts/sync-market.ts. Small on
 * purpose: AppRoutes imports it to know which pages exist, so it is in the
 * bundle every page loads. The numbers are in summary.json, which only the
 * pages that show them import.
 */
export interface MarketIndexTown {
  town: string;
  slug: string;
  /** The newest report, which is also what /market/<slug> shows. */
  latest: string;
  /** Months with a post, oldest first, and the day each was published. */
  posts: { month: string; published: string }[];
}

export interface MarketIndex {
  towns: MarketIndexTown[];
}

/** One town's line on /market and the blog, from its newest report. */
export interface Headline {
  town: string;
  slug: string;
  month: string;
  asOf: string;
  sales12: number;
  types: {
    type: SaleType;
    median: number | null;
    ppsf: number | null;
    ratio: number | null;
    over: number | null;
    /** How many months the ratio and share were read over (3, 6 or 12). */
    window: number | null;
    edge: Edge | null;
    available: number;
    monthsSupply: number | null;
  }[];
}

export const headline = (r: MarketReport): Headline => ({
  town: r.town,
  slug: r.slug,
  month: r.month,
  asOf: r.asOf,
  sales12: r.windows[0].all.sales,
  types: activeTypes(r).map((type) => {
    const w = freshestWindow(r, type);
    const s = w?.byType[type] ?? null;
    return {
      type,
      median: r.windows[0].byType[type].median,
      ppsf: r.windows[0].byType[type].ppsf,
      ratio: s?.ratio ?? null,
      over: s?.over ?? null,
      window: w?.months ?? null,
      edge: s ? edge(s) : null,
      available: r.inventory.byType[type].available,
      monthsSupply: r.inventory.byType[type].monthsSupply,
    };
  }),
});
