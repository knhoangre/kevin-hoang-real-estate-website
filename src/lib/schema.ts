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
import { CHINESE_PARTNER, SITE, absoluteUrl, profileUrls } from './siteConfig';

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
    description: `Licensed Massachusetts real estate broker with ${SITE.brokerage}, based in ${SITE.address.addressLocality}, who came to real estate from ${SITE.background}.`,
    worksFor: SITE.brokerage
      ? { '@type': 'Organization', name: SITE.brokerage }
      : undefined,
    knowsLanguage: SITE.languages,
    // Each backed by pages a reader can see: the town guides, /about's
    // engineering section and the inspection posts, /market, /investments.
    knowsAbout: [
      'Newton MA real estate',
      'Greater Boston real estate',
      'home inspections and building systems',
      'Massachusetts housing market statistics',
      'real estate investment analysis',
      'first-time home buyers',
      'Connecticut to Massachusetts relocation',
    ],
    sameAs: profileUrls,
    // Born and raised there (SITE.roots); /about and /relocation say so.
    birthPlace: { '@type': 'State', name: SITE.roots.state },
  });

/**
 * Maggie Li, on the /zh pages. Her own @id, the one her site declares, so a
 * search engine reads this as the same person rather than a namesake.
 *
 * Standalone on purpose, with nothing referencing #agent: she is not an employee
 * of this business. `memberOf` is the one credential, because her site states it
 * and it can be checked with AREAA.
 */
export const partnerPerson = () =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': CHINESE_PARTNER.personId,
    name: CHINESE_PARTNER.name,
    url: CHINESE_PARTNER.website,
    image: absoluteUrl(CHINESE_PARTNER.photo),
    jobTitle: 'Real Estate Agent',
    telephone: CHINESE_PARTNER.phoneE164,
    email: CHINESE_PARTNER.email,
    worksFor: { '@type': 'Organization', name: CHINESE_PARTNER.brokerage },
    knowsLanguage: [...CHINESE_PARTNER.languages],
    memberOf: { '@type': 'Organization', name: 'Asian Real Estate Association of America' },
    areaServed: areaServed(),
    sameAs: CHINESE_PARTNER.profiles.map((profile) => profile.url),
  });

/**
 * Her business, under the @id her own site gives it, and the one thing a local
 * search engine looks for on a second site: her name, address and phone, the same
 * as everywhere else. Every field here is printed on /zh/maggie-li.
 */
export const partnerAgent = () =>
  compact({
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': CHINESE_PARTNER.agentId,
    name: CHINESE_PARTNER.teamName,
    url: CHINESE_PARTNER.website,
    image: absoluteUrl(CHINESE_PARTNER.photo),
    telephone: CHINESE_PARTNER.phoneE164,
    email: CHINESE_PARTNER.email,
    address: { '@type': 'PostalAddress', ...CHINESE_PARTNER.address },
    geo: { '@type': 'GeoCoordinates', ...CHINESE_PARTNER.geo },
    areaServed: areaServed(),
    knowsLanguage: [...CHINESE_PARTNER.languages],
    parentOrganization: { '@type': 'Organization', name: CHINESE_PARTNER.brokerage },
    employee: { '@id': CHINESE_PARTNER.personId },
    sameAs: CHINESE_PARTNER.profiles.map((profile) => profile.url),
  });

/** Says a /zh document is in Chinese, which hreflang alone says only in the head. */
export const zhWebPage = (opts: { path: string; name: string; description: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  url: absoluteUrl(opts.path),
  name: opts.name,
  description: opts.description,
  inLanguage: 'zh-Hans',
});

/**
 * A page that exists to describe one person: Google's ProfilePage. mainEntity is a
 * reference, so partnerPerson() has to be on the same page.
 */
