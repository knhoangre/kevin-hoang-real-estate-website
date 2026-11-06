/**
 * The figures behind /relocation, the Connecticut-to-Massachusetts page.
 *
 * Each was read from the source named beside it, in November 2026, and none of
 * them changes on its own — so they are stated with their period rather than
 * fetched, and a figure is updated together with its period or not at all. The
 * four posts in blogData.ts that the page links to quote the same figures in
 * prose; change one and search the posts for it.
 *
 * Deliberately absent: anything that ranks a town or a school, and anything
 * that could not be read at its source. The page says what a reader can look
 * up and where, rather than restating a number nobody here checked.
 */

export interface TownValue {
  town: string;
  value: number;
}

/**
 * Typical home values, one source for both states so the two columns compare
 * like with like. ZHVI is Zillow's estimate of a mid-priced home in each place,
 * all home types — not a sale price. Kevin's own monthly market reports carry
 * MLS sale medians for the Massachusetts towns and are linked beside the table.
 */
export const HOME_VALUES = {
  period: 'September 2026',
  source: 'Zillow Home Value Index',
  url: 'https://www.zillow.com/research/data/',
  connecticut: [
    { town: 'Manchester', value: 331_988 },
    { town: 'New Haven', value: 337_417 },
    { town: 'South Windsor', value: 439_781 },
    { town: 'West Hartford', value: 501_091 },
    { town: 'Glastonbury', value: 555_074 },
    { town: 'Stamford', value: 717_654 },
  ] as TownValue[],
  /** The towns this practice covers. Dover has no index value. */
  massachusetts: [
    { town: 'Malden', value: 667_723 },
    { town: 'Quincy', value: 674_171 },
    { town: 'Braintree', value: 729_592 },
    { town: 'Waltham', value: 807_438 },
    { town: 'Medford', value: 817_090 },
    { town: 'Somerville', value: 920_007 },
    { town: 'Cambridge', value: 1_019_246 },
    { town: 'Brookline', value: 1_124_458 },
    { town: 'Concord', value: 1_414_061 },
    { town: 'Belmont', value: 1_420_623 },
    { town: 'Newton', value: 1_482_662 },
    { town: 'Winchester', value: 1_530_404 },
    { town: 'Needham', value: 1_538_127 },
    { town: 'Lexington', value: 1_551_065 },
    { town: 'Wellesley', value: 2_008_349 },
    { town: 'Weston', value: 2_229_223 },
  ] as TownValue[],
};

/**
 * The property-tax comparison the page leads its tax section with. A
 * Connecticut mill rate is charged on 70% of market value (C.G.S. § 12-62a); a
 * Massachusetts rate on all of it. Values are the ZHVI figures above.
 */
export const PROPERTY_TAX = {
  southWindsor: {
    mills: 37.01,
    /** The grand list the rate applies to, and the bill it produces. */
    period: 'October 1, 2025 grand list (bills from July 2026)',
    source: 'Connecticut OPM mill rates, via data.ct.gov',
    url: 'https://data.ct.gov/Local-Government/Mill-Rates-for-FY-2014-2025/emyx-j53e',
  },
  newton: {
    rate: 9.69,
    period: 'fiscal 2026',
    source: 'City of Newton Assessing',
    url: 'https://www.newtonma.gov/government/assessing/tax-rate',
  },
};

/** Annual bill on a home of `value`: CT at 70% assessment, MA at 100%. */
export const ctTax = (value: number, mills: number) => value * 0.7 * (mills / 1000);
export const maTax = (value: number, ratePerThousand: number) => value * (ratePerThousand / 1000);

/**
 * Jobs and pay, from one federal count for both states: the BLS Quarterly
 * Census of Employment and Wages, 2024 annual averages. Industry rows are
 * private employers only; the first row is every employer.
 */
