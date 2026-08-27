import { useCallback, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

export interface RoadmapStep {
  title: string;
  description: string;
  details: string[];
}

/**
 * The step-by-step guide shared by the buyer and seller pages.
 *
 * BuyerRoadmap and SellerRoadmap previously carried byte-identical markup —
 * the same timeline, cards and list, copy-pasted. Any visual change had to be
 * made twice and drifted the moment one was edited. They now pass data to this
 * component and nothing else, so a change here moves both guides at once.
 *
 * The layout is an editorial chapter list: a sticky index on the left that
 * doubles as a jump nav, and full-width chapter cards on the right. It replaced
 * a vertical badge-and-rail timeline. Two reasons beyond taste — an eight-step
 * timeline gives the reader no way to get back to step 3 without scrolling for
 * it, and a rail forces every card into the same narrow column, which is what
 * made the details read as an afterthought at the bottom of each card.
 *
 * Everything is rendered visibly. Nothing here is behind a disclosure, because
 * these are the pages the guides exist to be read on.
 *
 * `accent` is the only thing that differs between the two, so buyers and
 * sellers read as related but distinct.
 */
const ACCENTS = {
  emerald: {
    text: 'text-emerald-700',
    ghost: 'text-emerald-50',
    edge: 'from-emerald-400 to-teal-500',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    tick: 'bg-emerald-50 text-emerald-600',
    marker: 'bg-emerald-500',
    active: 'text-emerald-700',
  },
  blue: {
    text: 'text-blue-700',
    ghost: 'text-blue-50',
    edge: 'from-sky-400 to-blue-600',
    chip: 'bg-blue-50 text-blue-700 ring-blue-200',
    tick: 'bg-blue-50 text-blue-600',
    marker: 'bg-blue-600',
    active: 'text-blue-700',
  },
  purple: {
    text: 'text-purple-700',
    ghost: 'text-purple-50',
    edge: 'from-purple-500 to-fuchsia-500',
    chip: 'bg-purple-50 text-purple-700 ring-purple-200',
    tick: 'bg-purple-50 text-purple-600',
    marker: 'bg-purple-600',
    active: 'text-purple-700',
  },
} as const;

interface RoadmapProps {
  title: string;
  steps: RoadmapStep[];
  accent?: keyof typeof ACCENTS;
  /** Label for the "Step 3 of 8" counter, e.g. "Step". */
  stepLabel?: string;
  ofLabel?: string;
}

/** Stable, readable anchor ids so the index can link into the chapters. */
const stepId = (index: number) => `step-${index + 1}`;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const Roadmap = ({
  title,
  steps,
  accent = 'emerald',
  stepLabel = 'Step',
  ofLabel = 'of',
}: RoadmapProps) => {
  const c = ACCENTS[accent];

  /**
   * Which chapter the reader is currently in.
   *
   * Seeded to 0 on BOTH the server and the first client render — anything
   * measured would differ between the two and take the whole page's hydration
   * with it. The observer below only starts correcting it after mount.
   */
  const [active, setActive] = useState(0);
  /**
   * Geometry of the rolling marker in the index rail. Zero height until it has
   * been measured, so the prerendered markup and the first client render agree;
   * the transition then carries it from wherever it is to wherever it belongs.
   */
  const [marker, setMarker] = useState({ top: 0, height: 0 });
  const navRef = useRef<HTMLOListElement>(null);
  /**
   * Set while a click-driven smooth scroll is still travelling. The observer
   * fires continuously through every chapter it passes, which would otherwise
   * drag the marker along behind the scroll instead of letting it move once,
   * directly, to the step that was asked for.
   */
  const scrolling = useRef(false);

  /* Track which chapter is in view. rootMargin pins the trigger line near the
     top of the viewport so the marker changes when a heading arrives there,
     not when the card happens to be centred. */
  useEffect(() => {
    const sections = steps
      .map((_, i) => document.getElementById(stepId(i)))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrolling.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const index = sections.indexOf(visible.target as HTMLElement);
        if (index >= 0) setActive(index);
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // steps.length, not steps: the parents build the array inline from t(), so
    // it is a new reference every render — depending on it would rebuild the
    // observer on each setActive and thrash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  /* Measure the active index entry so the marker can slide onto it. Re-measured
     on resize because the entries reflow and wrap at narrower widths. */
  useEffect(() => {
    const measure = () => {
      const item = navRef.current?.querySelectorAll('li')[active] as
        | HTMLElement
        | undefined;
      if (!item) return;
      setMarker({ top: item.offsetTop, height: item.offsetHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, steps.length]);

  /**
   * Smooth-scroll the chapter into view instead of letting the browser jump.
   *
   * The anchor stays a real `<a href="#step-n">` — this only intercepts the
   * default when the browser can do better, so the index still works with no
   * JS and still reads as a link to a crawler. `scroll-behavior: smooth` is
   * deliberately NOT set globally: it would also animate the route-change
   * `window.scrollTo(0, 0)` in ScrollToTop, which is a jump by design.
   */
  const jumpTo = useCallback((index: number) => (event: React.MouseEvent) => {
    const el = document.getElementById(stepId(index));
    if (!el) return;
    event.preventDefault();
    scrolling.current = true;
    setActive(index);
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    // Give the animation room to finish before the observer takes over again.
    window.setTimeout(() => {
      scrolling.current = false;
    }, 700);
    // Keep the address bar honest without routing — a router navigation here
    // would re-run ScrollToTop and fight the scroll that is still in flight.
    window.history.replaceState(null, '', `#${stepId(index)}`);
  }, []);

  return (
    <section className="py-12">
      <div className="mb-12 max-w-3xl">
        <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${c.text}`}>
          {steps.length} {steps.length === 1 ? 'step' : 'steps'}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink">
          {title}
        </h2>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-14">
        {/*
          Index. Hidden below lg because a sticky column and a stacked layout
          fight each other — on a phone the chapters themselves are the index.
          These are real <a href="#…"> anchors, not click handlers, so they
          work without JS and can be tabbed to.
        */}
        <nav aria-label="Steps" className="hidden lg:block">
          <div className="sticky top-28 relative">
            {/* The rolling marker. One element that travels between entries,
                rather than a border toggled on and off each one — the travel is
                what shows the reader the two positions are related. It hangs off
                this wrapper rather than the <ol>, because a <span> is not a
                permitted child of a list and the li offsets are measured against
                this element anyway. */}
            <span
              className={`absolute -left-px w-0.5 rounded-full transition-all duration-500 ease-out motion-reduce:transition-none ${c.marker}`}
              style={{ top: marker.top, height: marker.height }}
              aria-hidden
            />
            <ol
              ref={navRef}
              className="list-none p-0 m-0 space-y-1 border-l border-gray-200"
            >
              {steps.map((step, index) => {
                const isActive = index === active;
                return (
                  <li key={step.title} className="m-0">
                    <a
                      href={`#${stepId(index)}`}
                      onClick={jumpTo(index)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`group flex items-start gap-3 py-2 pl-4 text-sm transition-colors duration-300 hover:text-ink ${
                        isActive ? `font-medium ${c.active}` : 'text-gray-500'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 shrink-0 font-mono text-xs tabular-nums transition-colors duration-300 group-hover:text-ink ${
                          isActive ? c.active : 'text-gray-400'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="leading-snug">{step.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        <ol className="list-none p-0 m-0 space-y-6">
          {steps.map((step, index) => (
            <li
              key={step.title}
              id={stepId(index)}
              className="relative scroll-mt-28 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl enter"
              style={{ '--enter-delay': `${index * 0.05}s` } as React.CSSProperties}
            >
              {/* Accent edge, full height of the card. */}
              <span
                className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${c.edge}`}
                aria-hidden
              />

              {/* Oversized ghost numeral. Decorative only — the real step
                  number is in the chip below, where a screen reader finds it. */}
              <span
                className={`pointer-events-none absolute -top-6 right-4 select-none text-[8rem] font-black leading-none tracking-tighter ${c.ghost}`}
                aria-hidden
              >
                {index + 1}
              </span>

              <div className="relative p-7 pl-9 sm:p-9 sm:pl-12">
                <p
                  className={`mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ${c.chip}`}
                >
                  {stepLabel} {index + 1} {ofLabel} {steps.length}
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600">
                  {step.description}
                </p>

                {/* Two columns on wide cards: the details are the substance of
                    each step, not a footnote to it. */}
                <ul className="mt-7 grid gap-x-8 gap-y-3 border-t border-gray-100 pt-6 list-none p-0 sm:grid-cols-2">
                  {step.details.map((detail) => (
                    <li key={detail} className="m-0 flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${c.tick}`}
                        aria-hidden
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm leading-relaxed text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Roadmap;
