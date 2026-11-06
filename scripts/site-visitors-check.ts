/**
 * Assertions for /admin/visitors (src/lib/siteVisitors.ts) and for who the
 * site does not count at all (gaBootScript in src/lib/analytics.ts).
 *
 *   node scripts/site-visitors-check.ts
 *
 * Same arrangement as phone-check.ts: Node runs the TypeScript directly.
 *
 * The page exists because GA4 had been reporting Kevin to himself: in the 28
 * days to 2026-11-04 he was about half of everything recorded. The fixtures
 * below are shaped like that month — his tools among the sources, a listing
 * reached by two spellings of its link, a robot-heavy blog post — so a wrong
 * label or a double-counted listing shows up here rather than on his phone.
 */
import {
  COUNTED_HOST,
  NOT_COUNTED_KEY,
  classifyReferrer,
  gaBootScript,
  gaDisableKey,
} from '../src/lib/analytics.ts';
import {
  CLEAN_SINCE,
  DIRECT_LABEL,
  actionCounts,
  change,
  duration,
  foldPath,
  kindsSplit,
  longDate,
  massachusettsShare,
  mergeCities,
  mergePages,
  mergeSources,
  missedSearches,
  notes,
  pageKind,
  pageLabel,
  resultsPage,
  searchPath,
  sourceLabel,
  type VisitorReport,
} from '../src/lib/siteVisitors.ts';

