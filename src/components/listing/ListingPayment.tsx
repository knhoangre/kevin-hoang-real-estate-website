import { Calculator } from 'lucide-react';
import HomeCalculator, { type CalculatorSeed } from '@/components/calculator/HomeCalculator';
import { canBeInvestment } from '@/lib/mortgage';
import { headlinePrice, type IdxListing } from '@/lib/idxSearch';

/**
 * "What would this cost me a month" — and what it would return rented out, and
 * what a seller would walk away with at this price — answered with THIS
 * listing's numbers.
 *
 * The calculator itself is HomeCalculator, shared with /calculator and
 * /vi/cong-cu-tinh-toan since 2026-09-27; this file is only what a listing
 * knows. See that component for what is known, derived, assumed and example.
 *
 * A FULL-WIDTH SECTION, not a sidebar card. It began as one, sharing the aside
 * with the call and text buttons, and 320px fits a total and a column of inputs
 * and nothing else. The sidebar is for the two things that are the same on
 * every listing (call, text); this is the part that is about this house.
 *
 * The seller view is here because a seller browsing what a house like theirs
 * lists for is asking what they would keep at that price — the listing page
 * had every number but that one.
 */
const ListingPayment = ({ listing }: { listing: IdxListing }) => {
  const hasAssociation = Boolean(listing.hoa) || (listing.hoa_fee ?? 0) > 0;

  const seed: CalculatorSeed = {
    price: headlinePrice(listing) ?? 0,
    annualTaxes: listing.taxes ?? 0,
    taxSource:
      listing.taxes === null ? { from: 'missing' } : { from: 'listing', year: listing.tax_year },
    monthlyHoa: listing.hoa_fee ?? 0,
    // Shown only where an association actually applies, so a single-family is
    // not asked about a fee it does not have.
    hoaSource: !hasAssociation ? null : listing.hoa_fee !== null ? 'listing' : 'listing-no-amount',
    propType: listing.prop_type,
    rentLookup: { town: listing.town, bedrooms: listing.bedrooms },
    exampleRent: 0,
    views: canBeInvestment(listing.prop_type) ? ['live', 'invest', 'sell'] : ['live', 'sell'],
  };

  return (
    <section
      id="payment"
      className="mt-16 border-t border-gray-200 pt-10 print:hidden"
      aria-labelledby="payment-heading"
    >
      <h2
        id="payment-heading"
        className="flex items-start gap-3 font-display text-2xl font-semibold tracking-tight text-ink"
      >
        <Calculator className="mt-1 h-6 w-6 shrink-0 text-champagne-ink" aria-hidden />
        {/* Interpolates the address, like every other heading on this page, so
            two listings never emit the same <h2>. */}
        <span>Running the numbers on {listing.address ?? `MLS ${listing.mls_number}`}</span>
      </h2>

      <div className="mt-5">
        {/* English whatever the toggle says: the rest of this page is English,
            and a calculator in another language beside it reads as a bug. */}
        <HomeCalculator lang="en" context="listing" seed={seed} />
      </div>
    </section>
  );
};

export default ListingPayment;
