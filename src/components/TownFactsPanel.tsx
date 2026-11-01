import { Train, Milestone, GraduationCap, Trees, Info, Receipt } from 'lucide-react';
import { TAX_RATE_SOURCE, type TownFacts } from '@/data/townFacts';

/**
 * The checkable half of a town guide: stations, routes, school names, open
 * space, and the one thing a buyer should specifically look into here.
 *
 * This exists because the prose sections alone read as interchangeable — every
 * guide had the same nine headings and no detail a local would recognise.
 * Named schools and named stations are what make a page worth staying on, and
 * they are the sort of specific a reader can check, which is exactly why they
 * build trust.
 */
const Row = ({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Train;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex gap-4">
    <Icon className="mt-1 h-5 w-5 shrink-0 text-gray-400" aria-hidden />
    <div className="min-w-0">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">{title}</h3>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </div>
  </div>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-1 marker:text-gray-300">
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
);

/**
 * Every label in the panel. Literal strings passed in, never t(): the Chinese
 * guides prerender, and i18n is pinned to 'en' while they do. The facts themselves
 * stay in English in both, since a station or a school is known by that name.
 */
export interface TownFactsLabels {
  heading: (town: string) => string;
  transit: string;
  highways: string;
  schools: string;
  elementary: string;
  middle: string;
  high: string;
  outdoors: string;
  taxRate: string;
  taxLine: (rate: string, fiscalYear: number) => string;
  taxCheckBefore: string;
  taxCheckAfter: string;
  check: string;
}

const ENGLISH_LABELS: TownFactsLabels = {
  heading: (town) => `${town} at a glance`,
  transit: 'Getting to Boston',
  highways: 'Highways',
  schools: 'Public schools',
  elementary: 'Elementary:',
  middle: 'Middle:',
  high: 'High:',
  outdoors: 'Parks & open space',
  taxRate: 'Residential tax rate',
  taxLine: (_rate, fiscalYear) => `per $1,000 of assessed value, fiscal year ${fiscalYear}.`,
  taxCheckBefore: 'Rates are set annually. Confirm the current figure with the',
  taxCheckAfter: '.',
  check: 'What to check here',
};

const TownFactsPanel = ({
  town,
  facts,
  labels = ENGLISH_LABELS,
  buyerNote = facts.buyerNote,
  schoolsNote = facts.schools.note,
}: {
  town: string;
  facts: TownFacts;
  labels?: TownFactsLabels;
  /** The two prose fields, for a language other than the one TOWN_FACTS is in. */
  buyerNote?: string;
  schoolsNote?: string;
}) => (
  <section className="my-12 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
    <h2 className="text-2xl font-bold text-ink mb-6 tracking-tight">
      {labels.heading(town)}
    </h2>

    <div className="grid gap-8 sm:grid-cols-2">
      <Row icon={Train} title={labels.transit}>
        <List items={facts.transit} />
      </Row>

      <Row icon={Milestone} title={labels.highways}>
        <p>{facts.highways.join(' · ')}</p>
      </Row>

      <Row icon={GraduationCap} title={labels.schools}>
        {facts.schools.elementary && (
          <p className="mb-2">
            <span className="font-medium text-ink">{labels.elementary}</span>{' '}
            {facts.schools.elementary.join(', ')}
          </p>
        )}
        {facts.schools.middle && (
          <p className="mb-2">
            <span className="font-medium text-ink">{labels.middle}</span>{' '}
            {facts.schools.middle.join(', ')}
          </p>
        )}
        <p>
          <span className="font-medium text-ink">{labels.high}</span>{' '}
          {facts.schools.high.join(', ')}
        </p>
        {schoolsNote && <p className="mt-2 text-sm text-gray-600">{schoolsNote}</p>}
      </Row>

      <Row icon={Trees} title={labels.outdoors}>
        <List items={facts.outdoors} />
      </Row>

      {/* Absent until the rate is verified against the DOR table — see the
          doc comment on TownFacts.taxRate. The fiscal year and the source are
          shown with the number because a rate without them is not checkable,
          and a rate nobody can check should not be published at all. */}
      {facts.taxRate && (
        <Row icon={Receipt} title={labels.taxRate}>
          <p>
            <span className="font-medium text-ink">
              ${facts.taxRate.rate.toFixed(2)}
            </span>{' '}
            {labels.taxLine(facts.taxRate.rate.toFixed(2), facts.taxRate.fiscalYear)}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {labels.taxCheckBefore}{' '}
            <a
              href={TAX_RATE_SOURCE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
            >
              {TAX_RATE_SOURCE.name}
            </a>
            {labels.taxCheckAfter}
          </p>
        </Row>
      )}
    </div>

    {buyerNote && (
      <div className="mt-8 flex gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            {labels.check}
          </h3>
          <p className="text-gray-700 leading-relaxed">{buyerNote}</p>
        </div>
      </div>
    )}
  </section>
);

export default TownFactsPanel;
