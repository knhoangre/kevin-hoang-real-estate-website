/**
 * JSON-LD builders (schema.org).
 *
 * Pure functions with no React dependency, so build-time tooling can import
 * them too. Pass the results to <Seo jsonLd={...}>.
 *
 * Convention: the business is declared once, on the homepage, under the stable
 * @id `${origin}/#agent`. Every other page references that @id instead of
 * restating the whole entity — smaller payloads, and one place to fix mistakes.
 */
import { SITE, absoluteUrl, profileUrls } from './siteConfig';

const AGENT_ID = `${SITE.origin}/#agent`;
const WEBSITE_ID = `${SITE.origin}/#website`;
const PERSON_ID = `${SITE.origin}/#kevin`;

/** Drops keys whose value is null/undefined/empty-string/empty-array. */
const compact = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)
    )
  ) as T;

/**
 * openingHoursSpecification entries from SITE.hours. Empty while hours are
 * unset, so callers can spread the result and it contributes nothing.
 */
const openingHours = () =>
  SITE.hours.map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.days,
    opens: h.opens,
    closes: h.closes,
  }));

/** areaServed, shared by the agent node and every Service node. */
const areaServed = () =>
  SITE.areaServed.map((a) => ({ '@type': 'City', name: `${a.name}, MA` }));

/**
 * Kevin as a first-class Person entity with a stable @id, so BlogPosting
 * authorship and the agent's `employee` slot both reference ONE addressable
 * entity carrying his authority signals rather than a bare name string.
 *
 * Only encodes claims already published on the site. No invented credentials.
 */
export const person = () =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.agentName,
    url: SITE.origin,
    image: absoluteUrl('/kevin_hoang.jpg'),
    jobTitle: 'Real Estate Broker',
    worksFor: SITE.brokerage
      ? { '@type': 'Organization', name: SITE.brokerage }
      : undefined,
    knowsLanguage: SITE.languages,
    knowsAbout: [
      'Needham MA real estate',
      'Greater Boston real estate',
      'first-time home buyers',
      'Connecticut to Massachusetts relocation',
    ],
    sameAs: profileUrls,
  });

/**
 * The business itself. Homepage only.
 *
 * RealEstateAgent is a subtype of LocalBusiness, so this covers both. `geo` and
 * `openingHoursSpecification` are omitted entirely while their SITE values are
 * unset — absent is correct, wrong is actively harmful.
 */
export const realEstateAgent = () =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': AGENT_ID,
    name: SITE.name,
    description: SITE.description,
    url: SITE.origin,
    image: absoluteUrl(SITE.defaultOgImage),
    telephone: SITE.phoneE164,
    email: SITE.email,
    priceRange: '$$$',
    address: { '@type': 'PostalAddress', ...SITE.address },
    geo: SITE.geo
      ? {
          '@type': 'GeoCoordinates',
          latitude: SITE.geo.latitude,
          longitude: SITE.geo.longitude,
        }
      : undefined,
    areaServed: areaServed(),
    sameAs: profileUrls,
    knowsLanguage: SITE.languages,
    openingHoursSpecification: openingHours(),
    parentOrganization: SITE.brokerage
      ? { '@type': 'Organization', name: SITE.brokerage }
      : undefined,
    // References the standalone Person by @id rather than restating him, so
    // authorship elsewhere resolves to the same entity. person() must be
    // emitted on the SAME page for this reference to resolve — see Index.tsx.
    employee: { '@id': PERSON_ID },
  });

/**
 * Compact `#agent` node, for pages that REFERENCE the agent without being the
 * homepage.
 *
 * An `@id` reference only resolves against a node declared in the same
 * document. `blogPosting().publisher` and `service().provider` both point at
 * AGENT_ID, so without this every blog post and every service page carried a
 * dangling reference — 82 pages naming a publisher that consumers could not
 * resolve to anything. Emit this alongside them.
 *
 * Deliberately not the full realEstateAgent() node: repeating the address,
 * hours, and areaServed list on 82 pages is payload for no benefit. Name, url,
 * and logo are what a publisher reference actually needs to be useful.
 */
