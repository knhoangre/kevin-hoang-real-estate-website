import { Link } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import type { QA } from '@/lib/schema';

/**
 * Landing page for the LANGUAGE axis — "Vietnamese-speaking real estate agent",
 * "môi giới nhà đất", and their variants.
 *
 * Framing rule, and it is load-bearing: Vietnamese is an ADDITIONAL service,
 * not a specialization. Every section that raises it also states that clients
 * of every background are served. Do not edit that framing away — a page that
 * reads as "only for Vietnamese clients" narrows the practice rather than
 * widening it.
 *
 * This page exists because the site's language toggle is client-side only: no
 * crawler has ever seen the Vietnamese content behind it. A prerendered page is
 * how that content becomes findable without duplicating every URL.
 */
const FAQS: QA[] = [
  {
    question: 'Can I do the whole home purchase in Vietnamese?',
    answer:
      'The conversations, yes — showings, strategy, negotiation, and the explanation of every document you are asked to sign. The contracts themselves are executed in English, because that is what is legally operative in Massachusetts. The point of working in Vietnamese is that you understand exactly what you are signing before you sign it, not that the paperwork changes.',
  },
  {
    question: 'Tôi có thể trao đổi bằng tiếng Việt không?',
    answer:
      'Có. Bạn có thể gọi, nhắn tin hoặc gặp trực tiếp bằng tiếng Việt, và mọi giấy tờ sẽ được giải thích bằng tiếng Việt trước khi bạn ký. Hợp đồng vẫn được lập bằng tiếng Anh theo quy định của tiểu bang Massachusetts.',
  },
  {
    question: 'I am buying my first home in the US. What is different here?',
    answer:
      'Three things surprise most first-time buyers who did not grow up in the US system: how central the pre-approval is — you generally cannot make a credible offer without one; how much weight the inspection carries as a negotiating point rather than a formality; and how much of the transaction runs through attorneys, which is standard practice in Massachusetts. None of it is difficult once someone walks you through it in a language you think in.',
  },
  {
    question: 'Do you only work with Vietnamese-speaking clients?',
    answer:
      'No. Kevin works with buyers and sellers of every background across Needham, MetroWest, and Greater Boston. Vietnamese is offered in addition to English because it removes a real barrier for the families it applies to — it is not a restriction on who the practice serves.',
  },
  {
    question: 'Can you help family members who are buying together?',
    answer:
      'Yes, and it is common. Multi-generational purchases raise real questions — how the property is titled, who is on the loan, whether a two-family or a home with an in-law setup fits better than a single-family. Those are worth working through before you start touring, not after you have found something.',
  },
];

const VietnameseAgent = () => (
  <LandingPage
    path="/vietnamese-speaking-real-estate-agent"
    crumbs={[
      { name: 'Home', path: '/' },
      {
        name: 'Vietnamese-Speaking Agent',
        path: '/vietnamese-speaking-real-estate-agent',
      },
    ]}
    seo={{
      title: 'Vietnamese-Speaking Real Estate Agent in Greater Boston',
      description:
        'Buy or sell a home in Needham and Greater Boston with an agent who works in Vietnamese and English. Môi giới nhà đất nói tiếng Việt tại Boston. Call (860) 682-2251.',
      keywords:
        'Vietnamese speaking real estate agent Boston, Vietnamese realtor Massachusetts, môi giới nhà đất Boston, mua nhà Massachusetts, bilingual real estate agent Greater Boston',
    }}
    serviceMeta={{
      name: 'Real estate representation in Vietnamese and English',
      serviceType: 'Bilingual real estate agency services',
    }}
    h1="Vietnamese-Speaking Real Estate Agent in Greater Boston"
    lede="Kevin Hoang works with buyers and sellers in Vietnamese and in English across Needham, MetroWest, and Greater Boston. Every document is explained in the language you are most comfortable in before you sign anything."
    faqHeading="Câu hỏi thường gặp — common questions"
    faqs={FAQS}
    cta={{
      heading: 'Nói chuyện với Kevin bằng tiếng Việt',
      body: 'Gọi điện, nhắn tin, hoặc gửi tin nhắn — bằng tiếng Việt hoặc tiếng Anh, tùy bạn. Call or write in whichever language you prefer.',
    }}
  >
    <h2>Where does language actually make a difference?</h2>
    <p>
      Not in the house tours. It matters in the three or four moments where a misunderstanding is
      expensive and irreversible:
    </p>
    <ul>
      <li>
        <strong>The offer.</strong> Contingencies, deadlines, and deposit terms are what you are
        actually agreeing to. Waiving the wrong one to win a bid is a decision you should make
        knowingly.
      </li>
      <li>
        <strong>The inspection report.</strong> Forty pages describing everything imperfect about a
        house, most of it routine. Knowing which three items are worth reopening the negotiation
        over is the whole skill.
      </li>
      <li>
        <strong>The loan.</strong> Rate, points, escrow, and mortgage insurance all interact, and
        the monthly payment is not the only number that matters.
      </li>
      <li>
        <strong>Disclosures.</strong> In Massachusetts, lead paint disclosure is required for homes
        built before 1978 — which is a large share of the housing stock in these towns.
      </li>
    </ul>
    <p>
      Working through those in Vietnamese is not about convenience. It is about you being able to
      ask the follow-up question you would actually ask.
    </p>

    <h2>Working with families buying their first home in the US</h2>
    <p>
      The Massachusetts process has some genuine differences from what people expect, especially
      around the role of attorneys and the weight the inspection carries. There is nothing
      difficult about any of it, but it goes much better when someone walks you through the whole
      sequence at the start rather than one deadline at a time.
    </p>
    <p>
      The <Link to="/first-time-buyers">first-time buyer guide</Link> lays out the full path, and
      the <Link to="/calculator">calculators</Link> will show you the real monthly cost of a given
      price. Clients of every background are welcome on all of it — this page exists to say the
      Vietnamese option is there, not to narrow who the practice is for.
    </p>

    <h2>Which towns does this cover?</h2>
    <p>
      The same towns as the rest of the practice: Needham and the surrounding MetroWest and Greater
      Boston communities, each with its own{' '}
      <Link to="/neighborhoods">written area guide</Link>. If you are arriving from out of state,
      the <Link to="/relocation">relocation page</Link> covers timing a move between two markets.
    </p>
    <p>
      For sellers, a <Link to="/home-valuation">written home valuation</Link> is the place to
      start, and it can be walked through in Vietnamese as well.
    </p>
  </LandingPage>
);

export default VietnameseAgent;
