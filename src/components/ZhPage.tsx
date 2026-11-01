import { Link } from 'react-router-dom';
import { MessageCircle, MessageSquare, Phone } from 'lucide-react';
import PageShell, { ShellSection, type HeroSize, type ShellWidth } from '@/components/PageShell';
import ProseBody from '@/components/ProseBody';
import SectionHeading from '@/components/SectionHeading';
import FaqAccordion from '@/components/FaqAccordion';
import { faqPage, partnerAgent, partnerPerson, zhWebPage, type Crumb, type QA } from '@/lib/schema';
import { alternatesFor } from '@/lib/viRoutes';
import { CHINESE_PARTNER, SITE, partnerSmsHref, partnerTelHref } from '@/lib/siteConfig';
import { pill } from '@/lib/pill';

/**
 * Shared shell for the prerendered Chinese pages under /zh.
 *
 * ViPage's sibling, on the same PageShell, with one difference that decides
 * everything else: KEVIN DOES NOT SPEAK CHINESE. So the buttons, the phone number
 * and the closing band all reach Maggie Li, and no page in this tree may say that
 * Kevin will explain anything in Chinese. Say Maggie, or say nobody.
 *
 * Everything here is literal Chinese passed in as props, because i18n is pinned
 * to `lng: 'en'` during generation. Her phone and email come from CHINESE_PARTNER
 * and Kevin's name and brokerage from SITE; neither is ever retyped.
 *
 * The notice below is on every page on purpose. A reader lands on any one of
 * these from a search engine, on a site with someone else's name on it, and is
 * entitled to know whose site it is and who they would be talking to. It also
 * says the two are at separate brokerages, because they are. It says nothing
 * about referral fees (Kevin's decision, 2026-10-31).
 */
const ZH_CONTACT = {
  to: '/zh/lianxi',
  phone: CHINESE_PARTNER.phone,
  tel: partnerTelHref,
  email: CHINESE_PARTNER.email,
};

export interface ZhPageProps {
  /** This page's own path, used for the canonical and the hreflang set. */
  path: string;
  seo: {
    title: string;
    description: string;
    keywords?: string;
    ogImage?: string;
  };
  eyebrow: string;
  h1: string;
  /** Answer-first: two or three sentences answering the page's question. */
  lede: string;
  /** Visible trail, mirrored into BreadcrumbList. Defaults to home > eyebrow. */
  crumbs?: Crumb[];
  hero: { image: string; alt: string };
  heroSize?: HeroSize;
  heroAside?: React.ReactNode;
  children?: React.ReactNode;
  /** Optional, for a page whose questions are answered in its body. */
  faqHeading?: string;
  faqs?: QA[];
  /** Several headed question sets, for /zh/changjian-wenti. */
  faqGroups?: { heading: string; faqs: QA[] }[];
  /** `to` is for the contact page itself, whose button cannot lead back to it. */
  cta: { heading: string; body: string; button: string; to?: string };
  /** Label of the link to the English counterpart. */
  enLabel?: string;
  /** Full-width sections rendered after the prose body. */
  sections?: React.ReactNode;
  /** Page-specific schema, added to the FAQ and Maggie's Person node. */
  jsonLd?: object[];
  width?: ShellWidth;
}

