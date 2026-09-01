import { Phone, CalendarDays, MessageSquare } from 'lucide-react';
import Seo from '@/components/Seo';
import BreadcrumbBar from '@/components/BreadcrumbBar';
import CtaBand from '@/components/CtaBand';
import { breadcrumbs, type Crumb } from '@/lib/schema';
import { SITE, telHref, smsHref } from '@/lib/siteConfig';
import { defaultStrip, type StripItem } from '@/lib/strip';

export type { StripItem };
import { alternatesFor } from '@/lib/viRoutes';

/** `prose` is a reading column; `wide` holds card grids, tables and the roadmap. */
export type ShellWidth = 'prose' | 'wide';

/**
 * `tall` is the cinematic landing hero. `standard` is a shorter photographic
 * one. `compact` has no minimum height at all — the padding sets it — and is
 * what an index page wants, where the content below is the point.
 */
export type HeroSize = 'tall' | 'standard' | 'compact';

const WIDTHS: Record<ShellWidth, string> = {
  prose: 'max-w-4xl',
  wide: 'max-w-6xl',
};

const HERO_SIZES: Record<HeroSize, string> = {
  tall: 'relative isolate flex min-h-[78vh] items-end overflow-hidden bg-ink-deep',
  standard: 'relative isolate flex min-h-[56vh] items-end overflow-hidden bg-ink-deep',
  compact: 'relative isolate overflow-hidden bg-ink-deep',
};

export interface PageShellProps {
  /** Route path. Drives the canonical and the hreflang set. */
  path: string;
  seo: {
    title: string;
    description: string;
    keywords?: string;
    ogImage?: string;
    /** Only for an ogImage that is deliberately not 1200x630. See SeoProps. */
    ogImageWidth?: number;
    ogImageHeight?: number;
    ogType?: 'website' | 'article' | 'profile';
    locale?: string;
    /**
     * Keeps the page out of search while still using the site chrome. Only
     * /search needs this: MLS PIN requires IDX displays be non-indexable, and
     * the page is syndicated data rather than first-party content, so there is
     * nothing to gain by indexing it either.
     */
    noindex?: boolean;
  };
  /**
   * Page-specific schema. `breadcrumbs(crumbs)` is MERGED into this, never
   * substituted for it — dropping the caller's nodes would break every `@id`
   * reference that depends on `#agent` or `#kevin` being declared on the same
   * page.
   */
  jsonLd?: object | object[];
  /**
   * Drives the visible trail AND the BreadcrumbList, from this one array. Omit
   * it and the page gets neither. That is the point: marking up a trail the
   * reader cannot see violates Google's guidelines, and routing both through
   * one prop makes it impossible to ship one without the other.
   */
  crumbs?: Crumb[];
  /** Small label above the h1. Falls back to the last crumb. */
  eyebrow?: string;
  h1: string;
  /**
   * Extra classes for the h1. Exists for headings that are mostly NUMBERS —
   * a street address — where the display serif's old-style figures make the
   * digits bounce. Pass "numeral" to set it in Inter with lining figures.
   */
  h1ClassName?: string;
  lede?: React.ReactNode;
  /**
   * Cinematic hero image, sized through Unsplash's params — a bare photo URL
   * serves the multi-megabyte original, and this is the LCP element where it
   * appears. Omit for a flat dark hero.
   */
  hero?: { image: string; alt: string };
  heroSize?: HeroSize;
  /** Pill CTAs under the lede. `false` for none. */
  actions?: React.ReactNode | false;
  /** Overrides for the default pill labels, for the Vietnamese rendering. */
  actionLabels?: { primary?: string; secondary?: string; text?: string };
  /** Rendered beside the h1 — /about's portrait. */
  heroAside?: React.ReactNode;
  /** Put the aside before the copy rather than after it. */
  asideFirst?: boolean;
  width?: ShellWidth;
  /** Credential strip. `false` omits it. */
  strip?: StripItem[] | false;
  children: React.ReactNode;
  cta?: { heading: string; body: string; button?: string } | false;
}

/**
 * The hero copy renders bare unless an aside is supplied, in which case the two
 * sit side by side. Only /about uses the aside (its portrait), and wrapping
 * every other page's hero in an empty div to support it is markup noise.
 */
const HeroLayout = ({
  aside,
  first = false,
  children,
}: {
  aside?: React.ReactNode;
  first?: boolean;
  children: React.ReactNode;
}) => {
  if (!aside) return <>{children}</>;
  const copy = (
    <div key="copy" className="min-w-0 flex-1">
      {children}
    </div>
  );
  const side = (
    <div key="aside" className="shrink-0">
      {aside}
    </div>
  );
  return (
    <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-center md:gap-14">
      {first ? [side, copy] : [copy, side]}
    </div>
  );
};


