/**
 * Single source of truth for site identity, NAP (Name/Address/Phone), and
 * social profiles.
 *
 * Consumed by <Seo>, the JSON-LD builders in lib/schema.ts, <Analytics>, and
 * the Footer/Contact components. NAP values here must match the Google
 * Business Profile listing character-for-character — inconsistent NAP across
 * the web actively suppresses local search rankings.
 *
 * Fields whose real value is not yet known are left empty on purpose. The
 * schema builders drop empty fields entirely, and absent data is always
 * better than wrong data.
 */

export const SITE = {
  origin: 'https://kevinhoang.co',
  /**
   * The business name EXACTLY as the Google Business Profile states it. This is
   * the "N" in NAP — schema.org `name` and `og:site_name` use it, and it has to
   * match the profile character-for-character or the citation does not line up.
   * Confirmed against the profile 2026-08-26.
   */
  name: 'Kevin Hoang | Greater Boston Realtor',
  /**
   * Shorter form for the <title> suffix. The GBP name already contains a pipe,
   * and appending it wholesale would produce titles like
   * "Free Home Valuation | Kevin Hoang | Greater Boston Realtor".
   */
  titleSuffix: 'Kevin Hoang',
  /** The individual agent, for Person/employee schema. */
  agentName: 'Kevin Hoang',
  description:
    'Needham, MA licensed real estate broker helping buyers and sellers across MetroWest and Greater Boston — in English and Vietnamese.',
  locale: 'en_US',

  /** Current brokerage. Confirmed 2026-08-26. */
  brokerage: 'Keller Williams Realty',

  /**
   * Languages clients are served in, for schema.org knowsLanguage. Vietnamese
   * is offered in addition to English, not as a specialization — the copy on
   * /vietnamese-speaking-real-estate-agent is written to reflect that.
   */
  languages: ['en', 'vi'],

  /** Display format. Must match the Google Business Profile exactly. */
  phone: '(860) 682-2251',
  /** E.164, required by schema.org telephone and used for every tel: href. */
  phoneE164: '+1-860-682-2251',
  email: 'knhoangre@gmail.com',

  address: {
    streetAddress: '150 West St',
    addressLocality: 'Needham',
    addressRegion: 'MA',
    postalCode: '02494',
    addressCountry: 'US',
  },

  /** Public scheduling link, shown in the footer and on contact CTAs. */
  appointmentUrl: 'https://calendar.app.google/P297MnAu7ei6turA6',

  /**
   * Latitude/longitude for the Keller Williams office at 150 West St.
   *
   * Geocoded from the postal address via OpenStreetMap/Nominatim 2026-08-26 and
   * sanity-checked to fall in Needham Heights, between the town centre
   * (~42.279, -71.233) and the northern town line — consistent with West St.
   *
   * If this is ever wrong, set it back to null rather than guessing: the schema
   * builder omits `geo` entirely when it is null, and an absent coordinate is
   * correct while one pointing at the wrong town is actively harmful.
   */
  geo: { latitude: 42.2929724, longitude: -71.2366817 } as
    | { latitude: number; longitude: number }
    | null,

  /**
   * The profiles that identify the same real-world person as this site.
   *
   * Named rather than a bare URL list, because these are rendered as VISIBLE
   * links on /about as well as emitted into schema.org `sameAs`. That pairing
   * is the point: `sameAs` on its own is an unbacked assertion, and what
   * actually lets a search or answer engine merge these into one entity is a
   * visible link out plus a matching link back from the profile. See
   * `profileUrls` below for the derived array the schema builders use.
   *
   * Google Business Profile is first — the highest-value citation for local
   * search, and the one that anchors the rest of the graph.
   */
  profiles: [
    { name: 'Google Business Profile', url: 'https://share.google/dBpe3OLBDeYHfZq28' },
    { name: 'Keller Williams', url: 'https://kevinhoang.kw.com/' },
    { name: 'Zillow', url: 'https://www.zillow.com/profile/knhoangre' },
    {
      name: 'Realtor.com',
      url: 'https://www.realtor.com/realestateagents/60b8c196fa43a30012984ad1',
    },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/knhoangre/' },
    { name: 'Instagram', url: 'https://www.instagram.com/knhoangre/' },
    { name: 'Facebook', url: 'https://www.facebook.com/knhoangre/' },
  ] as { name: string; url: string }[],

  /** Default Open Graph image, relative to origin. Must be 1200x630. */
  defaultOgImage: '/og-image.jpg',

  /**
   * Google Analytics 4 measurement ID (format G-XXXXXXXXXX). While this is
   * empty no analytics script is injected, so the site is safe to ship
   * un-configured. See src/components/Analytics.tsx.
   */
  ga4Id: 'G-ZSRC329HZ2' as string,

  /**
   * Google Search Console verification token. Add the property (URL prefix
   * https://kevinhoang.co) at search.google.com/search-console, choose the
   * "HTML tag" method, and paste the token's content value here. Empty = no
   * verification meta emitted.
   */
  gscVerification: 'h6nLro5eJFCmUt8tfQ0LtOZBOCCg-kgN9D_dqqJ-eZE' as string,

  /**
   * Office hours for schema.org openingHoursSpecification. "Open now" is a
   * top-5 local-pack ranking factor, so this is worth filling in. While the
   * array is empty the schema omits hours entirely, like geo.
   */
  hours: [
    {
      // Client-supplied 2026-08-26 as 8 AM to 12 AM, every day, matching the
      // Google Business Profile ("Closes 12 AM"). `closes` is '23:59' because
      // that is the schema-safe way to say "until midnight" — '24:00' and
      // '00:00' read as ambiguous or as a zero-length window.
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '23:59',
    },
  ] as { days: string[]; opens: string; closes: string }[],

  /**
   * The interest rate the payment estimate on a listing page STARTS at.
   *
   * Not a quote, not a rate this site can offer, and deliberately not fetched:
   * a live rate feed would put a number on the page that changes under the
   * reader without their input, and a stale cached one is worse than an
   * assumption clearly labelled as one. The input it seeds is editable, and
   * ListingPayment says in as many words that this is an assumption.
   *
   * Update the value and the date together, or not at all. A rate carrying a
   * confirmation date from two years ago is at least legible as stale, which is
   * exactly the reasoning behind showing `tax_year` beside every tax figure.
   *
   * Freddie Mac's Primary Mortgage Market Survey is the citable source:
   * https://www.freddiemac.com/pmms
   */
  assumedMortgageRate: 6.5 as number,
  /** When `assumedMortgageRate` was last checked against the PMMS. */
  assumedMortgageRateAsOf: '2026-09-01',

  /**
   * Annual private mortgage insurance, as a percentage of the original loan.
   *
   * 0.5% is the good-credit end of a real range, not a typical figure: the
   * Urban Institute's Housing Finance Policy Center puts conventional PMI
   * between roughly 0.46% and 1.5% a year, with the low end reserved for
   * borrowers around a 760 credit score and the high end for the low 600s.
   * Seeding the optimistic end of a range would be the same error as quoting a
   * rate — so this is an editable input and the UI states the range beside it.
   *
   * PMI is charged only while the loan exceeds 80% of the price; that threshold
   * is statutory and lives in @/lib/mortgage, not here.
   */
  assumedPmiRate: 0.5 as number,

  /**
   * Towns served, used for schema `areaServed`, the sitemap, and the nearby-
   * towns cross-links. Slugs match the keys in src/data/neighborhoodData.ts
   * and the /neighborhoods/:slug route.
   */
  areaServed: [
    { name: 'Needham', slug: 'needham-ma' },
    { name: 'Newton', slug: 'newton-ma' },
    { name: 'Wellesley', slug: 'wellesley-ma' },
    { name: 'Weston', slug: 'weston-ma' },
    { name: 'Dover', slug: 'dover-ma' },
    { name: 'Lexington', slug: 'lexington-ma' },
    { name: 'Concord', slug: 'concord-ma' },
    { name: 'Cambridge', slug: 'cambridge-ma' },
    { name: 'Somerville', slug: 'somerville-ma' },
    { name: 'Waltham', slug: 'waltham-ma' },
    { name: 'Medford', slug: 'medford-ma' },
    { name: 'Malden', slug: 'malden-ma' },
    { name: 'Quincy', slug: 'quincy-ma' },
    { name: 'Braintree', slug: 'braintree-ma' },
    { name: 'Brookline', slug: 'brookline-ma' },
    { name: 'Belmont', slug: 'belmont-ma' },
    { name: 'Winchester', slug: 'winchester-ma' },
  ],
} as const;

