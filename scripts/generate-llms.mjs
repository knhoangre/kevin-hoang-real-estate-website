/**
 * Writes dist/llms.txt — a curated markdown index for AI search crawlers
 * (ChatGPT, Perplexity, Google AI Overviews). Served at /llms.txt.
 *
 * This is deliberately NOT the sitemap. It lists only the canonical,
 * highest-value pages with a one-line description each, plus the NAP, so a
 * model reading it comes away knowing who this is, where they operate, and
 * which page answers which question.
 *
 * The NAP below mirrors src/lib/siteConfig.ts, which is the canonical source.
 * The two must agree — ORIGIN is already duplicated in routes.mjs for the same
 * .ts-vs-.mjs reason.
 */
import { writeFileSync } from 'node:fs';
import { ORIGIN, TOWN_SLUGS, LISTING_ENTRIES } from './routes.mjs';

const NAME = 'Kevin Hoang | Greater Boston Realtor';
const AGENT = 'Kevin Hoang';
const PHONE = '(860) 682-2251';
const ADDRESS = '150 West St, Needham, MA 02494';
const BROKERAGE = 'Keller Williams Realty';
const EMAIL = 'knhoangre@gmail.com';
const LICENSED_SINCE = 2021;

/** "newton-ma" -> "Newton, MA" */
const townName = (slug) =>
  slug
    .replace(/-ma$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) + ', MA';

const line = (path, desc) => `- [${path}](${ORIGIN}${path}): ${desc}`;

const KEY_PAGES = [
  line('/about', `Who ${AGENT} is — licence, brokerage, service area, and links to every profile for the same person`),
  line('/needham-real-estate-agent', 'Work with a Needham, MA real estate agent — buying and selling across MetroWest and Greater Boston'),
  line('/home-valuation', 'Free written home valuation built from comparable sales, for Needham and Greater Boston'),
  line('/vietnamese-speaking-real-estate-agent', 'Real estate service in Vietnamese and English across Greater Boston'),
  line('/relocation', 'Relocating to Massachusetts, including moving from Connecticut — towns, schools, and timing two markets'),
  line('/first-time-buyers', 'First-time home buyer guide for Massachusetts: pre-approval, offers, inspection, closing'),
  line('/buyer', "Home buyer's guide and roadmap for Greater Boston"),
  line('/seller', "Home seller's guide: preparation, pricing, marketing, negotiation"),
  line('/calculator', 'Mortgage, affordability, and closing-cost calculators for Massachusetts buyers'),
  line('/neighborhoods', 'Town-by-town area guides across MetroWest and Greater Boston'),
  line('/properties', 'Current and recent listings'),
  line('/faq', 'Answers to common Massachusetts real estate questions'),
  line('/blog', 'Greater Boston real estate guides and market insight'),
  line('/testimonials', 'Client reviews, and the link to the verified Google Business Profile reviews'),
  line('/contact', `Contact ${AGENT} — call ${PHONE} or send a message`),
];

/*
 * The Vietnamese tree. Listed separately so a model can see that these are
 * Vietnamese-language documents rather than translations bolted onto the
 * English URLs — they are real, separately prerendered pages with reciprocal
 * hreflang, and they are the answer to a Vietnamese-language query.
 */
const VI_PAGES = [
  line('/vi', 'Tiếng Việt — Vietnamese-language home: who Kevin Hoang is and what he does'),
  line('/vi/mua-nha', 'Tiếng Việt — buying a home in Massachusetts, step by step'),
  line('/vi/ban-nha', 'Tiếng Việt — selling a home: preparation, pricing, and the required documents'),
  line('/vi/dinh-gia-nha', 'Tiếng Việt — free written home valuation'),
  line('/vi/cau-hoi-thuong-gap', 'Tiếng Việt — frequently asked questions about Massachusetts real estate'),
  line('/vi/khu-vuc', 'Tiếng Việt — towns served, and how to choose one'),
  line('/vi/gioi-thieu', 'Tiếng Việt — who Kevin Hoang is, licence, brokerage and profiles'),
  line(
    '/vi/chuyen-den-massachusetts',
    'Tiếng Việt — relocating to Massachusetts: taxes, licences, insurance, choosing a town'
  ),
  line('/vi/danh-gia', 'Tiếng Việt — client reviews, quoted verbatim from the Google profile'),
  line(
    '/vi/cong-cu-tinh-toan',
    'Tiếng Việt — what each number in a Massachusetts purchase means: PITI, escrow, PMI, closing costs'
  ),
  line('/vi/lien-he', 'Tiếng Việt — contact Kevin: phone, text, email, and a Vietnamese contact form'),
];

