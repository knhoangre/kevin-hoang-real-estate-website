import { useTranslation } from 'react-i18next';
import PageShell, { ShellSection, defaultStrip } from '@/components/PageShell';
import ProseBody from '@/components/ProseBody';
import SectionHeading from '@/components/SectionHeading';
import FaqAccordion from '@/components/FaqAccordion';
import { agentIdentity, faqPage, service, type Crumb, type QA } from '@/lib/schema';

/**
 * The half of a landing page that can be translated.
 *
 * Only the visible copy lives here — never the <Seo> block. The prerendered
 * HTML and the canonical must stay in English, because that is the language of
 * the query this URL is built to rank for; the translation is a courtesy to the
 * reader who is already on the page, not a second indexable document. Real
 * hreflang'd routes are the mechanism for that, and this is deliberately not
 * them.
 */
export interface LandingCopy {
  h1: string;
  lede: string;
  faqHeading: string;
  faqs: QA[];
  cta: { heading: string; body: string };
  body: React.ReactNode;
  /** Small label above the h1. Falls back to the last breadcrumb. */
  eyebrow?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  textLabel?: string;
  /** Credential-strip terms, in order: brokerage, licence, towns, languages. */
  stripLabels?: [string, string, string, string];
  /** Label on the CTA button that goes to /contact. */
  ctaButton?: string;
}

interface LandingPageProps {
  /** Route path, used for the canonical and the Service node's url. */
  path: string;
  crumbs: Crumb[];
  seo: { title: string; description: string; keywords: string };
  /** Service schema. Describes only what this page actually offers. */
  serviceMeta: { name: string; serviceType: string };
  /**
   * The page's <h1>. No two landing pages may share an h1 or an h2 string —
   * convergent pages compete for the same query and neither ranks. Check
   * against the BUILT html, since this shell contributes headings too.
   */
  h1: string;
  /** Answer-first: 1-3 sentences that directly answer the page's query. */
  lede: string;
  /** Heading above the FAQ block. Unique per page, for the same reason as h1. */
  faqHeading: string;
  faqs: QA[];
  cta: { heading: string; body: string };
  eyebrow?: string;
  /**
   * Cinematic hero image. Sized through Unsplash's params — a bare photo URL
   * serves the multi-megabyte original, and this is the LCP element on the
   * page it appears on.
   */
  hero: { image: string; alt: string };
  children: React.ReactNode;
  /**
   * Optional Vietnamese rendering of everything above. Supplied only by the
   * page whose audience actually reads it. Swapped in after mount when the
   * language toggle says `vi` — never during the first render, which has to
   * match the prerendered English HTML or hydration fails for the whole page.
   */
  vi?: LandingCopy;
}

/**
 * Shared shell for the commercial landing pages.
 *
 * Every one of them needs the same six things wired the same way — canonical,
 * breadcrumbs (visible AND in JSON-LD, from one array), Service + FAQPage
 * schema, an answer-first lede, in-DOM FAQ answers, and a contact CTA. Routing
 * that through one component is what stops the pages drifting apart as they get
 * edited individually.
 *
 * Layout note: `container px-4 mx-auto` with a `max-w-4xl` column, matching
 * /relocation, the blog posts and the town guides. These pages used to be a
 * narrower `max-w-3xl` with centred text, on their own padding scale, which is
 * why they read as a different site from every other page.
 */
const LandingPage = ({
  path,
  crumbs,
  seo,
  serviceMeta,
  h1,
  lede,
  faqHeading,
  faqs,
  cta,
  eyebrow,
  hero,
  children,
  vi,
}: LandingPageProps) => {
  const { i18n } = useTranslation();
  const useVi = Boolean(vi) && i18n.language?.startsWith('vi');
  const copy: LandingCopy = useVi
    ? (vi as LandingCopy)
    : { h1, lede, faqHeading, faqs, cta, body: children, eyebrow };

  return (
    <PageShell
      path={path}
      crumbs={crumbs}
      seo={seo}
      jsonLd={[
        // The English FAQs, always — the schema describes the canonical
        // document, which is the prerendered English one.
        faqPage(faqs),
        // service() names #agent as its provider, so #agent has to be declared
        // on this page for that reference to resolve.
        agentIdentity(),
        service({
          name: serviceMeta.name,
          serviceType: serviceMeta.serviceType,
          description: seo.description,
          path,
        }),
      ]}
      eyebrow={copy.eyebrow ?? eyebrow}
      h1={copy.h1}
      lede={copy.lede}
      hero={hero}
      heroSize="tall"
      width="prose"
      actionLabels={{
        primary: copy.ctaPrimary,
        secondary: copy.ctaSecondary,
        text: copy.textLabel,
      }}
      strip={defaultStrip(copy.stripLabels)}
      cta={{ heading: copy.cta.heading, body: copy.cta.body, button: copy.ctaButton }}
    >
      <ShellSection>
        <ProseBody>{copy.body}</ProseBody>
      </ShellSection>

      <ShellSection className="py-20 md:py-28 bg-bone border-y border-black/5">
        <SectionHeading className="mb-8">{copy.faqHeading}</SectionHeading>
        {/* Shared accordion: keeps collapsed answers in the DOM so the FAQPage
            markup above has real visible text backing it. */}
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-2 md:px-8 shadow-sm">
          <FaqAccordion faqs={copy.faqs} />
        </div>
      </ShellSection>
    </PageShell>
  );
};

export default LandingPage;
