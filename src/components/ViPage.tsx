import { Link } from 'react-router-dom';
import PageShell, { ShellSection, type ShellWidth } from '@/components/PageShell';
import ProseBody from '@/components/ProseBody';
import SectionHeading from '@/components/SectionHeading';
import FaqAccordion from '@/components/FaqAccordion';
import { agentIdentity, faqPage, person, type QA } from '@/lib/schema';
import { alternatesFor } from '@/lib/viRoutes';
import { SITE } from '@/lib/siteConfig';

/**
 * Shared shell for the prerendered Vietnamese pages under /vi.
 *
 * Deliberately NOT LandingPage with a `vi` prop. That component swaps its copy
 * after mount based on the i18n language, which is exactly the mechanism these
 * pages exist to replace — i18n is pinned to `lng: 'en'` during generation, so
 * anything assembled through useTranslation() prerenders in English no matter
 * what the reader has selected.
 *
 * Everything here is therefore literal Vietnamese, passed in as props. The only
 * values read from config are the ones that must be character-for-character
 * identical everywhere — the phone number, the email, the address. NAP does not
 * get translated.
 *
 * The chrome, however, is shared: this used to be a hand-copied duplicate of
 * LandingPage's markup, down to its own third breadcrumb design and a hero 8vh
 * shorter than the English one for no reason. Only the copy is different now.
 */
export interface ViPageProps {
  /** This page's own path, used for the canonical and the hreflang set. */
  path: string;
  seo: { title: string; description: string };
  eyebrow: string;
  h1: string;
  /** Answer-first: two or three sentences answering the page's question. */
  lede: string;
  /** Visible breadcrumb trail, in Vietnamese. Mirrored into BreadcrumbList. */
  crumbs: { name: string; path: string }[];
  hero: { image: string; alt: string };
  /**
   * Optional prose body. /vi/mua-nha and /vi/ban-nha have none, because their
   * English counterparts have none: the roadmap IS the content there, and a
   * numbered prose walkthrough above it restated the same eight steps twice on
   * one page.
   */
  children?: React.ReactNode;
  faqHeading: string;
  faqs: QA[];
  cta: { heading: string; body: string; button: string };
  /** Link back to the English counterpart, shown in the page body. */
  enLabel: string;
  /**
   * Full-width sections rendered after the prose body — the roadmap and the
   * resource grid, which are what the English buyer and seller guides are
   * mostly made of. A Vietnamese page that only carried prose was a different
   * document from its counterpart rather than a translation of it.
   */
  sections?: React.ReactNode;
  /**
   * `wide` for the pages carrying a roadmap: its sticky index sits beside the
   * steps, and at the prose measure the detail columns collapse to ~38
   * characters. Matches the English counterpart's own width.
   */
  width?: ShellWidth;
}

const ViPage = ({
  path,
  seo,
  eyebrow,
  h1,
  lede,
  crumbs,
  hero,
  children,
  faqHeading,
  faqs,
  cta,
  enLabel,
  sections,
  width = 'prose',
}: ViPageProps) => {
  const alternates = alternatesFor(path);

  return (
    <PageShell
      path={path}
      crumbs={crumbs}
      seo={{ title: seo.title, description: seo.description, locale: 'vi_VN' }}
      jsonLd={[
        faqPage(faqs),
        // Both declared here so the references inside them resolve on this
        // page — an @id only resolves against a node in the same document.
        agentIdentity(),
        person(),
      ]}
      eyebrow={eyebrow}
      h1={h1}
      lede={lede}
      hero={hero}
      heroSize="tall"
      width={width}
      // Phone and email still come from SITE. NAP has to be identical
      // character-for-character in every language; only the labels translate.
      actionLabels={{
        primary: `Gọi ${SITE.phone}`,
        secondary: 'Đặt lịch hẹn',
        text: 'Nhắn tin',
      }}
      strip={[
        { term: 'Công ty', value: SITE.brokerage },
        { term: 'Giấy phép', value: 'Broker tại MA' },
        { term: 'Thị trấn phục vụ', value: String(SITE.areaServed.length) },
        { term: 'Ngôn ngữ', value: 'Tiếng Việt · English' },
      ]}
      cta={{ heading: cta.heading, body: cta.body, button: cta.button }}
    >
      <ShellSection width={width}>
        {children && <ProseBody>{children}</ProseBody>}

        {sections}

        {alternates?.en && (
          <p className="mt-14 border-t border-gray-200 pt-8 text-sm text-gray-500">
            Reading in English?{' '}
            <Link
              to={alternates.en}
              className="underline decoration-champagne decoration-2 underline-offset-4"
            >
              {enLabel}
            </Link>
          </p>
        )}
      </ShellSection>

      <ShellSection width={width} className="py-20 md:py-28 bg-bone border-y border-black/5">
        <SectionHeading className="mb-8">{faqHeading}</SectionHeading>
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-2 md:px-8 shadow-sm">
          <FaqAccordion faqs={faqs} />
        </div>
      </ShellSection>
    </PageShell>
  );
};

export default ViPage;