const ZhPage = ({
  path,
  seo,
  eyebrow,
  h1,
  lede,
  crumbs,
  hero,
  heroSize = 'tall',
  heroAside,
  children,
  faqHeading,
  faqs = [],
  faqGroups = [],
  cta,
  enLabel,
  sections,
  jsonLd = [],
  width = 'prose',
}: ZhPageProps) => {
  const english = alternatesFor(path)?.en;
  const allFaqs = [...faqs, ...faqGroups.flatMap((group) => group.faqs)];
  // Her name in every result a Chinese page appears as, since that is the point
  // of this tree. A title with its own pipe has already said whose it is: the two
  // pages about Kevin do. Seo's own suffix would have said Kevin Hoang on all 32.
  const title = seo.title.includes('|') ? seo.title : `${seo.title} | ${CHINESE_PARTNER.name}`;

  return (
    <PageShell
      path={path}
      crumbs={
        crumbs ?? [
          { name: '首页', path: '/zh' },
          { name: eyebrow, path },
        ]
      }
      // The Chinese card with her photo, unless a page has its own. It is what a
      // link to any of these unfurls as, in WeChat as anywhere else.
      seo={{ ogImage: '/og-zh.jpg', ...seo, title, locale: 'zh_CN' }}
      jsonLd={[
        zhWebPage({ path, name: title, description: seo.description }),
        ...(allFaqs.length ? [faqPage(allFaqs)] : []),
        partnerPerson(),
        partnerAgent(),
        ...jsonLd,
      ]}
      eyebrow={eyebrow}
      h1={h1}
      lede={lede}
      hero={hero}
      heroSize={heroSize}
      heroAside={heroAside}
      width={width}
      actions={
        <>
          <a href={partnerTelHref} className={pill('white', 'lg', 'group')}>
            <Phone className="w-4 h-4" aria-hidden />
            致电 Maggie {CHINESE_PARTNER.phone}
          </a>
          <Link to="/zh/lianxi" className={pill('gold', 'lg', 'group')}>
            <MessageCircle className="w-4 h-4" aria-hidden />
            微信联系
          </Link>
          <a href={partnerSmsHref} className={pill('ghost', 'lg', 'group')}>
            <MessageSquare className="w-4 h-4" aria-hidden />
            发短信
          </a>
        </>
      }
      strip={[
        { term: '中文服务', value: CHINESE_PARTNER.name },
        { term: '经纪公司', value: CHINESE_PARTNER.brokerage },
        { term: '服务城镇', value: `大波士顿 ${SITE.areaServed.length} 个城镇` },
        { term: '语言', value: '普通话 · English' },
      ]}
      cta={{ ...cta, contact: { ...ZH_CONTACT, to: cta.to ?? ZH_CONTACT.to } }}
    >
      <ShellSection width={width}>
        <p className="mb-12 rounded-r-lg border-l-4 border-champagne bg-bone p-5 text-sm leading-relaxed text-gray-700">
          <strong className="text-ink">关于本站：</strong>
          这是 {SITE.agentName}（持牌房地产经纪人，{SITE.brokerage}）的网站。{SITE.agentName}{' '}
          不讲中文，所以需要中文服务的客户由{' '}
          <Link
            to="/zh/maggie-li"
            className="underline decoration-champagne decoration-2 underline-offset-4"
          >
            {CHINESE_PARTNER.name}
          </Link>
          （{CHINESE_PARTNER.brokerage}）直接服务。两人分属不同的经纪公司。
        </p>

        {children && <ProseBody>{children}</ProseBody>}

        {sections}

        {english && enLabel && (
          <p className="mt-14 border-t border-gray-200 pt-8 text-sm text-gray-500">
            英文版本：{' '}
            <Link
              to={english}
              lang="en"
              className="underline decoration-champagne decoration-2 underline-offset-4"
            >
              {enLabel}
            </Link>
          </p>
        )}
      </ShellSection>

      {faqs.length > 0 && faqHeading && (
        <ShellSection width={width} className="py-20 md:py-28 bg-bone border-y border-black/5">
          <SectionHeading className="mb-8">{faqHeading}</SectionHeading>
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-2 md:px-8 shadow-sm">
            <FaqAccordion faqs={faqs} />
          </div>
        </ShellSection>
      )}

      {faqGroups.length > 0 && (
        <ShellSection width={width} className="py-20 md:py-28 bg-bone border-y border-black/5">
          {faqGroups.map((group) => (
            <div key={group.heading} className="mb-14 last:mb-0">
              <SectionHeading className="mb-8">{group.heading}</SectionHeading>
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-2 md:px-8 shadow-sm">
                <FaqAccordion faqs={group.faqs} />
              </div>
            </div>
          ))}
        </ShellSection>
      )}
    </PageShell>
  );
};

export default ZhPage;
