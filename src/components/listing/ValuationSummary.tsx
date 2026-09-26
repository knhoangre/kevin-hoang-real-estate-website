/**
 * One line under the asking price: what nearby sales suggest, and a link down
 * to how that was worked out.
 *
 * THIS EXISTS BECAUSE THE PANEL ALONE WAS INVISIBLE. The full valuation sits
 * below the mortgage calculator, which is the right place for the working but
 * the wrong place for the answer: a reader decides whether a price is sensible
 * in the first screenful, beside the price, and very few scroll past a payment
 * calculator to find out. So the answer is stated here and the evidence stays
 * where there is room for it.
 *
 * It says "nearby sales suggest", never "worth" or "value". That wording is the
 * same bracket-not-verdict framing /home-valuation takes, and it is the honest
 * description of a number built from comps that never saw the inside of the
 * house.
 *
 * Renders nothing while loading and nothing on a refusal — no skeleton, because
 * a placeholder that then collapses to nothing on a two-family in a thin town
 * would move the page under the reader's thumb for no reason.
 */
import { ArrowDown } from 'lucide-react';
import { formatPrice } from '@/lib/listings';
import { headlinePrice, type IdxListing } from '@/lib/idxSearch';
import { estimateSuppressed } from '@/lib/idxComps';
import { useListingValuation } from '@/hooks/useListingValuation';

export const VALUATION_ANCHOR = 'what-nearby-sales-say';

const ValuationSummary = ({ listing }: { listing: IdxListing }) => {
  const { data: valuation } = useListingValuation(listing);
  if (!valuation) return null;

  const suppressed = estimateSuppressed(listing.mls_number);
  const estimate = suppressed ? null : valuation.estimate;
  const asking = headlinePrice(listing);
  const gap =
    estimate !== null && asking !== null && asking > 0
      ? (asking - estimate) / estimate
      : null;

  return (
    <a
      href={`#${VALUATION_ANCHOR}`}
      className="group mt-4 flex max-w-xl items-start gap-3 rounded-xl border border-gray-200 bg-bone px-4 py-3 text-sm transition-colors hover:border-champagne-ink print:hidden"
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-champagne" aria-hidden />
      <span className="text-gray-700">
        {estimate !== null ? (
          <>
            {valuation.comps.length} nearby sales suggest{' '}
            <span className="numeral font-semibold text-ink">{formatPrice(estimate)}</span>
            {gap !== null && Math.abs(gap) >= 0.02 && (
              <span className="numeral">
                {' '}— asking is {Math.abs(Math.round(gap * 100))}%{' '}
                {gap > 0 ? 'above' : 'below'}
              </span>
            )}
            .
          </>
        ) : (
          <>
            {/* "Put it between", not "closed between": low and high are the
                ADJUSTED prices, which no house actually sold for. */}
            {valuation.comps.length} nearby sales put it between{' '}
            <span className="numeral font-semibold text-ink">
              {formatPrice(valuation.low)}–{formatPrice(valuation.high)}
            </span>
            .
          </>
        )}{' '}
        <span className="inline-flex items-center gap-1 font-medium text-champagne-ink underline decoration-champagne decoration-2 underline-offset-4 group-hover:decoration-champagne-ink">
          See how
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        </span>
      </span>
    </a>
  );
};

export default ValuationSummary;