/**
 * The site's one page chrome: head tags, dark hero, breadcrumbs, eyebrow, h1,
 * lede, credential strip and closing CTA.
 *
 * Before this the site ran two visual systems. Four landing pages used
 * LandingPage; ViPage, /about and /faq had each hand-copied its markup; and
 * every remaining page was on an older, uncapped treatment that ran body text
 * to ~1368px. The width is the one thing that legitimately varies — see
 * ShellWidth — and everything else is shared.
 *
 * Nothing here reads `window` or `localStorage` during render, and the mount
 * animation is the CSS `.enter` class with an inline `--enter-delay` rather
 * than framer-motion, which writes `opacity:0` into the prerendered HTML.
 */
const PageShell = ({
  path,
  seo,
  jsonLd,
  crumbs,
  eyebrow,
  h1,
  h1ClassName = '',
  lede,
  hero,
  heroSize = 'compact',
  actions,
  actionLabels,
  heroAside,
  asideFirst = false,
  width = 'prose',
  strip,
  children,
  cta,
}: PageShellProps) => {
  const col = WIDTHS[width];
  const label = eyebrow ?? crumbs?.[crumbs.length - 1]?.name;

  const extra = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const graph = crumbs?.length ? [breadcrumbs(crumbs), ...extra] : extra;

  const stripItems = strip === false ? null : strip ?? defaultStrip();

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage={seo.ogImage}
        ogImageWidth={seo.ogImageWidth}
        ogImageHeight={seo.ogImageHeight}
        ogType={seo.ogType}
        locale={seo.locale}
        noindex={seo.noindex}
        // Reciprocal with the /vi counterpart where one exists, undefined where
        // it does not. hreflang only counts when both sides declare the set.
        alternates={alternatesFor(path)}
        jsonLd={graph.length ? graph : undefined}
      />

      {/*
        Hero. Where an image is given it is a real <img> rather than a CSS
        background, so the preload scanner can find it: it is the LCP element,
        and a background-image is not discoverable until the stylesheet parses.
      */}
      <section className={HERO_SIZES[heroSize]}>
        {hero && (
          <>
            <img
              src={hero.image}
              alt={hero.alt}
              className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
              fetchPriority="high"
              decoding="async"
            />
            <div
              className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-deep via-ink-deep/85 to-ink-deep/40"
              aria-hidden
            />
          </>
        )}

        <div className="container relative px-4 mx-auto pb-16 pt-32">
          <div className={`${col} mx-auto`}>
            {crumbs?.length ? <BreadcrumbBar items={crumbs} tone="dark" /> : null}

            <HeroLayout aside={heroAside} first={asideFirst}>
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
                className={`${h1ClassName || 'font-display'} text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight text-white enter`}
                style={{ '--enter-delay': '0.1s' } as React.CSSProperties}
              >
                {h1}
              </h1>

              {lede && (
                <p
                  className="mt-7 max-w-2xl text-lg md:text-xl leading-relaxed text-gray-300 enter"
                  style={{ '--enter-delay': '0.16s' } as React.CSSProperties}
                >
                  {lede}
                </p>
              )}

              {actions !== false && (
                <div
                  className="mt-10 flex flex-wrap gap-3 enter"
                  style={{ '--enter-delay': '0.22s' } as React.CSSProperties}
                >
                  {actions ?? (
                    <>
                      <a
                        href={telHref}
                        className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold tracking-wide text-ink-deep transition-colors hover:bg-champagne btn-pill"
                      >
                        <Phone className="w-4 h-4" aria-hidden />
                        {actionLabels?.primary ?? `Call ${SITE.phone}`}
                      </a>
                      <a
                        href={SITE.appointmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 rounded-full border border-champagne/60 px-7 py-3.5 text-sm font-semibold tracking-wide text-champagne transition-colors hover:bg-champagne hover:text-ink-deep btn-pill"
                      >
                        <CalendarDays className="w-4 h-4" aria-hidden />
                        {actionLabels?.secondary ?? 'Book a consultation'}
                      </a>
                      <a
                        href={smsHref}
                        className="group inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:border-champagne hover:text-champagne btn-pill"
                      >
                        <MessageSquare className="w-4 h-4" aria-hidden />
                        {actionLabels?.text ?? 'Text'}
                      </a>
                    </>
                  )}
                </div>
              )}
            </HeroLayout>
          </div>
        </div>
      </section>

      {stripItems && (
        <div className="border-b border-gray-200 bg-ink-deep text-white">
          <div className="container px-4 mx-auto">
            <dl
              className={`mx-auto grid ${col} grid-cols-2 gap-y-6 py-8 md:grid-cols-4 md:divide-x md:divide-white/10`}
            >
              {stripItems.map((item) => (
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
      )}

      {children}

      {cta !== false && cta && (
        <CtaBand heading={cta.heading} body={cta.body} button={cta.button} />
      )}
    </div>
  );
};

/** The standard body slot: the shell's column, on white. */
export const ShellSection = ({
  children,
  width = 'prose',
  className = 'py-20 md:py-28 bg-white',
  inner = 'enter',
}: {
  children: React.ReactNode;
  width?: ShellWidth;
  className?: string;
  inner?: string;
}) => (
  <section className={className}>
    <div className="container px-4 mx-auto">
      <div className={`${WIDTHS[width]} mx-auto ${inner}`}>{children}</div>
    </div>
  </section>
);

export default PageShell;
