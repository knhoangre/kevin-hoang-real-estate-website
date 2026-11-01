import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import ProseBody from '@/components/ProseBody';
import SectionHeading from '@/components/SectionHeading';
import FaqAccordion from '@/components/FaqAccordion';
import { faqPage, partnerAgent, partnerPerson, service, type QA } from '@/lib/schema';
import { CHINESE_PARTNER, SITE, partnerTelHref } from '@/lib/siteConfig';
import { pill } from '@/lib/pill';

/**
 * Landing page for "Chinese-speaking real estate agent" and "Mandarin-speaking
 * realtor", in English, because plenty of people search for one that way, or are
 * searching for a parent. It pairs with /zh/zhongwen-fuwu.
 *
 * Kevin does not speak Chinese and the page says so first. Every button reaches
 * Maggie Li, and she is named beside her own brokerage (254 CMR 3.09). Not built
 * on LandingPage, whose strip and buttons are Kevin's and would say so wrongly.
 *
 * Framing, from her own Mandarin page and the Vietnamese one: an added service,
 * not a specialization, and about language rather than who anyone is.
 */
const FAQS: QA[] = [
  {
    question: 'Is there a Mandarin-speaking real estate agent in Newton, MA?',
    answer: `Yes. ${CHINESE_PARTNER.name} of ${CHINESE_PARTNER.brokerage} works with buyers and sellers in Mandarin and English across Newton and Greater Boston, from ${CHINESE_PARTNER.addressLine}. Call ${CHINESE_PARTNER.phone} or email ${CHINESE_PARTNER.email}.`,
  },
  {
    question: 'Does Kevin Hoang speak Chinese?',
    answer: `No. Kevin works in English and Vietnamese. Clients who would rather work in Chinese are referred to ${CHINESE_PARTNER.name} of ${CHINESE_PARTNER.brokerage}, who works in Mandarin and English. They are at separate brokerages, and if you work with Maggie, she and her brokerage represent you.`,
  },
  {
    question: 'Which parts of a purchase can be handled in Mandarin?',
    answer:
      'Conversation, showings, offer strategy, negotiation, and walking through what a contract or disclosure actually says. The legal documents themselves are in English, because Massachusetts real estate contracts are executed in English, but nothing needs to be signed without it having been explained in the language you think in.',
  },
  {
    question: 'Can Maggie help someone buying from outside the United States?',
    answer:
      'Yes. Buying from abroad adds steps around financing, funds transfer, identification and timing, and usually means someone attends showings and the inspection on your behalf. She handles video tours and can represent you throughout when you cannot travel, and will say early where a step needs a lender, an attorney or a tax adviser rather than an agent.',
  },
  {
    question: 'Can I reach her on WeChat?',
    answer:
      'Yes. Her WeChat code is on the Chinese contact page and in the footer of every Chinese page on this site.',
  },
  {
    question: 'Does she only work with Chinese-speaking clients?',
    answer:
      'No. She works with buyers and sellers of every background. Mandarin is one more language she can work in, offered because it is useful to some clients, not because it narrows who she represents.',
  },
];

