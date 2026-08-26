import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { QA } from '@/lib/schema';

/**
 * Accessible FAQ accordion.
 *
 * The answers are ALWAYS rendered into the DOM and toggled with the `hidden`
 * attribute — never `{open && <p>…}`. Conditionally-rendered answers are absent
 * from the prerendered HTML entirely, which both breaks FAQPage markup's
 * "content must be on the page" requirement and hides the copy from every
 * crawler that does not execute JavaScript.
 */
const FaqAccordion = ({ faqs }: { faqs: QA[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-gray-200 border-y border-gray-200">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;
        return (
          <div key={faq.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium text-[#1a1a1a] transition-colors hover:text-gray-600"
              >
                {faq.question}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
              <p className="pb-5 pr-8 leading-relaxed text-gray-600">{faq.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;
