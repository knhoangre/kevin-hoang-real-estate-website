import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TYPE_NAMES, type Headline } from '@/lib/market';
import { money, monthName, pct } from '@/lib/marketText';
import summaryJson from '@/data/market/summary.json';

const summary = summaryJson as Headline[];

/**
 * The town guide's way into its market report: two current figures and a link.
 *
 * The guide is what a town is like and the report is what its homes sell for
 * (see MarketTown); this is the one place the two meet, so the guide stays
 * descriptive and the numbers stay on the page that explains them. Renders
 * nothing for a town without a report.
 */
const TownMarketLink = ({ slug }: { slug: string }) => {
  const h = summary.find((x) => x.slug === slug);
  const lead = h?.types[0];
  if (!h || !lead) return null;
  return (
    <Link
      to={`/market/${slug}`}
      className="group my-12 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-bone p-6 no-underline transition-colors hover:border-champagne"
    >
      <span>
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-champagne-ink">
          {h.town} market report · {monthName(h.month)}
        </span>
        <span className="mt-1 block text-lg font-semibold text-ink">
          {TYPE_NAMES[lead.type].short}: a median {money(lead.median)} over twelve months
          {lead.over !== null && lead.window ? `; ${pct(lead.over)} sold over asking in the last ${lead.window} months` : ''}.
        </span>
        <span className="mt-1 block text-sm text-gray-600">
          Prices over 12, 6 and 3 months, homes for sale, price ranges and rents — updated monthly.
        </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-ink transition-transform group-hover:translate-x-1" aria-hidden />
    </Link>
  );
};

export default TownMarketLink;