/**
 * Just the URLs, for schema.org `sameAs`. Derived rather than maintained
 * separately so the visible links on /about and the machine-readable claim can
 * never name different sets of profiles.
 */
export const profileUrls = SITE.profiles.map((p) => p.url);

/** The Google Business Profile — the first entry, by the convention above. */
export const googleProfileUrl = SITE.profiles[0].url;

/** Absolute URL for a site-relative path, for canonicals and OG tags. */
export const absoluteUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path;
  const clean = `/${path}`.replace(/\/{2,}/g, '/');
  const trimmed = clean.length > 1 ? clean.replace(/\/$/, '') : clean;
  return `${SITE.origin}${trimmed}`;
};

/**
 * Call and text hrefs built from the E.164 number, so every one of them is
 * identical. Several were previously written as `tel:8606822251` with no
 * country code.
 */
export const telHref = `tel:${SITE.phoneE164}`;
export const smsHref = `sms:${SITE.phoneE164}`;

/**
 * A text message with the body already written.
 *
 * `?&body=` is not a typo and not belt-and-braces: iOS parses the separator
 * after the number as `&`, Android and every desktop handler expect `?`, and
 * `?&` is the one form both accept — the widely-used workaround for a split
 * that was never standardised. Anything else silently drops the body on half of
 * the phones that open it.
 *
 * The draft is a starting sentence, not a finished message. Someone who taps
 * "Text about 12 Maple St" is telling us what they want to ask about; making
 * them then type the address they were just looking at is the friction the
 * button exists to remove, and an empty compose window is where most of these
 * are abandoned.
 */
export const smsHrefWith = (body: string) =>
  `sms:${SITE.phoneE164}?&body=${encodeURIComponent(body)}`;

/** Single-line postal address, matching the Google Business Profile listing. */
export const formattedAddress =
  `${SITE.address.streetAddress}, ${SITE.address.addressLocality}, ` +
  `${SITE.address.addressRegion} ${SITE.address.postalCode}`;

/** Google Maps link for the office. */
export const mapsHref =
  `https://maps.google.com/?q=${encodeURIComponent(formattedAddress)}`;
