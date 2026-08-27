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

      {/*
        Hero. Full-bleed photograph under a dark gradient, with the copy set on
        it rather than beside it. The previous treatment — dark text on a pale
        gray-to-white wash — was legible and completely anonymous; these pages
        sell a service where the look of the page is part of the pitch.

        The image is a real <img> rather than a CSS background so the preload
        scanner can find it: it is the LCP element here, and a background-image
        is not discoverable until the stylesheet has parsed.
      */}
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden bg-[#0d0d0f]">
        <img
          src={hero.image}
          alt={hero.alt}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
          fetchPriority="high"
          decoding="async"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/85 to-[#0d0d0f]/40"
          aria-hidden
        />

        <div className="container relative px-4 mx-auto pb-16 pt-32">
          <div className="max-w-4xl mx-auto">
            <BreadcrumbBar items={crumbs} />

            {label && (
              <div
                className="mb-6 flex items-center gap-4 enter"
                style={{ '--enter-delay': '0.05s' } as React.CSSProperties}
              >
                <span className="h-px w-10 bg-champagne" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-champagne">
                  {label}
                </p>
              </div>
            )}
            <h1
              className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight text-white enter"
              style={{ '--enter-delay': '0.1s' } as React.CSSProperties}
            >
              {copy.h1}
            </h1>
            <p
              className="mt-7 max-w-2xl text-lg md:text-xl leading-relaxed text-gray-300 enter"
              style={{ '--enter-delay': '0.16s' } as React.CSSProperties}
            >
              {copy.lede}
            </p>

            <div
              className="mt-10 flex flex-wrap gap-3 enter"
              style={{ '--enter-delay': '0.22s' } as React.CSSProperties}
            >
              <a
                href={telHref}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold tracking-wide text-[#0d0d0f] transition-colors hover:bg-champagne"
              >
                <Phone className="w-4 h-4" aria-hidden />
                {copy.ctaPrimary ?? `Call ${SITE.phone}`}
              </a>
              <a
                href={SITE.appointmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-champagne/60 px-7 py-3.5 text-sm font-semibold tracking-wide text-champagne transition-colors hover:bg-champagne hover:text-[#0d0d0f]"
              >
                <CalendarDays className="w-4 h-4" aria-hidden />
                {copy.ctaSecondary ?? 'Book a consultation'}
              </a>
              <a
                href={smsHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-white/10"
              >
                <MessageSquare className="w-4 h-4" aria-hidden />
                {copy.textLabel ?? 'Text'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/*
        Credential strip. Four checkable facts, all of them sourced from
        siteConfig rather than typed in here — the brokerage, the licence, the
        service area and the languages. Nothing on it is a claim that cannot be
        verified.
      */}
      <div className="border-b border-gray-200 bg-[#0d0d0f] text-white">
        <div className="container px-4 mx-auto">
          <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-y-6 py-8 md:grid-cols-4 md:divide-x md:divide-white/10">
            {[
              { term: copy.stripLabels?.[0] ?? 'Brokerage', value: SITE.brokerage },
              { term: copy.stripLabels?.[1] ?? 'Licensed', value: 'MA Broker' },
              {
                term: copy.stripLabels?.[2] ?? 'Towns covered',
                value: String(SITE.areaServed.length),
              },
              { term: copy.stripLabels?.[3] ?? 'Languages', value: 'English · Tiếng Việt' },
            ].map((item) => (
              <div key={item.term} className="px-0 text-center md:px-6">
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-champagne">
                  {item.term}
                </dt>
                <dd className="mt-2 text-sm font-medium text-gray-100">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Body */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container px-4 mx-auto">
          {/* The width cap lives on the wrapper, so `prose`'s own 65ch max-width
              does not fight it inside the same class list. */}
          <div className="max-w-4xl mx-auto enter">
            <div className="prose prose-lg max-w-none prose-headings:text-[#1a1a1a] prose-h2:font-display prose-h2:font-semibold prose-h2:mt-16 prose-h2:mb-5 prose-h2:text-3xl md:prose-h2:text-4xl prose-p:leading-relaxed prose-a:text-[#1a1a1a] prose-a:underline prose-a:decoration-champagne prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:decoration-[#1a1a1a] prose-strong:text-[#1a1a1a] prose-li:marker:text-champagne">
              {copy.body}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-[#faf8f5] border-y border-black/5">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto enter">
            <span className="mb-5 block h-px w-10 bg-champagne" aria-hidden />
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#1a1a1a] mb-8">
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

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-[#0d0d0f] py-24 text-white">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne to-transparent"
          aria-hidden
        />
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center enter">
            <h2 className="font-display text-3xl md:text-5xl font-semibold leading-tight">
              {copy.cta.heading}
            </h2>
            <p className="mt-5 mx-auto max-w-2xl text-lg leading-relaxed text-gray-300">
              {copy.cta.body}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-champagne px-7 py-3.5 text-sm font-semibold tracking-wide text-[#0d0d0f] transition-colors hover:bg-white"
              >
                {copy.ctaButton ?? 'Send a message'}
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <a
                href={telHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                <Phone className="w-4 h-4" aria-hidden />
                {SITE.phone}
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
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