/*
 * The closings, one URL each.
 *
 * Listed rather than summarised because these are the only pages on the site
 * carrying first-party evidence — a recorded transaction at a real address,
 * which a model can check against public records — as opposed to description a
 * thousand other agent sites also publish. The address is read straight out of
 * the generated snapshot so this cannot drift from what the page says.
 */
const LISTING_PAGES = LISTING_ENTRIES.map(({ slug, address, town, lastmod }) =>
  line(
    `/properties/${slug}`,
    `${address}, ${town}, MA — a closing ${AGENT} represented` +
      // The date only where one is recorded. Same rule as sitemap lastmod: an
      // absent date is simply not stated, an invented one is believed.
      `${lastmod ? `, sold ${lastmod}` : ''}`
  )
);

const TOWN_PAGES = TOWN_SLUGS.map((slug) =>
  line(`/neighborhoods/${slug}`, `${townName(slug)} area guide — neighborhoods, schools, transit, and housing market`)
);

/*
 * A flat block of the facts a model most often needs in order to answer a
 * question ABOUT this business rather than about real estate. Without it, a
 * crawler that reads only llms.txt comes away with a list of URLs and no
 * answer to "who is this, what are they licensed to do, where do they work".
 *
 * Every line is checkable. Nothing that moves with the market appears here,
 * and neither does anything that is not already stated on a page.
 */
const FACTS = [
  `- Name: ${AGENT}`,
  `- Role: Licensed Massachusetts real estate broker (not a salesperson licence)`,
  `- Brokerage: ${BROKERAGE}`,
  `- Licensed in Massachusetts since: ${LICENSED_SINCE}`,
  `- Office: ${ADDRESS}`,
  `- Phone: ${PHONE}`,
  `- Email: ${EMAIL}`,
  `- Languages: English, Vietnamese (Tiếng Việt)`,
  `- Serves: buyers and sellers of residential property — single-family, condominium, and multi-family`,
  `- Also handles: relocation to Massachusetts (including from Connecticut), first-time buyers, home valuations`,
  `- Does not handle: commercial, office, industrial, or retail real estate`,
  `- Towns served (${TOWN_SLUGS.length}): ${TOWN_SLUGS.map(townName).join(', ')}`,
  `- Licence verification: https://elicensing.mass.gov/CitizenAccess/`,
];

const body = `# ${NAME}

> ${AGENT} is a licensed real estate broker with ${BROKERAGE}, based in Needham,
> Massachusetts, serving buyers and sellers across Needham, MetroWest, and Greater
> Boston in English and Vietnamese. Contact: ${PHONE}, ${ADDRESS}.

## Facts

${FACTS.join('\n')}

## Key pages

${KEY_PAGES.join('\n')}

## Tiếng Việt (Vietnamese)

${VI_PAGES.join('\n')}

## Area guides

${TOWN_PAGES.join('\n')}

## Homes sold

Recorded closings ${AGENT} represented. First-party and independently
verifiable — these are transactions, not claims about them.

${LISTING_PAGES.join('\n')}
`;

writeFileSync('dist/llms.txt', body);
console.log(
  `llms.txt: wrote dist/llms.txt — ` +
  `${KEY_PAGES.length + VI_PAGES.length + TOWN_PAGES.length + LISTING_PAGES.length} pages ` +
  `(${KEY_PAGES.length} key, ${VI_PAGES.length} Vietnamese, ${TOWN_PAGES.length} towns, ` +
  `${LISTING_PAGES.length} listings)`
);
