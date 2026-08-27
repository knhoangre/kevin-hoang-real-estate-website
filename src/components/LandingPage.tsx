import { Link } from 'react-router-dom';
import { Phone, CalendarDays, Mail, MessageSquare, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Seo from '@/components/Seo';
import BreadcrumbBar from '@/components/BreadcrumbBar';
import FaqAccordion from '@/components/FaqAccordion';
import { agentIdentity, breadcrumbs, faqPage, service, type Crumb, type QA } from '@/lib/schema';
import { SITE, telHref, smsHref } from '@/lib/siteConfig';

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
  children,
  vi,
}: LandingPageProps) => {
  const { i18n } = useTranslation();
  const useVi = Boolean(vi) && i18n.language?.startsWith('vi');
  const copy: LandingCopy = useVi
    ? (vi as LandingCopy)
    : { h1, lede, faqHeading, faqs, cta, body: children, eyebrow };

  const label = copy.eyebrow ?? eyebrow ?? crumbs[crumbs.length - 1]?.name;

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        jsonLd={[
          // Same `crumbs` array feeds the visible trail below. Marking up a
          // breadcrumb the user cannot see violates Google's guidelines.
          breadcrumbs(crumbs),
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
      />

      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white pt-28 pb-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <BreadcrumbBar items={crumbs} />

            {label && (
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 enter">
                {label}
              </p>
            )}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[#1a1a1a] enter"
              style={{ '--enter-delay': '0.05s' } as React.CSSProperties}
            >
              {copy.h1}
            </h1>
            <p
              className="mt-6 max-w-3xl text-xl leading-relaxed text-gray-600 enter"
              style={{ '--enter-delay': '0.1s' } as React.CSSProperties}
            >
              {copy.lede}
            </p>

            <div
              className="mt-8 flex flex-wrap gap-3 enter"
              style={{ '--enter-delay': '0.2s' } as React.CSSProperties}
            >
              <a
                href={telHref}
                className="inline-flex items-center gap-2 rounded-md bg-[#1a1a1a] px-6 py-3 font-medium text-white transition-colors hover:bg-black"
              >
                <Phone className="w-4 h-4" aria-hidden />
                {copy.ctaPrimary ?? `Call ${SITE.phone}`}
              </a>
              <a
                href={SITE.appointmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-[#1a1a1a] px-6 py-3 font-medium text-[#1a1a1a] transition-colors hover:bg-gray-100"
              >
                <CalendarDays className="w-4 h-4" aria-hidden />
                {copy.ctaSecondary ?? 'Book a consultation'}
              </a>
              <a
                href={smsHref}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <MessageSquare className="w-4 h-4" aria-hidden />
                Text
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-20 bg-white">
        <div className="container px-4 mx-auto">
          {/* The width cap lives on the wrapper, so `prose`'s own 65ch max-width
              does not fight it inside the same class list. */}
          <div className="max-w-4xl mx-auto enter">
            <div className="prose prose-lg max-w-none prose-headings:text-[#1a1a1a] prose-headings:font-bold prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-3xl prose-a:text-[#1a1a1a] prose-a:underline prose-a:decoration-gray-300 prose-a:underline-offset-4 hover:prose-a:decoration-[#1a1a1a] prose-li:marker:text-gray-400">
              {copy.body}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto enter">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-8">
              {copy.faqHeading}
            </h2>
            {/* Shared accordion: keeps collapsed answers in the DOM so the
                FAQPage markup above has real visible text backing it. */}
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-2 md:px-8 shadow-sm">
              <FaqAccordion faqs={copy.faqs} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA — the same slate band /relocation closes on. */}
      <section className="py-20 bg-slate-800 text-white">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center enter">
            <h2 className="text-3xl md:text-4xl font-bold">{copy.cta.heading}</h2>
            <p className="mt-4 mx-auto max-w-2xl text-lg leading-relaxed text-gray-200">
              {copy.cta.body}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-slate-800 transition-colors hover:bg-gray-100"
              >
                {useVi ? 'Gửi tin nhắn' : 'Send a message'}
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <a
                href={telHref}
                className="inline-flex items-center gap-2 rounded-md border border-white/40 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                <Phone className="w-4 h-4" aria-hidden />
                {SITE.phone}
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-2 rounded-md border border-white/40 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                <Mail className="w-4 h-4" aria-hidden />
                {SITE.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