const ChineseAgent = () => {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Chinese-Speaking Service', path: '/chinese-speaking-real-estate-agent' },
  ];

  return (
    <PageShell
      path="/chinese-speaking-real-estate-agent"
      crumbs={crumbs}
      seo={{
        title: 'Chinese-Speaking Real Estate Agent in Greater Boston | Maggie Li',
        description: `Buy or sell in Newton and Greater Boston in Mandarin or English with ${CHINESE_PARTNER.name} of ${CHINESE_PARTNER.brokerage}. 波士顿中文地产经纪。Call ${CHINESE_PARTNER.phone}.`,
        keywords:
          'Chinese speaking real estate agent Boston, Mandarin speaking realtor Newton MA, Chinese realtor Massachusetts, 波士顿 地产经纪, 牛顿 房地产, Maggie Li real estate',
      }}
      jsonLd={[
        faqPage(FAQS),
        partnerPerson(),
        partnerAgent(),
        service({
          name: 'Real estate representation in Mandarin and English',
          serviceType: 'Bilingual real estate agency services',
          description: `${CHINESE_PARTNER.name} represents buyers and sellers in Mandarin and English across Greater Boston.`,
          path: '/chinese-speaking-real-estate-agent',
          provider: CHINESE_PARTNER.agentId,
        }),
      ]}
      eyebrow="中文 / Chinese"
      h1="Chinese-Speaking Real Estate Agent in Greater Boston"
      lede={`Kevin Hoang does not speak Chinese, so clients who would rather work in Chinese are referred to ${CHINESE_PARTNER.name} of ${CHINESE_PARTNER.brokerage}. She works with buyers and sellers in Mandarin and English across Newton and Greater Boston.`}
      hero={{
        image:
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=70',
        alt: 'A classic New England home at dusk in Greater Boston',
      }}
      heroSize="tall"
      actions={
        <>
          <a href={partnerTelHref} className={pill('white', 'lg', 'group')}>
            <Phone className="w-4 h-4" aria-hidden />
            Call Maggie {CHINESE_PARTNER.phone}
          </a>
          <a href={`mailto:${CHINESE_PARTNER.email}`} className={pill('ghost', 'lg', 'group')}>
            <Mail className="w-4 h-4" aria-hidden />
            {CHINESE_PARTNER.email}
          </a>
          <Link to="/zh" lang="zh-Hans" className={pill('gold', 'lg', 'group')}>
            中文页面
          </Link>
        </>
      }
      strip={[
        { term: 'Agent', value: CHINESE_PARTNER.name },
        { term: 'Brokerage', value: CHINESE_PARTNER.brokerage },
        { term: 'Based in', value: CHINESE_PARTNER.locality },
        { term: 'Languages', value: 'Mandarin · English' },
      ]}
      cta={{
        heading: 'Talk to Maggie',
        body: 'Call, text, email or WeChat, in Chinese or English. The first conversation commits you to nothing.',
        button: 'See every way to reach her',
        contact: {
          to: '/zh/lianxi',
          phone: CHINESE_PARTNER.phone,
          tel: partnerTelHref,
          email: CHINESE_PARTNER.email,
        },
      }}
    >
      <ShellSection>
        <ProseBody>
          <h2>Who is Maggie Li?</h2>
          <p>
            {CHINESE_PARTNER.name} of {CHINESE_PARTNER.teamName} is a real estate agent with{' '}
            {CHINESE_PARTNER.brokerage}, at {CHINESE_PARTNER.addressLine}. She works in Mandarin and
            English and serves on the board of the Asian Real Estate Association of America. Her own
            site is{' '}
            <a href={CHINESE_PARTNER.website} target="_blank" rel="noopener noreferrer">
              maggieli.co
            </a>
            , and <Link to="/zh/maggie-li" lang="zh-Hans">her page here</Link> is in Chinese.
          </p>

          <h2>How is this site connected to her?</h2>
          <p>
            This is the website of {SITE.agentName}, a Massachusetts broker with {SITE.brokerage}, who
            works in English and Vietnamese. He wants people who read Chinese to be able to use what is
            written here and to find someone who can help them in their own language. So the main pages
            and all {SITE.areaServed.length} town guides are available{' '}
            <Link to="/zh" lang="zh-Hans">in Chinese</Link>, with Maggie as the person to contact. They
            are at separate brokerages.
          </p>

          <h2>What can be done in Mandarin, and what cannot?</h2>
          <ul>
            <li>
              <strong>In Mandarin or English, your choice:</strong> consultations, showings, offer
              strategy, negotiation, and explaining what each document means before you sign it.
            </li>
            <li>
              <strong>In English:</strong> the legal documents themselves. Massachusetts purchase and
              sale agreements, disclosures and closing paperwork are executed in English, and that is
              not something an agent can change.
            </li>
            <li>
              <strong>Referrals where they are warranted:</strong> lenders, attorneys and tax advisers,
              including ones who also work in Mandarin, when a question is properly theirs.
            </li>
          </ul>

          <h2>Everyone is welcome</h2>
          <p>
            This page exists because people search for it, and because someone who would rather discuss
            a contract in Mandarin should be able to find out that they can. It is not a statement
            about who is welcome. Maggie represents buyers and sellers of every background, and
            everything else on this site is {SITE.agentName}&rsquo;s, in English and{' '}
            <Link to="/vietnamese-speaking-real-estate-agent">Vietnamese</Link>.
          </p>
        </ProseBody>
      </ShellSection>

      <ShellSection className="py-20 md:py-28 bg-bone border-y border-black/5">
        <SectionHeading className="mb-8">Questions about working in Chinese</SectionHeading>
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-2 md:px-8 shadow-sm">
          <FaqAccordion faqs={FAQS} />
        </div>
      </ShellSection>
    </PageShell>
  );
};

export default ChineseAgent;
