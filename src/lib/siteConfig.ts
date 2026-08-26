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
    'Needham, MA real estate agent helping buyers and sellers across Needham, Newton, and Greater Boston — in English and Vietnamese.',
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
   * Profile URLs for schema.org `sameAs`, which ties this site to the same
   * real-world entity as these profiles.
   *
   * Still needed: the Google Business Profile URL (by far the highest-value
   * one for local search), plus Zillow, Realtor.com, LinkedIn, Instagram, and
   * Facebook. Add them here rather than inline anywhere else.
   */
  sameAs: [
    // Google Business Profile first — the highest-value citation for local
    // search, and the one that anchors the rest of the graph.
    'https://share.google/dBpe3OLBDeYHfZq28',
    'https://kevinhoang.kw.com/',
    'https://www.zillow.com/profile/knhoangre',
    'https://www.realtor.com/realestateagents/60b8c196fa43a30012984ad1',
    'https://www.linkedin.com/in/knhoangre/',
    'https://www.instagram.com/knhoangre/',
    'https://www.facebook.com/knhoangre/',
  ] as string[],

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
  ],
} as const;

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

/** Single-line postal address, matching the Google Business Profile listing. */
export const formattedAddress =
  `${SITE.address.streetAddress}, ${SITE.address.addressLocality}, ` +
  `${SITE.address.addressRegion} ${SITE.address.postalCode}`;

/** Google Maps link for the office. */
export const mapsHref =
  `https://maps.google.com/?q=${encodeURIComponent(formattedAddress)}`;
