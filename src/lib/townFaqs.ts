import type { QA } from '@/lib/schema';
import { TOWN_FACTS } from '@/data/townFacts';

/**
 * Per-town FAQ, built from the researched facts rather than written free-hand.
 *
 * These are the questions people actually type — "does X have a commuter rail
 * station", "what high school does X go to", "how far is X from Boston" — and
 * every answer is assembled from TOWN_FACTS, so nothing here can drift away
 * from the panel above it or state something the facts module does not.
 *
 * That constraint is the point: 17 towns × 4 questions is exactly the shape of
 * task where hand-writing invites invention. Deriving them means a wrong answer
 * is a wrong *fact*, fixable in one place, rather than 68 separate claims.
 */
export const townFaqs = (townName: string, slug: string): QA[] => {
  const f = TOWN_FACTS[slug];
  if (!f) return [];

  const qas: QA[] = [];

  qas.push({
    question: `Does ${townName} have a commuter rail or subway station?`,
    answer: f.transit.length
      ? `${f.transit.join('. ')}.`
      : `${townName} has no rail station of its own.`,
  });

  const schools = f.schools;
  const parts: string[] = [];
  if (schools.elementary) parts.push(`Elementary schools are ${schools.elementary.join(', ')}`);
  if (schools.middle) parts.push(`middle school is ${schools.middle.join(' and ')}`);
  parts.push(`the high school is ${schools.high.join(' and ')}`);
  qas.push({
    question: `What schools serve ${townName}?`,
    answer: `${parts.join('; ')}.${schools.note ? ` ${schools.note}` : ''} Attendance zones change, so confirm the district for a specific address before you rely on it.`,
  });

  if (f.taxRate) {
    qas.push({
      question: `What is the property tax rate in ${townName}?`,
      answer:
        `The residential rate is $${f.taxRate.rate.toFixed(2)} per $1,000 of assessed value ` +
        `for fiscal year ${f.taxRate.fiscalYear}. Your bill is that rate times your assessed ` +
        `value divided by 1,000. Rates are set annually by the town and published by the ` +
        `Massachusetts Department of Revenue, so confirm the current figure before relying ` +
        `on it — and note that a lower rate does not mean a lower bill, because the rate ` +
        `depends on the town's total assessed value as well as its budget.`,
    });
  }

  qas.push({
    question: `What highways serve ${townName}?`,
    answer: `${f.highways.join(', ')}. Which of these you are near matters more for a daily commute than the town line does.`,
  });

  if (f.outdoors.length) {
    qas.push({
      question: `What parks and open space does ${townName} have?`,
      answer: `${f.outdoors.join('; ')}.`,
    });
  }

  if (f.buyerNote) {
    qas.push({
      question: `What should buyers check specifically in ${townName}?`,
      answer: f.buyerNote,
    });
  }

  return qas;
};
