import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import type { QA } from '@/lib/schema';

/**
 * Accessible FAQ accordion.
 *
 * The answers are ALWAYS rendered into the DOM and toggled with the `hidden`
 * attribute — never `{open && <p>…}`. Conditionally-rendered answers are absent
 * from the prerendered HTML entirely, which both breaks FAQPage markup's
 * "content must be on the page" requirement and hides the copy from every
 * crawler that does not execute JavaScript.
 *
 * `hidden` is display:none, so the panel's own height cannot be transitioned.
 * The reveal is animated on the inner element instead, which starts animating
 * the moment the attribute comes off — the open still reads as a movement
 * rather than a snap, without giving up the in-DOM requirement above.
 *
 * Two variants, because the two places this appears want different weights:
 *   divided — hairline rules, sits inside a card the caller already drew.
 *   cards   — each question is its own raised card. For /faq, where the
 *             accordion IS the page rather than one section of it.
 *
 * Panel ids are namespaced with useId() rather than being bare indices. /faq
 * renders three of these at once, so `faq-panel-0` existed three times in the
 * document and every `aria-controls` on the second and third sets resolved to
 * the FIRST set's panel. useId is SSR-safe: the generator and the client walk
 * the same tree and produce the same ids, so hydration still matches.
 */
const FaqAccordion = ({
  faqs,
  variant = 'divided',
}: {
  faqs: QA[];
  variant?: 'divided' | 'cards';
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const uid = useId();
  const cards = variant === 'cards';

  return (
    <div
      className={
        cards ? 'space-y-3' : 'divide-y divide-gray-200 border-y border-gray-200'
      }
    >
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        const panelId = `faq-panel-${uid}-${i}`;
        const buttonId = `faq-button-${uid}-${i}`;
        return (
          <div
            key={faq.question}
            className={
              cards
                ? `overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                    isOpen
                      ? 'border-champagne/50 shadow-md'
                      : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
                  }`
                : undefined
            }
          >
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className={`flex w-full items-start justify-between gap-5 text-left font-medium text-ink transition-colors hover:text-gray-600 ${
                  cards ? 'px-6 py-5 md:px-7' : 'py-5'
                } ${cards ? 'text-base md:text-lg' : 'text-base'}`}
              >
                <span className="leading-snug">{faq.question}</span>
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                    isOpen
                      ? 'rotate-45 bg-ink text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  aria-hidden
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
              <div className={`faq-reveal ${cards ? 'px-6 md:px-7' : ''}`}>
                {cards && <span className="block h-px w-10 bg-champagne" aria-hidden />}
                <p
                  className={`leading-relaxed text-gray-600 ${
                    cards ? 'pb-6 pt-4 pr-2 md:text-[1.0625rem]' : 'pb-5 pr-8'
                  }`}
                >
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;