let failures = 0;
const is = (actual: unknown, expected: unknown, label: string) => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (same) {
    console.log(`ok   ${label}`);
  } else {
    console.error(`FAIL ${label} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
    failures += 1;
  }
};

/* ---- who is not counted -------------------------------------------------- */

/**
 * Runs the exact boot script against a fake browser and says whether GA was
 * switched off. gtag itself is stubbed: only the decision is under test.
 */
const ID = 'G-TEST123456';
const optedOut = ({
  host,
  webdriver = false,
  flag = null,
  storageThrows = false,
}: {
  host: string;
  webdriver?: boolean;
  flag?: string | null;
  storageThrows?: boolean;
}) => {
  const win: Record<string, unknown> = {};
  const storage = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error('blocked');
      return key === NOT_COUNTED_KEY ? flag : null;
    },
  };
  const run = new Function('window', 'location', 'navigator', 'localStorage', 'dataLayer', gaBootScript(ID));
  run(win, { hostname: host }, { webdriver }, storage, []);
  return win[gaDisableKey(ID)] === true;
};

is(optedOut({ host: 'kevinhoang.co' }), false, 'a visitor on kevinhoang.co is counted');
is(optedOut({ host: 'www.kevinhoang.co' }), false, 'a visitor on www.kevinhoang.co is counted');
is(optedOut({ host: 'localhost' }), true, 'the test copy on localhost is not counted');
is(optedOut({ host: '127.0.0.1' }), true, 'nor one on 127.0.0.1');
is(optedOut({ host: 'kevin-hoang-git-main-knhoang10.vercel.app' }), true, 'nor a Vercel preview');
is(optedOut({ host: 'kevinhoang.co.evil.com' }), true, 'a host that only starts with the name is not the site');
is(optedOut({ host: 'notkevinhoang.co' }), true, 'nor one that only ends with it');
is(optedOut({ host: 'www.kevinhoang.co', webdriver: true }), true, 'an automated browser is not counted');
is(optedOut({ host: 'www.kevinhoang.co', flag: '1' }), true, 'a browser Kevin has signed in to as admin is not counted');
is(optedOut({ host: 'www.kevinhoang.co', flag: '0' }), false, 'only the exact mark counts');
is(
  optedOut({ host: 'www.kevinhoang.co', storageThrows: true }),
  false,
  'blocked storage does not break the page or switch off a real visitor'
);
is(COUNTED_HOST.test('kevinhoang.co'), true, 'COUNTED_HOST matches the bare domain');
is(gaBootScript(ID).includes("gtag('config','G-TEST123456',{send_page_view:false})"), true, 'the script still configures gtag');
is(
  gaBootScript(ID).indexOf('ga-disable') < gaBootScript(ID).indexOf("gtag('config'"),
  true,
  'the decision is made BEFORE gtag is configured, so not even the first hit leaves'
);
is(classifyReferrer('https://chatgpt.com/', 'kevinhoang.co'), 'ai_chatgpt', 'classifyReferrer still names ChatGPT');
is(classifyReferrer('https://www.google.co.uk/', 'kevinhoang.co'), 'search_google', 'and Google on a ccTLD');

/* ---- labels ------------------------------------------------------------- */

is(sourceLabel('Organic Search', 'google').label, 'Google search', 'GA4 calls Google "google"');
is(sourceLabel('Direct', '(direct)').label, DIRECT_LABEL, 'direct reads as typed or a link from a message');
is(sourceLabel('Referral', 'chatgpt.com').label, 'ChatGPT', 'ChatGPT by its host');
is(sourceLabel('Referral', 'gemini.google.com').label, 'Google Gemini', 'Gemini is not Google search');
is(sourceLabel('Referral', 'm.facebook.com').label, 'Facebook', 'the mobile Facebook host is Facebook');
is(sourceLabel('Referral', 'accounts.google.com'), { label: 'Coming back from signing in', own: true }, 'sign-in is Kevin’s plumbing');
is(sourceLabel('Referral', 'localhost:5174').own, true, 'the test copy, port and all, is Kevin’s');
is(sourceLabel('Referral', 'vercel.com').own, true, 'so is Vercel');
is(sourceLabel('Referral', 'homeservicebase.com').label, 'homeservicebase.com', 'an unknown site is named by its host');
is(sourceLabel('Unassigned', '(not set)').label, 'Unknown', '(not set) is Unknown');

const sources = mergeSources([
  { channel: 'Direct', source: '(direct)', visits: 139, stayed: 26 },
  { channel: 'Organic Search', source: 'google', visits: 77, stayed: 46 },
  { channel: 'Referral', source: 'accounts.google.com', visits: 66, stayed: 48 },
  { channel: 'Referral', source: 'vercel.com', visits: 11, stayed: 7 },
  { channel: 'Referral', source: 'facebook.com', visits: 3, stayed: 0 },
  { channel: 'Referral', source: 'm.facebook.com', visits: 2, stayed: 0 },
]);
is(sources.map((s) => s.label).slice(0, 3), [DIRECT_LABEL, 'Google search', 'Facebook'], 'visitors first, largest first');
is(sources.find((s) => s.label === 'Facebook')?.visits, 5, 'the two Facebook hosts are one line');
is(sources.slice(-2).every((s) => s.own), true, 'Kevin’s own tools go last, however large');

is(foldPath('/search/170-Gore-St-Unit-417-Cambridge-MA-02141-73568135'), '/search/73568135', 'a listing link folds to its number');
is(foldPath('/search/73568135/'), '/search/73568135', 'and the bare number, trailing slash and all');
is(foldPath('/apply/abc123token'), '/apply/:token', 'an invite token never reaches the page');
is(foldPath('/blog/radon-testing-massachusetts-homes/'), '/blog/radon-testing-massachusetts-homes', 'a trailing slash is one page');
is(foldPath('/'), '/', 'the homepage stays /');

is(pageLabel('Search Listings | Kevin Hoang', '/search'), 'Search Listings', 'the site name comes off the title');
is(
  pageLabel('About Kevin Hoang | Real Estate Broker in Newton, MA', '/about'),
  'About Kevin Hoang | Real Estate Broker in Newton, MA',
  'a title that merely contains the name is left alone'
);
is(pageLabel('(not set)', '/'), 'Homepage', 'a missing title on / is the homepage');
is(pageKind('/blog/x'), 'Blog posts', 'blog');
is(pageKind('/neighborhoods/needham-ma'), 'Town guides', 'town guide');
is(pageKind('/search/73568135'), 'Listings', 'listing');
is(pageKind('/zh/towns/newton'), 'Chinese pages', 'Chinese');
is(pageKind('/vi'), 'Vietnamese pages', 'Vietnamese');

const pages = mergePages([
  { path: '/', title: 'Newton & Greater Boston Real Estate Agent | Kevin Hoang', views: 60, people: 40, seconds: 600 },
  { path: '/blog/short-term-rentals-massachusetts-law', title: 'Short-Term Rentals | Kevin Hoang', views: 70, people: 71, seconds: 210 },
  { path: '/search/170-Gore-St-Unit-417-Cambridge-MA-02141-73568135', title: '170 Gore St Unit 417 | Kevin Hoang', views: 4, people: 2, seconds: 120 },
  { path: '/search/73568135', title: '170 Gore St Unit 417, Cambridge | Kevin Hoang', views: 6, people: 3, seconds: 180 },
  { path: '/admin/applications', title: 'Admin', views: 118, people: 2, seconds: 9000 },
  { path: '/auth/callback', title: 'Signing in', views: 20, people: 5, seconds: 10 },
]);
is(pages.length, 3, 'admin and sign-in pages are never listed');
const listing = pages.find((p) => p.path === '/search/73568135');
is(listing?.views, 10, 'one listing, two spellings of its link, one line');
is(listing?.label, '170 Gore St Unit 417, Cambridge', 'named by the title it was seen under most');
is(listing?.secondsPerView, 30, 'time per view across both');
is(kindsSplit(pages)[0], { kind: 'Blog posts', views: 70, share: 50 }, 'what kind of page was read');

is(
  mergeCities([
    { city: 'Boston', region: 'Massachusetts', people: 26, stayed: 16 },
    { city: '(not set)', region: '(not set)', people: 28, stayed: 6 },
    { city: 'Ashburn', region: 'Virginia', people: 3, stayed: 1 },
  ]).map((c) => c.label),
  ['Boston, Massachusetts', 'Ashburn, Virginia', 'Unknown location'],
  'unknown locations last'
);
is(
  massachusettsShare([
    { city: 'Boston', region: 'Massachusetts', people: 6, stayed: 0 },
    { city: 'Ashburn', region: 'Virginia', people: 2, stayed: 0 },
    { city: '(not set)', region: '(not set)', people: 50, stayed: 0 },
  ]),
  75,
  'Massachusetts share counts only visitors whose location is known'
);
is(massachusettsShare([{ city: 'Boston', region: 'Massachusetts', people: 2, stayed: 0 }]), null, 'too few to say');

is(change(150, 100), '+50%', 'a rise');
is(change(50, 100), '−50%', 'a fall');
is(change(4, 3), null, 'too small a base to compare');
is(change(10, null), null, 'nothing to compare with');
is(duration(45), '45s', 'seconds');
is(duration(130), '2m 10s', 'minutes and seconds');
is(longDate('2026-11-06'), 'November 6, 2026', 'a date read as a calendar day');
is(resultsPage(8.5), 1, 'position 8.5 is page 1 of Google');
is(resultsPage(14), 2, 'position 14 is page 2');
is(searchPath('https://kevinhoang.co/blog/radon/'), '/blog/radon', 'a Search Console URL reads as its path');
is(
  missedSearches([
    { query: 'kevin hoang', clicks: 6, impressions: 77, position: 1.2 },
    { query: 'sell my house as is massachusetts', clicks: 0, impressions: 26, position: 9 },
    { query: 'closing cost calculator massachusetts', clicks: 0, impressions: 21, position: 12 },
    { query: 'rare', clicks: 0, impressions: 3, position: 30 },
  ]).map((q) => q.query),
  ['sell my house as is massachusetts', 'closing cost calculator massachusetts'],
  'searches seen often and never clicked, most seen first'
);
is(
  actionCounts([{ event: 'contact_text', count: 2 }]).map((a) => a.count),
  [0, 0, 2, 0, 0],
  'every lead kind is listed, zero or not'
);

/* ---- the notes ----------------------------------------------------------- */

const month: VisitorReport = {
  configured: true,
  days: 28,
  start: '2026-10-08',
  end: '2026-11-04',
  totals: { people: 208, visits: 305, stayed: 133, views: 1256 },
  previous: { people: 150, visits: 200, stayed: 90, views: 900 },
  pages: [
    { path: '/', title: 'Home | Kevin Hoang', views: 60, people: 40, seconds: 600 },
    { path: '/blog/age-restricted-55-communities-massachusetts', title: '55+ Communities in Massachusetts | Kevin Hoang', views: 30, people: 25, seconds: 3000 },
    { path: '/blog/condo-fees-hoa-regulations-massachusetts', title: 'Condo Fees | Kevin Hoang', views: 20, people: 18, seconds: 1500 },
  ],
  sources: [
    { channel: 'Organic Search', source: 'google', visits: 77, stayed: 46 },
    { channel: 'Direct', source: '(direct)', visits: 40, stayed: 10 },
    { channel: 'Referral', source: 'chatgpt.com', visits: 2, stayed: 2 },
    { channel: 'Referral', source: 'accounts.google.com', visits: 66, stayed: 48 },
  ],
  cities: [
    { city: 'Boston', region: 'Massachusetts', people: 26, stayed: 16 },
    { city: 'Ashburn', region: 'Virginia', people: 3, stayed: 1 },
  ],
  actions: [{ event: 'contact_text', count: 2 }],
  search: {
    start: '2026-10-07',
    end: '2026-11-03',
    clicks: 65,
    impressions: 5690,
    queries: [
      { query: 'kevin hoang', clicks: 6, impressions: 77, position: 1.2 },
      { query: 'sell my house as is massachusetts', clicks: 0, impressions: 26, position: 9 },
    ],
    pages: [],
  },
};

const said = notes(month);
for (const sentence of said) {
  is(/undefined|NaN|null|\[object/.test(sentence), false, `no blanks in: ${sentence.slice(0, 60)}…`);
}
is(said[0].startsWith(`Visits before ${longDate(CLEAN_SINCE)}`), true, 'a period before the fix says it still includes Kevin');
is(said.some((s) => s.includes('Most visits came from Google search (77 of 119)')), true, 'the biggest source, Kevin’s sign-ins left out');
is(said.some((s) => s.includes('AI assistants (ChatGPT)')), true, 'AI visits are named, and called a floor');
is(said.some((s) => s.includes('“55+ Communities in Massachusetts”')), true, 'the most-read page after the homepage');
is(said.some((s) => s.includes('2 taps to text you')), true, 'leads are counted in words');
is(said.some((s) => s.startsWith('The homepage was')), true, 'one page reads as one page, not "Homepage were"');
is(said.some((s) => s.includes('5,690 times')), true, 'Google appearances');
is(said.some((s) => s.includes('“sell my house as is massachusetts”')), true, 'the search that is seen but never clicked');

const clean = notes({ ...month, start: CLEAN_SINCE, actions: [] });
is(clean[0].startsWith('Visits before'), false, 'a clean period does not carry the warning');
is(clean.some((s) => s.startsWith('Nobody called, texted')), true, 'no leads is said plainly');

const empty = notes({
  ...month,
  start: CLEAN_SINCE,
  totals: { people: 0, visits: 0, stayed: 0, views: 0 },
  pages: [],
  sources: [],
  cities: [],
  actions: [],
  search: null,
});
is(empty.includes('Nobody has visited in this period yet.'), true, 'an empty period says so');
for (const sentence of empty) {
  is(/undefined|NaN/.test(sentence), false, `no blanks in an empty period: ${sentence.slice(0, 50)}…`);
}

const brokenAnalytics = notes({ ...month, totals: null, actions: [], analyticsError: 'refused' });
is(
  brokenAnalytics.some((s) => s.startsWith('Nobody called')),
  false,
  'when Analytics failed, "no leads" is not claimed'
);

if (failures > 0) {
  console.error(`\n${failures} failed`);
  process.exit(1);
}
console.log('\nall passed');
