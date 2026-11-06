/**
 * /admin/visitors: Google Analytics and Search Console, in plain words.
 *
 * Kevin opened GA4 on 2026-11-05, could not tell what he was looking at, and
 * suspected most of it was himself. It was: in the 28 days to 2026-11-04 one
 * visitor in Newton made 47% of everything recorded, his admin pages were
 * counted, the test copy on his Mac sent ~80 page views, and 71 "visitors" to
 * one blog post stayed three seconds each. The fix at the source is in
 * analytics.ts ("WHO IS NOT COUNTED"); this is the reading half.
 *
 * PURE — no network, no DOM — like market.ts, so
 * `node scripts/site-visitors-check.ts` can run it. The `site-visitors` edge
 * function only fetches and reshapes; every label and sentence is here.
 *
 * Three decisions in it:
 *
 *  - The headline is VISITS THAT STAYED (GA4's "engaged session": ten seconds,
 *    a second page, or a lead). A robot that loads one page and leaves is a
 *    visit; it is not a reader. All visits are still shown, smaller.
 *  - Rows that are Kevin's own tools (Vercel, the test copy, coming back from
 *    sign-in) are labelled as such and never named as "where visitors came
 *    from". Before CLEAN_SINCE they are in the data and cannot be taken out.
 *  - A listing is one row however its link was spelled: older GA4 rows carry
 *    the address slug, newer ones only the MLS number (analyticsPath).
 */
import { classifyHost, type TrafficSource } from './analytics.ts';
import { mlsFromListingParam } from './listingUrl.ts';

/**
 * The day Kevin's own browsers, the test copies and automated browsers stopped
 * being counted. Anything before it still has him in it.
 */
export const CLEAN_SINCE = '2026-11-06';

export const PERIODS = [7, 28, 90] as const;
export type Period = (typeof PERIODS)[number];

export interface Totals {
  /** Different browsers, which is as close to "people" as GA4 gets. */
  people: number;
  visits: number;
  /** Engaged sessions. */
  stayed: number;
  views: number;
}

export interface PageRow {
  path: string;
  title: string;
  views: number;
  people: number;
  /** Total engagement time, in seconds. */
  seconds: number;
}

export interface SourceRow {
  channel: string;
  source: string;
  visits: number;
  stayed: number;
}

export interface CityRow {
  city: string;
  region: string;
  people: number;
  stayed: number;
}

export interface ActionRow {
  event: string;
  count: number;
}

export interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  /** Average position in Google's results; 1 is the top. */
  position: number;
}

export interface SearchPageRow {
  page: string;
  clicks: number;
  impressions: number;
}

export interface SearchReport {
  start: string;
  end: string;
  clicks: number;
  impressions: number;
  queries: QueryRow[];
  pages: SearchPageRow[];
}

/** What the `site-visitors` function returns once it is set up. */
export interface VisitorReport {
  configured: true;
  days: number;
  start: string;
  end: string;
  totals: Totals | null;
  previous: Totals | null;
  pages: PageRow[];
  sources: SourceRow[];
  cities: CityRow[];
  actions: ActionRow[];
  search: SearchReport | null;
  /** Set when a half failed; the other half still renders. */
  analyticsError?: string;
  searchError?: string;
}

export type VisitorResponse = VisitorReport | { configured: false };

/* ---- numbers ------------------------------------------------------------ */

export const count = (n: number) => Math.round(n).toLocaleString('en-US');

/** "+40%", "−12%", or null when the earlier figure is too small to compare. */
export const change = (now: number, before: number | null | undefined): string | null => {
  if (before === null || before === undefined || before < 5) return null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return 'same as before';
  return `${pct > 0 ? '+' : '−'}${Math.abs(pct)}%`;
};

const share = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** '2026-11-06' as "November 6, 2026". Read as a calendar date, never an instant. */
export const longDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

