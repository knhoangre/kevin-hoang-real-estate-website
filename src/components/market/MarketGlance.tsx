import type { ReactNode } from 'react';
import { DataTable, Thin } from '@/components/market/MarketParts';
import type { Edge, Headline, SaleType } from '@/lib/market';
import { money, months1, pct, ratioPct } from '@/lib/marketText';
import summaryJson from '@/data/market/summary.json';

const summary = summaryJson as Headline[];

/**
 * One type's towns side by side, from summary.json: the table on /market, and on
 * its Vietnamese and Chinese partners, /vi/thi-truong and /zh/shichang.
 *
 * ONE TABLE, THREE LANGUAGES. Only the words are passed in; which columns there
 * are, what each figure is and how it is formatted are decided here, so the three
 * pages cannot show the same report differently. Words are literal props rather
 * than t(), because i18n is pinned to 'en' while the pages are generated.
 */
export interface GlanceWords {
  /** The seven column headings, in order: town, median, ratio, over, for sale, supply, edge. */
  head: [string, string, string, string, string, string, string];
  edge: Record<Edge, string>;
  caption: string;
}

const cell = (s: string) => (s === '—' ? <Thin /> : s);

const MarketGlance = ({
  type,
  heading,
  words,
  town,
}: {
  type: SaleType;
  heading: string;
  words: GlanceWords;
  /** The town cell: a link to its report, named the way this page names it. */
  town: (h: Headline) => ReactNode;
}) => {
  const rows = summary
    .map((h) => ({ h, t: h.types.find((x) => x.type === type) }))
    .filter((x): x is { h: Headline; t: Headline['types'][number] } => Boolean(x.t));
  if (rows.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-ink">{heading}</h3>
      <DataTable
        minWidth="min-w-[46rem]"
        caption={words.caption}
        head={words.head}
        rows={rows.map(({ h, t }) => [
          town(h),
          cell(money(t.median)),
          cell(ratioPct(t.ratio)),
          cell(pct(t.over)),
          String(t.available),
          cell(months1(t.monthsSupply)),
          t.edge ? words.edge[t.edge] : <Thin key="e" />,
        ])}
      />
    </div>
  );
};

export default MarketGlance;
