import { Link } from 'react-router-dom';
import { Phone, CalendarDays } from 'lucide-react';
import Seo from '@/components/Seo';
import BreadcrumbBar from '@/components/BreadcrumbBar';
import FaqAccordion from '@/components/FaqAccordion';
import { agentIdentity, breadcrumbs, faqPage, service, type Crumb, type QA } from '@/lib/schema';
import { SITE, telHref } from '@/lib/siteConfig';

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
  children: React.ReactNode;
}

/**
 * Shared shell for the commercial landing pages.
 *
 * Every one of them needs the same six things wired the same way — canonical,
 * breadcrumbs (visible AND in JSON-LD, from one array), Service + FAQPage
 * schema, an answer-first lede, in-DOM FAQ answers, and a contact CTA. Routing
 * that through one component is what stops the pages drifting apart as they get
 * edited individually.
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
  children,
}: LandingPageProps) => (
  <div className="min-h-screen bg-white pt-28">
    <Seo
      title={seo.title}
      description={seo.description}
      keywords={seo.keywords}
      jsonLd={[
        // Same `crumbs` array feeds the visible trail below. Marking up a
        // breadcrumb the user cannot see violates Google's guidelines.
        breadcrumbs(crumbs),
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

    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <BreadcrumbBar items={crumbs} />
      </div>
    </div>

    <section className="px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-6 enter">{h1}</h1>
        <p
          className="text-xl text-gray-600 leading-relaxed enter"
          style={{ '--enter-delay': '0.1s' } as React.CSSProperties}
        >
          {lede}
        </p>

        <div
          className="mt-8 flex flex-wrap gap-3 justify-center enter"
          style={{ '--enter-delay': '0.2s' } as React.CSSProperties}
        >
          <a
            href={telHref}
            className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-black text-white font-medium py-3 px-6 rounded-md transition-colors"
          >
            <Phone className="w-4 h-4" aria-hidden />
            Call {SITE.phone}
          </a>
          <a
            href={SITE.appointmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#1a1a1a] text-[#1a1a1a] hover:bg-gray-100 font-medium py-3 px-6 rounded-md transition-colors"
          >
            <CalendarDays className="w-4 h-4" aria-hidden />
            Book a consultation
          </a>
        </div>
      </div>
    </section>

    <section className="px-4 sm:px-6 lg:px-8 pb-16">
      {/* The width cap lives on the wrapper, so `prose`'s own 65ch max-width
          does not fight it inside the same class list. */}
      <div className="max-w-3xl mx-auto">
        <div className="prose prose-lg max-w-none prose-headings:text-[#1a1a1a] prose-a:text-[#1a1a1a]">
          {children}
        </div>
      </div>
    </section>

    <section className="px-4 sm:px-6 lg:px-8 pb-16">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">{faqHeading}</h2>
        {/* Shared accordion: keeps collapsed answers in the DOM so the FAQPage
            markup above has real visible text backing it. */}
        <FaqAccordion faqs={faqs} />
      </div>
    </section>

    <section className="px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-3xl mx-auto bg-gray-50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">{cta.heading}</h2>
        <p className="mt-3 text-gray-700 leading-relaxed">{cta.body}</p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-black text-white font-medium py-3 px-6 rounded-md transition-colors"
          >
            Send a message
          </Link>
          <a
            href={`mailto:${SITE.email}`}
            className="inline-flex items-center gap-2 border border-[#1a1a1a] text-[#1a1a1a] hover:bg-gray-100 font-medium py-3 px-6 rounded-md transition-colors"
          >
            Email {SITE.agentName.split(' ')[0]}
          </a>
        </div>
      </div>
    </section>
  </div>
);

export default LandingPage;
