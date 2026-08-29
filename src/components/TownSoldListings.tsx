import { Link } from 'react-router-dom';
import { listingsForTown } from '@/data/soldListings';

/**
 * The homes Kevin has actually closed in one town.
 *
 * WHY THIS IS ON THE TOWN GUIDES. Everything else on a town guide is
 * description — schools, transit, what the streets are like — which is useful
 * but is the same kind of content every other agent site publishes about the
 * same towns. A recorded sale is not description: it is first-party, checkable
 * evidence that this particular broker has transacted on this particular
 * street, and it exists nowhere else. It is the strongest thing these pages can
 * say, and until now it was sitting in a database that no crawler could read.
 *
 * Renders NOTHING when there are no sales in the town. That is the point rather
 * than a fallback: 11 of the 17 guides have no closing behind them, and an
 * "Experience in Wellesley" heading over an empty box or a soft claim would be
 * worse for a reader than silence, as well as being the kind of thin, templated
 * filler this corpus was deliberately cleaned of once.
 *
 * No prices-as-market-data framing either. Ten closings across nine towns is a
 * portfolio, not a data set, and presenting it as evidence of what homes in a
 * town are worth would be a fabricated statistic.
 */
const currency = (value: number | null) =>
  value === null
    ? 'Price on request'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);

const baths = (full: number | null, half: number | null) => {
  const f = full ?? 0;
  const h = half ?? 0;
  return h > 0 ? `${f}.${h}` : String(f);
};

interface Props {
  /** areaServed slug, e.g. "newton-ma". */
  townSlug: string;
  /** Short display name, e.g. "Newton". */
  townName: string;
}

const TownSoldListings = ({ townSlug, townName }: Props) => {
  const listings = listingsForTown(townSlug);
  if (listings.length === 0) return null;

  return (
    <section className="my-12">
      {/*
        Town-scoped heading. The topical-distinctness rule forbids the same
        <h2> string appearing on more than one page, and interpolating the town
        name is what keeps these 6 headings distinct from each other.
      */}
      <h2 className="text-2xl font-bold text-ink mb-3 tracking-tight">
        Homes Kevin has sold in {townName}
      </h2>
      <p className="text-gray-700 leading-relaxed mb-6">
        {listings.length === 1
          ? 'A closing represented in this town.'
          : `${listings.length} closings represented in this town.`}{' '}
        Sale prices are what these homes actually closed at, not what they were
        asked — which is the same evidence a{' '}
        <Link
          to="/home-valuation"
          className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
        >
          written valuation
        </Link>{' '}
        is built from.
      </p>

      <ul className="space-y-3">
        {listings.map((listing) => (
          <li
            key={listing.slug}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-lg border border-gray-200 px-5 py-4"
          >
            <div className="min-w-0">
              <p className="font-semibold text-ink">{listing.address}</p>
              <p className="text-sm text-gray-600">
                {listing.propertyType}
                {listing.bedrooms !== null && ` · ${listing.bedrooms} bd`}
                {(listing.fullBaths !== null || listing.halfBaths !== null) &&
                  ` · ${baths(listing.fullBaths, listing.halfBaths)} ba`}
                {listing.livingArea !== null &&
                  ` · ${listing.livingArea.toLocaleString()} sq ft`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink">{currency(listing.salePrice)}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {listing.status}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-sm text-gray-600">
        <Link
          to="/properties"
          className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
        >
          See every listing
        </Link>{' '}
        across MetroWest and Greater Boston.
      </p>
    </section>
  );
};

export default TownSoldListings;