export const JOBS = {
  period: '2024 annual averages',
  source: 'U.S. Bureau of Labor Statistics, Quarterly Census of Employment and Wages',
  url: 'https://www.bls.gov/cew/',
  rows: [
    { label: 'All jobs', ma: 3_644_805, ct: 1_683_378, maPay: 96_109, ctPay: 87_516 },
    { label: 'Health care', ma: 648_228, ct: 291_475, maPay: 73_043, ctPay: 66_874 },
    { label: 'Professional, scientific and technical', ma: 371_502, ct: 101_440, maPay: 182_538, ctPay: 137_636 },
    { label: 'Scientific research and development', ma: 105_307, ct: 10_029, maPay: 238_284, ctPay: 200_133 },
    { label: 'Manufacturing', ma: 231_186, ct: 155_773, maPay: 105_649, ctPay: 100_701 },
    { label: 'Finance and insurance', ma: 168_270, ct: 96_463, maPay: 200_766, ctPay: 234_165 },
  ],
};

/** NAEP 2024 average scale scores. Public schools; the same test in both states. */
export const NAEP = {
  period: '2024',
  source: 'National Assessment of Educational Progress (NCES)',
  url: 'https://www.nationsreportcard.gov/',
  rows: [
    { label: 'Grade 4 reading', ma: 224.8, ct: 219.2, us: 214.3 },
    { label: 'Grade 8 reading', ma: 268.0, ct: 263.1, us: 256.7 },
    { label: 'Grade 4 math', ma: 246.5, ct: 239.1, us: 237.3 },
    { label: 'Grade 8 math', ma: 283.5, ct: 276.7, us: 272.2 },
  ],
};

/** Every source the page cites, for its visible source list. */
export const SOURCES: { label: string; url: string }[] = [
  { label: 'Zillow Home Value Index, September 2026', url: HOME_VALUES.url },
  { label: 'BLS Quarterly Census of Employment and Wages, 2024', url: JOBS.url },
  { label: 'NAEP 2024 state results (NCES)', url: NAEP.url },
  { label: 'America’s Health Rankings, uninsured rate by state (Census ACS, 2024)', url: 'https://www.americashealthrankings.org/explore/measures/HealthInsurance' },
  { label: 'U.S. News Best States 2026, as reported by Boston.com', url: 'https://www.boston.com/news/local-news/2026/07/31/massachusetts-best-state-rankings-u-s-news-world-report-2026/' },
  { label: 'MassBio industry snapshot, as reported by the Boston Globe (August 2026)', url: 'https://www.massbio.org/news/recent-news/boston-globe-massachusetts-lost-biotech-jobs-for-first-time-in-2025-new-report-shows/' },
  { label: 'U.S. Census Bureau, State-to-State Migration Flows, 2024', url: 'https://www.census.gov/data/tables/time-series/demo/geographic-mobility/state-to-state-migration.html' },
  { label: 'Massachusetts Department of Revenue, tax rates', url: 'https://www.mass.gov/info-details/tax-rates' },
  { label: 'Connecticut DRS, estate and gift tax', url: 'https://portal.ct.gov/drs/individuals/individual-income-tax-portal/estate-and-gift-taxes/tax-information' },
  { label: 'Connecticut General Statutes, chapters 203 (property tax), 223 (conveyance tax) and 392 (condition reports)', url: 'https://www.cga.ct.gov/current/pub/titles.htm' },
  { label: 'Connecticut OPM mill rates, via data.ct.gov', url: PROPERTY_TAX.southWindsor.url },
  { label: 'City of Newton, tax rate', url: PROPERTY_TAX.newton.url },
  { label: 'State of Connecticut, crumbling foundations data', url: 'https://portal.ct.gov/datapolicy/knowledge-base/articles/crumbling-foundations-data' },
  { label: 'M.G.L. c. 60A § 1 (motor vehicle excise) and c. 148 § 26F (smoke detectors at sale)', url: 'https://malegislature.gov/Laws/GeneralLaws' },
];

export const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
/** "$440,000": the index is an estimate, so the page does not print its last digits. */
export const usdThousands = (n: number) => `$${(Math.round(n / 1000) * 1000).toLocaleString('en-US')}`;
/** "$1.48 million", for a figure in a sentence rather than a table. */
export const usdMillions = (n: number) => `$${(n / 1_000_000).toFixed(2)} million`;
