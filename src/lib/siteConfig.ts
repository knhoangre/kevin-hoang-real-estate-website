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
    'Newton, MA licensed real estate broker helping buyers and sellers across MetroWest and Greater Boston — in English and Vietnamese.',
  locale: 'en_US',

  /**
   * Current brokerage. Changed from Keller Williams Realty to LPT Realty on
   * 2026-09-26, per Kevin.
   *
   * NOT DECORATION — A LEGAL REQUIREMENT. 254 CMR 3.09 requires that ALL real
   * estate advertising include the name of the broker, conspicuously; a site
   * showing only an agent's own name is the textbook violation. That is why it
   * is in the footer, which puts it on every page, and not only in the hero.
   *
   * !! The exact licensed form of the name has not been checked. If LPT's
   * Massachusetts licence is held as, say, "LPT Realty, LLC", the regulation
   * wants that form, and LPT's compliance team will say which. Change it here.
   */
  brokerage: 'LPT Realty',

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

  /**
   * Where Kevin is based — a TOWN, deliberately not a street address.
   *
   * Until 2026-09-26 this was 150 West St, the Keller Williams office. LPT
   * Realty is a cloud brokerage with no office for him to give, and every
   * option for filling the gap is worse than leaving it:
   *
   *   * The old office is someone else's address now, and would put his NAP
   *     citation on a building he does not work from.
   *   * A virtual office or PO box violates Google Business Profile's guidelines
   *     outright and is a documented cause of suspension.
   *   * A home address publishes where he lives.
   *
   * So he is a SERVICE-AREA BUSINESS, which is the category Google designed for
   * exactly this: the profile hides its address and lists the areas served
   * instead. schema.org's PostalAddress needs no street to be valid, and a
   * locality-only address is the honest statement of "based in Newton".
   *
   * NEWTON, NOT NEEDHAM, since 2026-09-27, per Kevin, who lives there. Needham
   * was where the Keller Williams office was, not where he works from; with the office gone
   * the base is where he actually is. Needham stays a town he serves — it keeps
   * its landing page and its guide — and is no longer described as home base.
   * The hidden address on the Google Business Profile has to be in Newton too,
   * or the profile and the site disagree about where the business is.
   *
   * streetAddress and postalCode are REMOVED rather than blanked, so that any
   * code still printing them fails to compile rather than rendering an empty
   * line. A ZIP was dropped along with the street: Newton has one per village,
   * about ten, and choosing one would be inventing a location.
   */
  address: {
    addressLocality: 'Newton',
    addressRegion: 'MA',
    addressCountry: 'US',
  },

  /** Public scheduling link, shown in the footer and on contact CTAs. */
  appointmentUrl: 'https://calendar.app.google/P297MnAu7ei6turA6',

  /**
   * Latitude/longitude of the place of business. NULL, and it must stay null
   * until there is a real one.
   *
   * This held the Keller Williams office at 150 West St until 2026-09-26. A
   * service-area business has no point to give, and CLAUDE.md is explicit: an
   * absent coordinate is correct while one pointing at the wrong place is
   * actively harmful. The schema builder omits `geo` entirely when it is null.
   * Newton's city centre is NOT a substitute — it is a coordinate for a
   * business that is not there.
   */
  geo: null as { latitude: number; longitude: number } | null,

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
    // The Keller Williams agent page was removed 2026-09-26 with the move to LPT
    // Realty: sameAs is a claim that a URL describes this same person TODAY,
    // and a former brokerage's page — likely soon a 404 — does not. Add the LPT
    // agent profile here once it exists, and make sure it links back to this
    // site: a visible link out plus one back is what merges the two into one
    // entity for search and answer engines.
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
   * The total commission the seller-proceeds view STARTS at, as a percentage of
   * the sale price.
   *
   * An assumption to be replaced, not a rate this site quotes or a claim about
   * what is typical. Since the 2024 NAR settlement, what a seller pays — and
   * whether any of it goes to the buyer's agent — is negotiated in the listing
   * agreement, and the input's hint says exactly that. It exists because a
   * proceeds figure that opens at 0% commission overstates what a seller keeps
   * by tens of thousands of dollars, which is the one error this calculator
   * must not make. The old /calculator opened at 6%.
   */
  assumedSellerCommissionRate: 5 as number,

  /**
   * The comparable-sales estimate on /search/<mls>.
   *
   * TWO SWITCHES, AND THEY EXIST FOR A RULE RATHER THAN FOR CONVENIENCE.
   *
   * NAR's IDX policy authorises automated valuations on an IDX display, and
   * separately permits MLS content to be used for "supporting appraisals and
   * evaluations, or developing market statistics". But a display showing an
   * automated estimate of value IN IMMEDIATE CONJUNCTION WITH A LISTING must be
   * disabled for that listing at the seller's request, communicated through the
   * MLS — and MLS PIN's feed carries no field telling us which sellers have
   * asked. So compliance depends entirely on a switch on this side, and a
   * switch that has to be written before it can be thrown is one that does not
   * exist when the request arrives.
   *
   * `enabled: false` withdraws the estimate sitewide in one deploy, for a rules
   * change or a bad backtest. `suppressedMls` withdraws it for one listing.
   * Committed rather than stored in a table on purpose: this has to work on a
   * day the database does not, and a compliance decision should be visible in a
   * diff with a date beside it.
   *
   * SUPPRESSION REMOVES THE NUMBER, NOT THE EVIDENCE. The comps, the range and
   * the chart stay — those are the market-statistics use the policy names
   * separately, and they are the part a reader actually learns from.
   *
   * !! NOT YET CHECKED against MLS PIN Rules & Regulations Attachment C, which
   * is behind the h3o login — the same caveat IdxDisclosure.tsx carries about
   * its own wording. Read Attachment C before this ships publicly; if it
   * prescribes a form of words or forbids the display outright, `enabled` is
   * how that is honoured the same afternoon.
   */
  valuation: {
    enabled: true,
    /** MLS numbers a seller has asked be excluded. Date each addition. */
    suppressedMls: [] as string[],
  },

  /**
   * Where the site READS sold listings from.
   *
   * 'supabase'   idx_listings (the rolling twelve months) and the seventeen-town
   *              archive. How it has always worked, and the state until the
   *              step below is taken.
   * 'cockroach'  the `sold-api` edge function over CockroachDB's idx_sold,
   *              which keeps every sale in every town. See soldApi.ts.
   *
   * THIS IS THE LAST STEP OF THE MOVE, NOT THE FIRST, and flipping it is the
   * only one that changes what a visitor sees:
   *
   *   1. The cluster exists and SOLD_DB_URL_RW / SOLD_DB_URL_RO are set.
   *   2. cockroach/schema has been applied.
   *   3. The archive has been imported and a full night of the sold sync has
   *      run, so the new table holds what the old ones do.
   *   4. Row counts match and `node scripts/valuation-backtest.ts` gives the
   *      same answer against it.
   *   5. This becomes 'cockroach'.
   *   6. A week later, the Supabase-side sold rows are removed.
   *
   * Flipping it back is safe at any time up to step 6.
   */
  soldData: {
    backend: 'supabase' as 'supabase' | 'cockroach',
  },

  /**
   * Towns served, used for schema `areaServed`, the sitemap, and the nearby-
   * towns cross-links. Slugs match the keys in src/data/neighborhoodData.ts
   * and the /neighborhoods/:slug route.
   *
   * ALSO MIRRORED IN SQL, in idx_archive_sold() — the archive is scoped to
   * these towns, so a town added here and not there is a town whose sales are
   * never archived, silently and unrecoverably a year later.
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

/**
 * A text to somebody ELSE, with the body already written — the showing
 * schedule's "Open in Messages", which opens Kevin's own phone or Mac with the
 * client and the itinerary filled in and leaves the sending to him.
 *
 * Same `?&body=` separator as `smsHrefWith`, for the same iOS/Android reason.
 * A ten-digit number gets +1; anything else is passed through as digits, which
 * is the most a handler can be asked to make sense of.
 */
const smsNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10
    ? `+1${digits}`
    : digits.length === 11 && digits[0] === '1'
      ? `+${digits}`
      : digits;
};

export const smsHrefTo = (phone: string, body: string) =>
  `sms:${smsNumber(phone)}?&body=${encodeURIComponent(body)}`;

/**
 * One text to SEVERAL people — a tour for a couple, opened as a single group
 * message instead of the same schedule sent twice.
 *
 * There is no one form of this that every phone reads. RFC 5724 puts the
 * recipients in a comma-separated list, which is what Android's handlers
 * follow. Apple's Messages takes only the first number from that and wants
 * `sms://open?addresses=` instead — a form Apple does not document, so it is
 * the one link on the showings page that could stop working without anything
 * here changing. That is why the per-person links and Copy stay beside it.
 *
 * `apple` is passed in rather than sniffed here: this module is imported during
 * static generation, where there is no `navigator` to ask.
 */
export const smsHrefToGroup = (phones: string[], body: string, apple: boolean) => {
  const list = phones.map(smsNumber).join(',');
  return apple
    ? `sms://open?addresses=${list}&body=${encodeURIComponent(body)}`
    : `sms:${list}?&body=${encodeURIComponent(body)}`;
};

/**
 * "Newton, MA" — where Kevin is based.
 *
 * Replaced `formattedAddress` and `mapsHref` on 2026-09-26. There is no office
 * to print or to map any more (see SITE.address), and a map pin dropped on the
 * middle of Newton would imply a place of business that does not exist.
 */
export const locality = `${SITE.address.addressLocality}, ${SITE.address.addressRegion}`;

/**
 * The service-area line shown wherever an office address used to be.
 *
 * Rendered in capitals at every site that prints it (footer, /contact, the
 * homepage contact block) — by the `uppercase` class, not by upper-casing the
 * string, so a screen reader and a crawler still get "Newton, MA" as words
 * rather than a run of letters to spell out.
 */
export const serviceAreaLine = `Based in ${locality} · Serving Greater Boston and MetroWest`;
