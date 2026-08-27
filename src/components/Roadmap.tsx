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
  },
  indigo: {
    text: 'text-indigo-700',
    ghost: 'text-indigo-50',
    edge: 'from-indigo-400 to-violet-500',
    chip: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    tick: 'bg-indigo-50 text-indigo-600',
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

const Roadmap = ({
  title,
  steps,
  accent = 'emerald',
  stepLabel = 'Step',
  ofLabel = 'of',
}: RoadmapProps) => {
  const c = ACCENTS[accent];

  return (
    <section className="py-12">
      <div className="mb-12 max-w-3xl">
        <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${c.text}`}>
          {steps.length} {steps.length === 1 ? 'step' : 'steps'}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1a1a1a]">
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
          <ol className="sticky top-28 list-none p-0 m-0 space-y-1 border-l border-gray-200">
            {steps.map((step, index) => (
              <li key={step.title} className="m-0">
                <a
                  href={`#${stepId(index)}`}
                  className="group -ml-px flex items-start gap-3 border-l-2 border-transparent py-2 pl-4 text-sm text-gray-500 transition-colors hover:border-gray-900 hover:text-[#1a1a1a]"
                >
                  <span className="mt-0.5 w-4 shrink-0 font-mono text-xs tabular-nums text-gray-400 transition-colors group-hover:text-[#1a1a1a]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="leading-snug">{step.title}</span>
                </a>
              </li>
            ))}
          </ol>
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
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">
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