export const profilePage = (opts: { path: string; name: string; personId: string; inLanguage?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  url: absoluteUrl(opts.path),
  name: opts.name,
  inLanguage: opts.inLanguage ?? 'zh-Hans',
  mainEntity: { '@id': opts.personId },
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
  /** @id of whoever provides it, declared on the same page. Defaults to Kevin. */
  provider?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: opts.name,
  serviceType: opts.serviceType,
  description: opts.description,
  provider: { '@id': opts.provider ?? AGENT_ID },
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
  /** Where the post lives, when it is not /blog/<slug> — the monthly market reports. */
  path?: string;
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
      '@id': absoluteUrl(post.path ?? `/blog/${post.slug}`),
    },
  });

/**
 * A landing page written and dated like an article: /relocation names Kevin as
 * its author and shows when it was last updated, so it says so here too. The
 * node a post gets, typed Article because the page is not a blog post. Emit
 * person() beside it, or the author reference has nothing to resolve to.
 */
export const guideArticle = (page: BlogPostLike & { path: string }) => ({
  ...blogPosting(page),
  '@type': 'Article',
});

/**
 * The contact page, as an addressable node that names the agent it contacts.
 *
 * /contact is the page carrying the full NAP — phone, email, postal address,
 * office hours — and it emitted nothing but breadcrumbs. For a local business
 * that page is the strongest corroboration of the citation, so it declares the
 * FULL agent node rather than the compact `agentIdentity()` reference: this is
 * one of only two places (with the homepage) where restating address, hours and
 * geo is worth the payload, because it is the page a consumer lands on when it
 * is specifically looking for how to reach the business.
 */
export const contactPage = (
  opts: { path: string; name: string; entity: string } = {
    path: '/contact',
    name: `Contact ${SITE.agentName}`,
    entity: AGENT_ID,
  }
) => ({
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  '@id': absoluteUrl(opts.path),
  url: absoluteUrl(opts.path),
  name: opts.name,
  mainEntity: { '@id': opts.entity },
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

/**
 * One sold home, for its /properties/<slug> page.
 *
 * `Accommodation` subtypes rather than `Product`/`Offer`, and the reasoning is
 * the same as the note on `itemList` above: neither yields a rich result for a
 * residential listing, and Product markup on real estate is off-label enough to
 * carry manual-action risk. What this node is actually for is letting a
 * retrieval engine understand that the page is about one specific dwelling at
 * one specific address — which is the whole reason the page exists.
 *
 * Every field is dropped when unknown. A listing with no square footage emits
 * no `floorSize` rather than a zero, because a zero is a claim.
 *
 * Deliberately NOT emitted: price. `offers` on a home that is already sold
 * describes something no longer purchasable, and structured data that
 * contradicts the visible "Sold" state is worse than none.
 */
const RESIDENCE_TYPES: Record<string, string> = {
  'single family': 'SingleFamilyResidence',
  condo: 'Apartment',
  condominium: 'Apartment',
  townhouse: 'House',
  'multi family': 'ApartmentComplex',
  'multi-family': 'ApartmentComplex',
};

export const residence = (listing: {
  address: string;
  town: string;
  zipCode: string;
  propertyType: string;
  bedrooms: number | null;
  fullBaths: number | null;
  halfBaths: number | null;
  livingArea: number | null;
  images: string[];
  slug: string;
  description: string | null;
}) =>
  compact({
    '@context': 'https://schema.org',
    // Falls back to the generic Residence rather than guessing at a subtype the
    // free-text property_type column does not actually establish.
    '@type': RESIDENCE_TYPES[listing.propertyType.trim().toLowerCase()] ?? 'Residence',
    name: `${listing.address}, ${listing.town}, MA`,
    description: listing.description ?? undefined,
    url: absoluteUrl(`/properties/${listing.slug}`),
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.town,
      addressRegion: 'MA',
      postalCode: listing.zipCode,
      addressCountry: 'US',
    },
    numberOfBedrooms: listing.bedrooms ?? undefined,
    numberOfFullBathrooms: listing.fullBaths ?? undefined,
    numberOfPartialBathrooms: listing.halfBaths ?? undefined,
    floorSize: listing.livingArea
      ? { '@type': 'QuantitativeValue', value: listing.livingArea, unitCode: 'FTK' }
      : undefined,
    photo: listing.images.slice(0, 6).map((src) => absoluteUrl(src)),
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

