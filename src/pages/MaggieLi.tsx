import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import ProseBody from '@/components/ProseBody';
import SectionHeading from '@/components/SectionHeading';
import FaqAccordion from '@/components/FaqAccordion';
import { faqPage, partnerAgent, partnerPerson, profilePage, type QA } from '@/lib/schema';
import { CHINESE_PARTNER, SITE, partnerTelHref } from '@/lib/siteConfig';
import { pill } from '@/lib/pill';

/**
 * /maggie-li — who Maggie Li is, in English. Pairs with /zh/maggie-li, which had
 * no English partner until 2026-11-06, when Kevin asked for every row of the menu
 * to have all three languages.
 *
 * The PERSON, as /about is for Kevin; /chinese-speaking-real-estate-agent is the
 * LANGUAGE page and owns "Chinese-speaking agent". The two may not share a heading,
 * or they compete for one query and neither ranks.
 *
 * Only what her own site states plainly: Mandarin and English, the brokerage, her
 * office, the AREAA board seat. No Chinese name, since nothing records one, and
 * her rankings are left to her site. Every button reaches her, and her brokerage
 * is beside her name (254 CMR 3.09). Not built on LandingPage, whose strip and
 * buttons are Kevin's.
 */
const FAQS: QA[] = [
  {
    question: 'How do I reach Maggie Li?',
    answer: `Call ${CHINESE_PARTNER.phone} or email ${CHINESE_PARTNER.email}. Her office is at ${CHINESE_PARTNER.addressLine}, and her own site is maggieli.co. Her WeChat code is on the Chinese contact page.`,
  },
  {
    question: 'Which languages does Maggie work in?',
    answer: 'Mandarin and English.',
  },
  {
    question: 'Which towns does Maggie serve?',
    answer: `All ${SITE.areaServed.length} Greater Boston towns this site covers. Her own site also covers Arlington and the Boston neighborhoods of Back Bay, Beacon Hill and Fenway.`,
  },
];

const MaggieLi = () => {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Meet Maggie Li', path: '/maggie-li' },
  ];

  return (
    <PageShell
      path="/maggie-li"
      crumbs={crumbs}
      seo={{
        title: `Maggie Li, Real Estate Agent in Newton, MA | ${CHINESE_PARTNER.brokerage}`,
        description: `${CHINESE_PARTNER.name} is a real estate agent with ${CHINESE_PARTNER.brokerage} in Newton Centre, working with Greater Boston buyers and sellers in Mandarin and English. Call ${CHINESE_PARTNER.phone}.`,
        keywords: 'Maggie Li, Maggie Li realtor, Maggie Li William Raveis, Newton MA realtor Mandarin, Maggie Li & Co',
      }}
      jsonLd={[
        faqPage(FAQS),
        profilePage({
          path: '/maggie-li',
          name: `${CHINESE_PARTNER.name}, real estate agent in Newton, MA`,
          personId: CHINESE_PARTNER.personId,
          inLanguage: 'en',
        }),
        partnerPerson(),
        partnerAgent(),
      ]}
      eyebrow="Maggie Li"
      h1="Meet Maggie Li"
      lede={`${CHINESE_PARTNER.name} of ${CHINESE_PARTNER.teamName} is a real estate agent with ${CHINESE_PARTNER.brokerage}, with an office in Newton Centre. She works with buyers and sellers across Greater Boston in Mandarin and English.`}
      hero={{
        image:
          'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1920&q=70',
        alt: '',
      }}
      heroSize="standard"
      heroAside={
        <div className="aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl ring-1 ring-champagne/40">
          <img
            src={CHINESE_PARTNER.photo}
            alt={`${CHINESE_PARTNER.name}, real estate agent`}
            width={440}
            height={440}
            className="h-full w-full object-cover object-[center_20%]"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      }
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
        </>
      }
      strip={[
        { term: 'Team', value: CHINESE_PARTNER.teamName },
        { term: 'Brokerage', value: CHINESE_PARTNER.brokerage },
        { term: 'Office', value: CHINESE_PARTNER.address.addressLocality },
        { term: 'Languages', value: 'Mandarin · English' },
      ]}
      cta={{
        heading: 'Get in touch with Maggie',
        body: 'Call, text, email or WeChat, in Mandarin or English.',
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
          <h2>Maggie&rsquo;s details</h2>
          <ul>
            <li>
              <strong>Team:</strong> {CHINESE_PARTNER.teamName}
            </li>
            <li>
              <strong>Brokerage:</strong> {CHINESE_PARTNER.brokerage}
            </li>
            <li>
              <strong>Office:</strong> {CHINESE_PARTNER.addressLine}
            </li>
            <li>
              <strong>Languages:</strong> Mandarin, English
            </li>
            <li>
              <strong>Professional organization:</strong> board member, Asian Real Estate Association of America
              (AREAA)
            </li>
            <li>
              <strong>Phone:</strong> <a href={partnerTelHref}>{CHINESE_PARTNER.phone}</a>
            </li>
            <li>
              <strong>Email:</strong> <a href={`mailto:${CHINESE_PARTNER.email}`}>{CHINESE_PARTNER.email}</a>
            </li>
            <li>
              <strong>Website:</strong>{' '}
              <a href={CHINESE_PARTNER.website} target="_blank" rel="noopener noreferrer">
                maggieli.co
              </a>
              , with her sales and client reviews
            </li>
          </ul>

          <h2>Buying from abroad or from another state</h2>
          <p>
            Listings are easy to find online. What is hard from a distance is knowing which town fits, how long the
            commute really is, and how the purchase runs while you are not there. Maggie can tour homes with you by
            video, attend showings and the inspection on your behalf, and say early which steps take longer from
            abroad: financing, moving funds, identification and timing.
          </p>
          <p>
            What can be done in Mandarin, and what stays in English, is on the{' '}
            <Link to="/chinese-speaking-real-estate-agent">Chinese-speaking agent</Link> page. Maggie&rsquo;s page is
            also <Link to="/zh/maggie-li" lang="zh-Hans">in Chinese</Link> and{' '}
            <Link to="/vi/maggie-li" lang="vi">in Vietnamese</Link>.
          </p>

          <h2>Maggie Li elsewhere online</h2>
          <ul>
            {CHINESE_PARTNER.profiles.map((profile) => (
              <li key={profile.url}>
                <a href={profile.url} target="_blank" rel="noopener noreferrer">
                  {profile.name}
                </a>
              </li>
            ))}
          </ul>
        </ProseBody>
      </ShellSection>

      <ShellSection className="py-20 md:py-28 bg-bone border-y border-black/5">
        <SectionHeading className="mb-8">Questions about Maggie</SectionHeading>
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-2 md:px-8 shadow-sm">
          <FaqAccordion faqs={FAQS} />
        </div>
      </ShellSection>
    </PageShell>
  );
};

export default MaggieLi;