export const agentIdentity = () =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': AGENT_ID,
    name: SITE.name,
    url: SITE.origin,
    logo: absoluteUrl(SITE.defaultOgImage),
    telephone: SITE.phoneE164,
  });

/** Site-level entity. Homepage only, alongside realEstateAgent(). */
export const webSite = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE.origin,
  name: SITE.name,
  publisher: { '@id': AGENT_ID },
});

export interface Crumb {
  name: string;
  path: string;
}

/**
 * Breadcrumb trail. MUST mirror a visible <Breadcrumbs> trail on the same page
 * — marking up a trail the user cannot see is a structured-data policy
 * violation. Build both from the same array.
 */
export const breadcrumbs = (items: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export interface QA {
  question: string;
  answer: string;
}

/**
 * FAQPage markup. Answers must be plain text — strip any markup first — and
 * must be present in the rendered DOM (see FaqAccordion, which keeps collapsed
 * answers in the document rather than unmounting them).
 *
 * Kept for AI-search comprehension, not a SERP feature: Google removed FAQ
 * rich results in May 2026. Never build a page *for* that rich result.
 */
export const faqPage = (qas: QA[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: qas.map((qa) => ({
    '@type': 'Question',
    name: qa.question,
    acceptedAnswer: { '@type': 'Answer', text: qa.answer },
  })),
});

/**
 * A single service offered (buyer representation, seller representation, home
 * valuation, relocation). References the agent @id as provider rather than
 * restating the business.
 *
 * Like FAQPage, this is for entity understanding rather than a rich result.
 * Only encode services the page itself actually describes.
 */
export const service = (opts: {
  name: string;
  serviceType: string;
  description: string;
  path: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: opts.name,
  serviceType: opts.serviceType,
  description: opts.description,
  provider: { '@id': AGENT_ID },
  areaServed: areaServed(),
  url: absoluteUrl(opts.path),
});

export interface BlogPostLike {
  title: string;
  slug: string;
  /** ISO 8601. */
  datePublished: string;
  dateModified?: string | null;
  description: string;
  image?: string | null;
  author?: string | null;
}

export const blogPosting = (post: BlogPostLike) =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    // Google truncates headline past 110 characters.
    headline: post.title.slice(0, 110),
    description: post.description,
    image: post.image ? absoluteUrl(post.image) : absoluteUrl(SITE.defaultOgImage),
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    // When the author is Kevin (the default and the vast majority), reference
    // the Person @id so authorship resolves to the one entity carrying his
    // authority signals. BlogPost.tsx emits person() on the same page so the
    // reference resolves. A guest author falls back to a plain name node.
    author:
      (post.author ?? SITE.agentName) === SITE.agentName
        ? { '@id': PERSON_ID }
        : { '@type': 'Person', name: post.author },
    publisher: { '@id': AGENT_ID },
    inLanguage: 'en-US',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${post.slug}`),
    },
  });

/**
 * A plain ordered list (town guides, blog index, listings).
 *
 * Deliberately not RealEstateListing or Product: neither produces a rich result
 * for residential listings today, and Product markup on real estate is
 * off-label enough to risk a manual action. ItemList is honest and safe.
 */
export const itemList = (items: { name: string; url?: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  numberOfItems: items.length,
  itemListElement: items.map((item, i) =>
    compact({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: item.url ? absoluteUrl(item.url) : undefined,
    })
  ),
});

/*
 * Review / AggregateRating are intentionally NOT exported.
 *
 * Google disregards self-serving AggregateRating on an organization's own page
 * regardless of authenticity, and emitting testimonials that cannot be
 * independently attributed as machine-readable review claims carries
 * manual-action risk plus exposure under the FTC's Rule on Consumer Reviews and
 * Testimonials (16 CFR Part 465). Verified Google Business Profile reviews are
 * the correct vehicle.
 */
