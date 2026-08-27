import { Link } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import type { QA } from '@/lib/schema';
import { SITE } from '@/lib/siteConfig';

/**
 * Transactional landing page for "Needham MA real estate agent" and its
 * variants — the INTENT axis ("who do I hire"), and the hub that links out to
 * the other landing pages.
 *
 * Deliberately distinct from the informational town guide at
 * /neighborhoods/needham-ma. No heading on this page may be reused there, or
 * the two compete for the same query and neither ranks.
 */
const FAQS: QA[] = [
  {
    question: 'How do I choose a real estate agent in Needham?',
    answer:
      'Ask three things: how well they know the specific streets and school districts you care about, how they plan to price or bid in the conditions you are actually facing, and who you will be talking to day to day. Needham is a small enough market that an agent working it regularly will recognise most listings on sight and know the history behind them. Ask for the reasoning behind a price, not just the number.',
  },
  {
    question: 'What areas does Kevin Hoang cover?',
    answer:
      `Needham and the surrounding MetroWest and Greater Boston towns: ${SITE.areaServed
        .map((a) => a.name)
        .join(', ')}. Town-by-town guides for each are published on this site.`,
  },
  {
    question: 'Do I need an agent to buy a home, and who pays for one?',
    answer:
      'You are not required to use one, but a buyer working without representation is negotiating against a professional who represents the seller. How buyer-side compensation is structured changed across the industry in 2024, and it is now negotiated and set out in a written buyer agreement before you tour homes. Ask any agent to walk you through their agreement line by line before you sign it.',
  },
  {
    question: 'How long does it take to buy or sell a home in Massachusetts?',
    answer:
      'From accepted offer to closing, a financed purchase in Massachusetts commonly runs about six to eight weeks, driven mostly by the lender. Before that, the search or the listing preparation is the variable part and depends entirely on your price point, your flexibility, and how much work the property needs. Anyone quoting you a firm timeline before seeing the property is guessing.',
  },
  {
    question: 'What is the first step if I am just starting to think about moving?',
    answer:
      'A conversation, not a contract. For sellers that usually means a walkthrough and a written valuation so you know what you are working with. For buyers it means a lender conversation first, because your pre-approval sets the search. Neither commits you to anything.',
  },
];

const NeedhamAgent = () => (
  <LandingPage
    path="/needham-real-estate-agent"
    crumbs={[
      { name: 'Home', path: '/' },
      { name: 'Needham Real Estate Agent', path: '/needham-real-estate-agent' },
    ]}
    seo={{
      title: 'Needham MA Real Estate Agent | Kevin Hoang',
      description:
        'Buying or selling in Needham, MA? Kevin Hoang is a Needham-based licensed broker with Keller Williams Realty serving MetroWest and Greater Boston. Call (860) 682-2251.',
      keywords:
        'Needham MA real estate agent, Needham realtor, sell my house Needham MA, Needham buyers agent, MetroWest real estate agent, Greater Boston realtor',
    }}
    serviceMeta={{
      name: 'Residential real estate representation in Needham, MA',
      serviceType: 'Real estate agency services',
    }}
    hero={{
      image:
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1920&q=70',
      alt: 'A single-family home on a tree-lined street in Needham, Massachusetts',
    }}
    h1="Needham, MA Real Estate Agent"
    lede="Kevin Hoang is a Needham-based licensed real estate broker with Keller Williams Realty, working with buyers and sellers across Needham, MetroWest, and Greater Boston — in English and Vietnamese."
    faqHeading="Needham real estate questions"
    faqs={FAQS}
    cta={{
      heading: 'Talk to a Needham real estate agent',
      body: 'No pressure and no obligation — a first conversation is just a conversation about what you are trying to do and whether the timing works.',
    }}
  >
    <h2>What does an agent actually do for you?</h2>
    <p>
      Most of the value is concentrated in a handful of moments: setting the number, structuring
      the offer or the response to one, and handling what the inspection turns up. The tours and
      the paperwork are the visible part of the job, but they are not the part that changes your
      outcome by tens of thousands of dollars.
    </p>
    <p>
      Kevin came to real estate from mechanical and software engineering, and that shows up in how
      properties get assessed — reading what a building is actually telling you about its condition,
      and working from the comparable-sales data rather than from a feeling about the market.
    </p>

    <h2>Buying a home in the Needham area</h2>
    <p>
      Start with the lender, not the listings. A pre-approval sets your real search range and makes
      your offer credible; without one you are touring homes you may not be able to write on. From
      there the work is narrowing the towns, reading each property honestly, and structuring an
      offer that competes without exposing you.
    </p>
    <p>
      If you are buying your first home, the{' '}
      <Link to="/first-time-buyers">first-time buyer guide</Link> walks through the whole sequence,
      and the <Link to="/calculator">mortgage calculators</Link> will give you a realistic monthly
      number before you talk to anyone.
    </p>

    <h2>Selling a home in the Needham area</h2>
    <p>
      Pricing is the decision that determines everything downstream. An overpriced listing goes
      stale, and a stale listing eventually sells for less than a correctly priced one would have.
      The preparation work — what to fix, what to leave, what to disclose up front — is where the
      rest of the return is.
    </p>
    <p>
      Start with a <Link to="/home-valuation">written home valuation</Link>, then read the{' '}
      <Link to="/seller">seller's guide</Link> for how the rest of the process runs.
    </p>

    <h2>Where else does Kevin work?</h2>
    <p>
      Needham is home base, but the practice covers MetroWest and Greater Boston more broadly.
      There is a written guide for each town — schools, transit, housing stock, and what the market
      there is actually like:
    </p>
    <ul>
      {SITE.areaServed.map((town) => (
        <li key={town.slug}>
          <Link to={`/neighborhoods/${town.slug}`}>{town.name}, MA area guide</Link>
        </li>
      ))}
    </ul>

    <h2>Moving to Massachusetts from out of state?</h2>
    <p>
      Kevin made the Connecticut-to-Massachusetts move himself, so the relocation side of this —
      timing two housing markets against each other, learning which towns actually fit how you
      live — is familiar territory. That is covered separately on the{' '}
      <Link to="/relocation">relocation page</Link>.
    </p>
  </LandingPage>
);

export default NeedhamAgent;
