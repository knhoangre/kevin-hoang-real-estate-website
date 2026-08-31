/**
 * Formatting shared by everything that renders a sold listing.
 *
 * These lived as private copies in PropertiesList (`formatCurrency`,
 * `formatBaths`) and TownSoldListings (`currency`, `baths`) — the same two
 * functions written twice, with the second copy already drifting: one returned
 * "Price on Request" and the other "Price on request" for the identical null.
 * The detail page would have been the third copy. One module instead, for the
 * same reason siteConfig owns NAP: a value a reader sees in three places has to
 * be the same value in all three.
 */
import type { SoldListing } from '@/data/soldListings';

/** Whole dollars. A null price is a fact about the row, not a zero. */
export const formatPrice = (value: number | null) =>
  value === null
    ? 'Price on request'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

/** MLS bath convention: 2 full + 1 half reads "2.1", not "2.5". */
export const formatBaths = (full: number | null, half: number | null) => {
  const f = full ?? 0;
  const h = half ?? 0;
  return h > 0 ? `${f}.${h}` : String(f);
};

/**
 * "2026-03-14" -> "March 2026".
 *
 * Month and year rather than the exact day: the day a deed records is noise to
 * a reader, and a month is the granularity anyone actually reasons about when
 * judging how current a sale is.
 *
 * Parsed as UTC explicitly. `new Date('2026-03-14')` is already UTC midnight,
 * which formats as March 13 in every US timezone unless the formatter is told
 * otherwise — and a sale printed one day early is exactly the kind of quiet
 * wrongness that makes a reader distrust the rest of the page.
 */
export const formatSoldMonth = (iso: string | null) => {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

/** "12 Maple St, Newton, MA 02459" — one address format for the whole site. */
export const fullAddress = (listing: SoldListing) =>
  `${listing.address}, ${listing.town}, MA ${listing.zipCode}`.trim();

/**
 * How the sale price compared to the asking price, or null when the comparison
 * cannot be made honestly.
 *
 * Returns null unless BOTH numbers are present and the list price is positive.
 * A "closed at 100% of asking" line derived from a missing list price would be
 * a fabricated statistic about a real transaction, which is the worst kind.
 * Rounded to a whole percent — the underlying prices are exact, but implying
 * two-decimal precision about a negotiation is false confidence.
 */
export const percentOfAsking = (listing: SoldListing): number | null => {
  const { salePrice, listPrice } = listing;
  if (salePrice === null || listPrice === null || listPrice <= 0) return null;
  return Math.round((salePrice / listPrice) * 100);
};

/**
 * "Represented the buyer" — or null, which is the honest rendering of an
 * unrecorded side. A sale shown with no side stated is ambiguous; a sale shown
 * with the wrong side stated is a false claim about someone else's client.
 */
export const representationLabel = (listing: SoldListing) => {
  switch (listing.represented) {
    case 'buyer':
      return 'Represented the buyer';
    case 'seller':
      return 'Represented the seller';
    case 'both':
      return 'Represented both parties';
    default:
      return null;
  }
};
