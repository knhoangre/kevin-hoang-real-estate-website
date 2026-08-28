import { Link } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import type { QA } from '@/lib/schema';

/**
 * Landing page for the highest-intent seller query ("what is my home worth",
 * "home valuation near me") — the SELLER INTENT axis.
 *
 * Headings here must not repeat those on /needham-real-estate-agent or
 * /seller; the three are meant to catch different queries.
 */
const FAQS: QA[] = [
  {
    question: 'How much does a home valuation cost?',
    answer:
      'Nothing. A valuation from an agent is a comparative market analysis, prepared in the hope of earning the listing. It is not an appraisal, which is ordered by a lender, performed by a licensed appraiser, and typically costs several hundred dollars.',
  },
  {
    question: 'How accurate are online home value estimates?',
    answer:
      'They are a starting point and nothing more. Automated estimates work from public records and past sales, so they cannot see the things that move a price most: condition, layout, what the kitchen and bathrooms actually look like, the direction the yard faces, road noise, or the renovation you did without pulling a permit. On unusual properties the gap can be very large in either direction.',
  },
  {
    question: 'What do you need from me to value my home?',
    answer:
      'The address is enough to start. Beyond that, the useful details are anything the public record will not show: work you have done and roughly when, known problems, whether there are tenants, and what your timeline looks like. A walkthrough — twenty minutes, in person — makes the number meaningfully more reliable.',
  },
  {
    question: 'Does getting a valuation commit me to listing?',
    answer:
      'No. Plenty of valuations are requested by people deciding whether to move at all, refinancing, settling an estate, or simply curious after a neighbour sold. There is no listing agreement attached to it.',
  },
  {
    question: 'How often should I have my home valued?',
    answer:
      'If you are not actively planning to sell, once every year or two is plenty to stay oriented. If you are within about six months of listing, get one at the start of that window — it is early enough that you can still act on what it says about repairs, timing, and preparation.',
  },
];

const HomeValuation = () => (
  <LandingPage
    path="/home-valuation"
    crumbs={[
      { name: 'Home', path: '/' },
      { name: 'Home Valuation', path: '/home-valuation' },
    ]}
    seo={{
      title: 'Free Home Valuation in Needham & Greater Boston',
      description:
        'Find out what your Greater Boston home is worth. A free, no-obligation written valuation built from comparable sales and a walkthrough — not an automated estimate.',
      keywords:
        'home valuation Needham MA, what is my home worth, free home valuation Greater Boston, comparative market analysis MA, house value Massachusetts',
    }}
    serviceMeta={{
      name: 'Comparative market analysis and home valuation',
      serviceType: 'Property valuation',
    }}
    hero={{
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=70',
      alt: 'A Massachusetts single-family home seen from the front walk',
    }}
    h1="What Is Your Home Worth?"
    lede="A written valuation, prepared from recent comparable sales in your own neighbourhood and a walkthrough of your property. It is free, it carries no obligation to list, and it is a real analysis rather than an automated guess."
    faqHeading="Questions about home valuations"
    faqs={FAQS}
    cta={{
      heading: 'Request your home valuation',
      body: 'Send the address and a little about the property, and you will get a written valuation back with the comparable sales it was built from.',
    }}
  >
    <h2>How is a home's value actually determined?</h2>
    <p>
      By what buyers have recently paid for comparable properties nearby — not by what you paid,
      not by what you have spent on improvements, and not by what you need to clear. That is the
      single most important thing to internalise before you set a price, and it is the reason
      valuations lead with comparable sales rather than with a formula.
    </p>
    <p>A comparative market analysis weighs three groups of properties:</p>
    <ul>
      <li>
        <strong>Recent sales</strong> — what comparable homes actually closed at, which is the
        anchor for everything else.
      </li>
      <li>
        <strong>Active listings</strong> — what you would be competing against if you listed now.
      </li>
      <li>
        <strong>Expired and withdrawn listings</strong> — the prices the market already rejected,
        which is often the most instructive group of the three.
      </li>
    </ul>
    <p>
      Each comparable is then adjusted for the differences that matter: square footage, lot,
      condition, layout, parking, and how long ago it sold.
    </p>

    <h2>Why an automated estimate is only a starting point</h2>
    <p>
      Automated valuation models work from assessor records and past transactions. They have no way
      to see condition, and condition is frequently the largest single variable in a price. Two
      houses with identical public records — same year, same square footage, same lot — can be
      separated by a very wide margin once you have stood in both of them.
    </p>
    <p>
      They also struggle with anything atypical: multi-families, homes on unusual lots, properties
      that have been expanded, and neighbourhoods with few recent sales to learn from.
    </p>

    <h2>What you get back</h2>
    <ul>
      <li>A supported price range, with the reasoning behind it.</li>
      <li>The specific comparable sales used, so you can check the logic yourself.</li>
      <li>What is selling and what is sitting at your price point right now.</li>
      <li>Which repairs or preparation are likely to return more than they cost — and which are not.</li>
    </ul>

    <h2>When is the right time to ask?</h2>
    <p>
      Earlier than most people do. If you are thinking about selling within the next year, a
      valuation now tells you which projects are worth starting and which are not — a decision that
      is much harder to unwind once you have already spent the money. It is also worth doing when
      you are refinancing, settling an estate, or reassessing after a nearby sale.
    </p>
    <p>
      Once you have a number, the <Link to="/seller">seller's guide</Link> covers preparation,
      marketing, and negotiation, and the <Link to="/calculator">calculators</Link> will help you
      work out what you would net.
    </p>
  </LandingPage>
);

export default HomeValuation;
