import { Check } from 'lucide-react';

export interface RoadmapStep {
  title: string;
  description: string;
  details: string[];
}

/**
 * The step-by-step timeline shared by the buyer and seller guides.
 *
 * BuyerRoadmap and SellerRoadmap previously carried byte-identical markup —
 * the same timeline, cards and list, copy-pasted. Any visual change had to be
 * made twice and drifted the moment one was edited. They now pass data to this
 * component and nothing else, so a change here moves both guides at once.
 *
 * `accent` is the only thing that differs between them, so buyers and sellers
 * read as related but distinct.
 */
const ACCENTS = {
  emerald: {
    rail: 'bg-emerald-200',
    badge: 'bg-emerald-600 ring-emerald-100',
    label: 'text-emerald-700',
    tick: 'text-emerald-600',
  },
  indigo: {
    rail: 'bg-indigo-200',
    badge: 'bg-indigo-600 ring-indigo-100',
    label: 'text-indigo-700',
    tick: 'text-indigo-600',
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
      <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] tracking-tight mb-3">
        {title}
      </h2>
      <p className={`text-sm font-semibold uppercase tracking-wider ${c.label} mb-12`}>
        {steps.length} {steps.length === 1 ? 'step' : 'steps'}
      </p>

      <ol className="relative list-none p-0 m-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step.title}
              className="relative flex gap-5 sm:gap-8 pb-10 last:pb-0 enter"
              style={{ '--enter-delay': `${index * 0.06}s` } as React.CSSProperties}
            >
              {/* Rail + numbered badge. The rail is drawn per-step and skipped
                  on the last one, so it terminates at the final badge instead
                  of running past it. */}
              <div className="relative flex flex-col items-center shrink-0">
                <div
                  className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-base font-bold text-white ring-4 ${c.badge}`}
                  aria-hidden
                >
                  {index + 1}
                </div>
                {!isLast && (
                  <div className={`absolute top-11 bottom-[-2.5rem] w-0.5 ${c.rail}`} aria-hidden />
                )}
              </div>

              <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-300">
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.label} mb-2`}>
                  {stepLabel} {index + 1} {ofLabel} {steps.length}
                </p>
                <h3 className="text-xl font-semibold text-[#1a1a1a] mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-5">{step.description}</p>

                <ul className="space-y-2.5 list-none p-0 m-0 border-t border-gray-100 pt-5">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${c.tick}`} aria-hidden />
                      <span className="leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default Roadmap;
