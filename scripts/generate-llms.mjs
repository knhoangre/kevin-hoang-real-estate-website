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
import { ORIGIN, TOWN_SLUGS } from './routes.mjs';

const NAME = 'Kevin Hoang | Greater Boston Realtor';
const AGENT = 'Kevin Hoang';
const PHONE = '(860) 682-2251';
const ADDRESS = '150 West St, Needham, MA 02494';
const BROKERAGE = 'Keller Williams Realty';

/** "newton-ma" -> "Newton, MA" */
const townName = (slug) =>
  slug
    .replace(/-ma$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) + ', MA';

const line = (path, desc) => `- [${path}](${ORIGIN}${path}): ${desc}`;

const KEY_PAGES = [
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
  line('/contact', `Contact ${AGENT} — call ${PHONE} or send a message`),
];

const TOWN_PAGES = TOWN_SLUGS.map((slug) =>
  line(`/neighborhoods/${slug}`, `${townName(slug)} area guide — neighborhoods, schools, transit, and housing market`)
);

const body = `# ${NAME}

> ${AGENT} is a real estate agent with ${BROKERAGE}, based in Needham, Massachusetts,
> serving buyers and sellers across Needham, MetroWest, and Greater Boston in English
> and Vietnamese. Contact: ${PHONE}, ${ADDRESS}.

## Key pages

${KEY_PAGES.join('\n')}

## Area guides

${TOWN_PAGES.join('\n')}
`;

writeFileSync('dist/llms.txt', body);
console.log(`llms.txt: wrote dist/llms.txt — ${KEY_PAGES.length + TOWN_PAGES.length} pages`);