export const shortDate = (iso: string): string => {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${d}`;
};

/** Plural with the number: 1 visit, 2 visits. */
const n = (value: number, one: string, many = `${one}s`) => `${count(value)} ${value === 1 ? one : many}`;

/* ---- where they came from ----------------------------------------------- */

export const DIRECT_LABEL = 'Typed your address, or a link from a text or email';

const AI_NAMES: Partial<Record<TrafficSource, string>> = {
  ai_chatgpt: 'ChatGPT',
  ai_perplexity: 'Perplexity',
  ai_claude: 'Claude',
  ai_copilot: 'Microsoft Copilot',
  ai_gemini: 'Google Gemini',
};

/** GA4 names a search engine's source by its bare name, not its host. */
const SEARCH_ENGINES: Record<string, string> = {
  google: 'Google search',
  bing: 'Bing search',
  duckduckgo: 'DuckDuckGo search',
  yahoo: 'Yahoo search',
  ecosia: 'Ecosia search',
  baidu: 'Baidu search',
};

/** Sites worth a proper name. Matched on the host or its registrable suffix. */
const SITE_NAMES: [string, string][] = [
  ['facebook.com', 'Facebook'],
  ['instagram.com', 'Instagram'],
  ['linkedin.com', 'LinkedIn'],
  ['t.co', 'X (Twitter)'],
  ['x.com', 'X (Twitter)'],
  ['youtube.com', 'YouTube'],
  ['zillow.com', 'Zillow'],
  ['realtor.com', 'Realtor.com'],
  ['redfin.com', 'Redfin'],
  ['maggieli.co', 'Maggie Li’s website'],
  ['mail.google.com', 'Gmail'],
];

/**
 * Sources that are Kevin and his tools, not an audience. Coming back from
 * Google sign-in started a new "referral" visit until accounts.google.com was
 * listed as an unwanted referral on 2026-11-06.
 */
const OWN_SOURCES: [string, string][] = [
  ['accounts.google.com', 'Coming back from signing in'],
  ['supabase.co', 'Coming back from signing in'],
  ['vercel.com', 'Your own tools (Vercel, test copies)'],
  ['vercel.app', 'Your own tools (Vercel, test copies)'],
  ['localhost', 'Your own tools (Vercel, test copies)'],
];

const matches = (host: string, needle: string) => host === needle || host.endsWith(`.${needle}`);

export interface SourceLabel {
  label: string;
  /** Kevin's own tools: never named as where visitors came from. */
  own: boolean;
}

export const sourceLabel = (channel: string, source: string): SourceLabel => {
  const raw = source.trim().toLowerCase();
  if (raw === '(direct)' || channel === 'Direct') return { label: DIRECT_LABEL, own: false };
  if (!raw || raw === '(not set)') return { label: 'Unknown', own: false };

  const host = raw.replace(/:\d+$/, '');
  for (const [needle, label] of OWN_SOURCES) {
    if (matches(host, needle)) return { label, own: true };
  }
  if (SEARCH_ENGINES[host]) return { label: SEARCH_ENGINES[host], own: false };

  const kind = classifyHost(host);
  if (AI_NAMES[kind]) return { label: AI_NAMES[kind] as string, own: false };
  if (kind === 'search_google') return { label: 'Google search', own: false };
  if (kind === 'search_bing') return { label: 'Bing search', own: false };

  for (const [needle, label] of SITE_NAMES) {
    if (matches(host, needle)) return { label, own: false };
  }
  return { label: host.replace(/^(www|m|l|lm)\./, ''), own: false };
};

export interface SourceLine extends SourceLabel {
  visits: number;
  stayed: number;
}

/** One line per label — facebook.com and m.facebook.com are both Facebook. */
export const mergeSources = (rows: SourceRow[]): SourceLine[] => {
  const byLabel = new Map<string, SourceLine>();
  for (const row of rows) {
    const { label, own } = sourceLabel(row.channel, row.source);
    const line = byLabel.get(label) ?? { label, own, visits: 0, stayed: 0 };
    line.visits += row.visits;
    line.stayed += row.stayed;
    byLabel.set(label, line);
  }
  // Kevin's own lines last, whatever their size.
  return [...byLabel.values()].sort((a, b) => Number(a.own) - Number(b.own) || b.visits - a.visits);
};

/* ---- what they read ----------------------------------------------------- */

/** Pages that are Kevin, sign-in plumbing, or nothing to read. */
const HIDDEN_PAGES = ['/admin', '/crm', '/auth'];

export const isHiddenPage = (path: string) =>
  HIDDEN_PAGES.some((p) => path === p || path.startsWith(`${p}/`));

/** One path per page: no trailing slash, one row per listing, no invite tokens. */
export const foldPath = (raw: string): string => {
  let path = raw.split(/[?#]/)[0] || '/';
  if (path.length > 1) path = path.replace(/\/+$/, '');
  if (path.startsWith('/apply/')) return '/apply/:token';
  if (path.startsWith('/search/')) {
    const mls = mlsFromListingParam(path.slice('/search/'.length));
    if (mls) return `/search/${mls}`;
  }
  return path;
};

/** The page's title without the site name on the end. */
export const pageLabel = (title: string, path: string): string => {
  const cleaned = title
    .replace(/\s*[|·–—-]\s*(Kevin Hoang|Maggie Li)[^|]*$/i, '')
    .trim();
  if (cleaned && cleaned !== '(not set)') return cleaned;
  return path === '/' ? 'Homepage' : path;
};

export type PageKind =
  | 'Homepage'
  | 'Blog posts'
  | 'Town guides'
  | 'Listings'
  | 'Home search'
  | 'Your sold homes'
  | 'Market reports'
  | 'Chinese pages'
  | 'Vietnamese pages'
  | 'Rental applications'
  | 'Other pages';

export const pageKind = (path: string): PageKind => {
  if (path === '/') return 'Homepage';
  if (path === '/zh' || path.startsWith('/zh/')) return 'Chinese pages';
  if (path === '/vi' || path.startsWith('/vi/')) return 'Vietnamese pages';
  if (path.startsWith('/blog/')) return 'Blog posts';
  if (path.startsWith('/neighborhoods/')) return 'Town guides';
  if (path.startsWith('/search/')) return 'Listings';
  if (path === '/search') return 'Home search';
  if (path === '/properties' || path.startsWith('/properties/')) return 'Your sold homes';
  if (path === '/market' || path.startsWith('/market/')) return 'Market reports';
  if (path === '/apply' || path.startsWith('/apply/') || path === '/rentals') return 'Rental applications';
  return 'Other pages';
};

export interface PageLine {
  path: string;
  label: string;
  kind: PageKind;
  views: number;
  /** Summed across a page's folded rows, so a slight overcount at worst. */
  people: number;
  /** Average time on the page per view, in seconds. */
  secondsPerView: number;
}

export const mergePages = (rows: PageRow[]): PageLine[] => {
  const byPath = new Map<string, { best: PageRow; views: number; people: number; seconds: number }>();
  for (const row of rows) {
    const path = foldPath(row.path);
    if (isHiddenPage(path)) continue;
    const entry = byPath.get(path);
    if (!entry) {
      byPath.set(path, { best: row, views: row.views, people: row.people, seconds: row.seconds });
    } else {
      if (row.views > entry.best.views) entry.best = row;
      entry.views += row.views;
      entry.people += row.people;
      entry.seconds += row.seconds;
    }
  }
  return [...byPath.entries()]
    .map(([path, e]) => ({
      path,
      label: pageLabel(e.best.title, path),
      kind: pageKind(path),
      views: e.views,
      people: e.people,
      secondsPerView: e.views > 0 ? e.seconds / e.views : 0,
    }))
    .sort((a, b) => b.views - a.views);
};

/** The kinds that are one page, as the subject of a sentence; the rest are "<kind> were". */
const KIND_SUBJECT: Partial<Record<PageKind, string>> = {
  Homepage: 'The homepage was',
  'Home search': 'The home search page was',
};

/** Share of views by kind of page, largest first. */
export const kindsSplit = (pages: PageLine[]): { kind: PageKind; views: number; share: number }[] => {
  const total = pages.reduce((sum, p) => sum + p.views, 0);
  const byKind = new Map<PageKind, number>();
  for (const p of pages) byKind.set(p.kind, (byKind.get(p.kind) ?? 0) + p.views);
  return [...byKind.entries()]
    .map(([kind, views]) => ({ kind, views, share: share(views, total) }))
    .sort((a, b) => b.views - a.views);
};

/** "45s", "2m 10s". */
export const duration = (seconds: number): string => {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
};

/* ---- where they are ----------------------------------------------------- */

export interface CityLine {
  label: string;
  people: number;
  stayed: number;
}

/** "Boston, Massachusetts"; GA4's "(not set)" becomes one "Unknown" line. */
export const mergeCities = (rows: CityRow[]): CityLine[] => {
  const byLabel = new Map<string, CityLine>();
  for (const row of rows) {
    const known = row.city && row.city !== '(not set)';
    const label = known
      ? [row.city, row.region && row.region !== '(not set)' ? row.region : null].filter(Boolean).join(', ')
      : 'Unknown location';
    const line = byLabel.get(label) ?? { label, people: 0, stayed: 0 };
    line.people += row.people;
    line.stayed += row.stayed;
    byLabel.set(label, line);
  }
  return [...byLabel.values()].sort(
    (a, b) =>
      Number(a.label === 'Unknown location') - Number(b.label === 'Unknown location') || b.people - a.people
  );
};

/** Share of visitors whose location is known who are in Massachusetts, or null. */
export const massachusettsShare = (rows: CityRow[]): number | null => {
  const known = rows.filter((r) => r.region && r.region !== '(not set)');
  const total = known.reduce((sum, r) => sum + r.people, 0);
  if (total < 5) return null;
  return share(
    known.filter((r) => r.region === 'Massachusetts').reduce((sum, r) => sum + r.people, 0),
    total
  );
};

/* ---- what they did ------------------------------------------------------ */

/** The five events analytics.ts sends, in the order they matter. */
export const ACTIONS: { event: string; label: string; phrase: (n: number) => string }[] = [
  {
    event: 'generate_lead',
    label: 'Sent a contact form',
    phrase: (v) => `${n(v, 'contact form')} sent`,
  },
  {
    event: 'contact_call',
    label: 'Tapped your phone number',
    phrase: (v) => `${n(v, 'tap')} on your phone number`,
  },
  {
    event: 'contact_text',
    label: 'Tapped to text you',
    phrase: (v) => `${n(v, 'tap')} to text you`,
  },
  {
    event: 'appointment_click',
    label: 'Opened your booking link',
    phrase: (v) => `${n(v, 'booking-link open')}`,
  },
  {
    event: 'rental_application_submitted',
    label: 'Sent a rental application',
    phrase: (v) => `${n(v, 'rental application')} sent`,
  },
];

export const actionCounts = (rows: ActionRow[]) =>
  ACTIONS.map((a) => ({
    ...a,
    count: rows.filter((r) => r.event === a.event).reduce((sum, r) => sum + r.count, 0),
  }));

/* ---- what they searched ------------------------------------------------- */

/** Which page of Google's results an average position is on. */
export const resultsPage = (position: number) => Math.max(1, Math.ceil(position / 10));

/**
 * Searches that showed the site often and were never clicked: the cheapest
 * thing to fix, since it is usually the page's title or description.
 */
export const missedSearches = (queries: QueryRow[], minimum = 10): QueryRow[] =>
  queries
    .filter((q) => q.clicks === 0 && q.impressions >= minimum)
    .sort((a, b) => b.impressions - a.impressions);

/** Search Console reports full URLs; the page's path reads better. */
export const searchPath = (url: string): string => {
  try {
    const path = new URL(url).pathname;
    return path.length > 1 ? path.replace(/\/+$/, '') : '/';
  } catch {
    return url;
  }
};

/* ---- the notes at the top ----------------------------------------------- */

/**
 * The few things worth saying about a period, as sentences. Nothing is said
 * that the numbers below do not show, and a sentence is left out rather than
 * written about too little data.
 */
export const notes = (report: VisitorReport): string[] => {
  const out: string[] = [];

  if (report.start < CLEAN_SINCE) {
    out.push(
      `Visits before ${longDate(CLEAN_SINCE)} still include you: your own phone, computer and test copies of the site were counted until then. Pick a shorter period, or wait, for visitors only.`
    );
  }

  const t = report.totals;
  if (t) {
    if (t.visits === 0) {
      out.push('Nobody has visited in this period yet.');
    } else {
      out.push(
        `${n(t.people, 'person', 'people')} visited. ${count(t.stayed)} of ${n(t.visits, 'visit')} lasted more than a few seconds; the rest left almost at once, and robots are among them.`
      );
    }
  }

  const sources = mergeSources(report.sources).filter((s) => !s.own && s.label !== 'Unknown');
  const sourceTotal = sources.reduce((sum, s) => sum + s.visits, 0);
  const top = sources[0];
  if (top && sourceTotal >= 5) {
    const pct = share(top.visits, sourceTotal);
    out.push(
      pct >= 50
        ? `Most visits came from ${top.label === DIRECT_LABEL ? 'people typing your address or opening a link from a text or email' : top.label} (${count(top.visits)} of ${count(sourceTotal)}).`
        : `The biggest single source was ${top.label === DIRECT_LABEL ? 'people typing your address or opening a link from a text or email' : top.label}, with ${pct}% of visits.`
    );
  }
  const ai = sources.filter((s) => Object.values(AI_NAMES).includes(s.label));
  const aiVisits = ai.reduce((sum, s) => sum + s.visits, 0);
  if (aiVisits > 0) {
    out.push(
      `${n(aiVisits, 'visit')} came from AI assistants (${ai.map((s) => s.label).join(', ')}). That is a floor: most assistants do not say where a visitor came from.`
    );
  }

  const pages = mergePages(report.pages);
  const read = pages.filter((p) => p.path !== '/');
  if (read.length > 0 && read[0].views >= 3) {
    out.push(`The most-read page after the homepage was “${read[0].label}” (${n(read[0].views, 'view')}).`);
  }
  const kinds = kindsSplit(pages);
  if (kinds.length > 1 && kinds[0].share >= 30 && kinds[0].views >= 10) {
    out.push(`${KIND_SUBJECT[kinds[0].kind] ?? `${kinds[0].kind} were`} ${kinds[0].share}% of everything read.`);
  }

  const ma = massachusettsShare(report.cities);
  if (ma !== null) {
    out.push(`${ma}% of visitors whose town is known were in Massachusetts.`);
  }

  if (!report.analyticsError) {
    const done = actionCounts(report.actions).filter((a) => a.count > 0);
    out.push(
      done.length === 0
        ? 'Nobody called, texted, booked or sent a form through the site in this period.'
        : `Leads from the site: ${done.map((a) => a.phrase(a.count)).join(', ')}.`
    );
  }

  const s = report.search;
  if (s && s.impressions > 0) {
    out.push(
      `On Google your site showed up ${n(s.impressions, 'time')} and was clicked ${n(s.clicks, 'time')} (${shortDate(s.start)} to ${shortDate(s.end)}).`
    );
    const missed = missedSearches(s.queries)[0];
    if (missed) {
      out.push(
        `“${missed.query}” showed your site ${n(missed.impressions, 'time')} with no clicks. A page title that answers that search more directly may earn them.`
      );
    }
  }

  return out;
};
