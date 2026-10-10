/**
 * What comparable closed sales say this home is worth.
 *
 * A FULL-WIDTH SECTION, below the grid, beside ListingPayment — for the reason
 * that component's own header gives: the aside is for the two things identical
 * on every listing (call, text), and 320px holds a total and nothing else. This
 * is the part that is about this house. It sits directly above SimilarListings
 * so that grid of cards reads as the chart's detail view.
 *
 * THE EPISTEMIC FRAME IS THE DESIGN, and it is lifted deliberately from
 * ListingPayment:
 *
 *   What is known      — the closed sales themselves: address, distance, date,
 *                        floor area, what they sold for. Facts from the feed.
 *   Derived, cited     — the market trend, the marginal rate per square foot,
 *                        and each adjustment. Every one computed from the sales
 *                        listed on this page and stated with what it came from,
 *                        so a reader can re-do it.
 *   Assumed            — nothing. Any figure that cannot be derived is dropped
 *                        rather than filled in, which is why this section is
 *                        absent rather than empty.
 *   Not modelled       — condition, layout, the particular lot, and anything
 *                        unrecorded. Named out loud, because this is the half
 *                        an automated estimate cannot see and pretending
 *                        otherwise is the whole failure mode.
 *
 * WHY THIS DOES NOT CONTRADICT /home-valuation. That page says an automated
 * estimate "is a starting point and nothing more" and that models "have no way
 * to see condition". This page agrees with it in those words rather than
 * arguing with it: the number is offered as a bracket built from named sales, a
 * reader is told exactly what it could not look at, and the closing line sends
 * anyone who wants a real answer to a walkthrough. An estimator that oversold
 * itself would make a liar of the money page.
 */
import { Link } from 'react-router-dom';
import { LineChart } from 'lucide-react';
import { formatBathsShort, formatPrice } from '@/lib/listings';
import { headlinePrice, type IdxListing } from '@/lib/idxSearch';
import { estimateSuppressed } from '@/lib/idxComps';
import { comparableAsking, LIKENESS, MAX_COMPS, toMiles } from '@/lib/valuation';
import { useListingValuation } from '@/hooks/useListingValuation';
import CompsScatter from '@/components/listing/CompsScatter';
import { VALUATION_ANCHOR } from '@/components/listing/ValuationSummary';
import { listingPath } from '@/lib/listingUrl';

/** One decimal, and never "0.0 miles" for something across the street. */
const formatDistance = (km: number | null): string | null => {
  if (km === null) return null;
  const miles = toMiles(km);
  if (miles < 0.1) return 'same street';
  return `${miles.toFixed(1)} mi`;
};

const formatMonths = (months: number): string => {
  const rounded = Math.round(months);
  if (rounded <= 0) return 'this month';
  if (rounded === 1) return '1 month ago';
  return `${rounded} months ago`;
};

const ListingValuation = ({ listing }: { listing: IdxListing }) => {
  // Shared with ValuationSummary beside the asking price; react-query keys on
  // the MLS number, so the two make one request between them.
  const { data: valuation } = useListingValuation(listing);

  // A refusal renders nothing at all. There is no "we could not work this out"
  // panel, because a heading over an apology is the thin templated filler this
  // site was cleaned of once — and because a reader who is shown nothing has
  // learned nothing false.
  if (!valuation) return null;

  const suppressed = estimateSuppressed(listing.mls_number);
  const estimate = suppressed ? null : valuation.estimate;
  // Null for a placeholder list price, so no gap line and no mark on the chart.
  const asking = comparableAsking(headlinePrice(listing));
  const label = listing.address ?? `MLS ${listing.mls_number}`;
  const distance = formatDistance(valuation.medianDistanceKm);

  // The comparison a reader is actually making, stated once rather than left
  // for them to do in their head. Only when both numbers are real — the same
  // discipline percentOfAsking() keeps in listings.ts.
  const gap =
    estimate !== null && asking !== null && asking > 0
      ? (asking - estimate) / estimate
      : null;

  return (
    <section
      id={VALUATION_ANCHOR}
      // The navbar is fixed at h-20; without the margin the heading lands
      // underneath it when the summary's "See how" link jumps here.
      className="mt-16 scroll-mt-28 border-t border-gray-200 pt-10 print:hidden"
      aria-labelledby="valuation-heading"
    >
      <h2
        id="valuation-heading"
        className="flex items-start gap-3 font-display text-2xl font-semibold tracking-tight text-ink"
      >
        <LineChart className="mt-1 h-6 w-6 shrink-0 text-champagne-ink" aria-hidden />
        {/* Interpolates the address, like every other heading on this page, so
            two listings never emit the same h2. */}
        <span>What nearby sales say about {label}</span>
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
        Built from {valuation.comps.length} closed{' '}
        {valuation.comps.length === 1 ? 'sale' : 'sales'} {valuation.tier.label}
        {distance ? `, a median of ${distance} away` : ''}. Closed prices, not
        asking prices.
      </p>
      {/* The rule, in the reader's terms. It is what makes these five the
          comparables rather than five sales that happened to be nearby, and
          the numbers are read from LIKENESS so the sentence cannot outlive a
          change to it. */}
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
        Each one is the same kind of property, within{' '}
        {Math.round(LIKENESS.sqftTolerance * 100)}% of this home&rsquo;s size, and
        within{' '}
        {listing.prop_type === 'MF'
          ? 'two bedrooms (counted across every unit)'
          : 'one bedroom'}{' '}
        and one bathroom of it. Where more than {MAX_COMPS} sales matched, these
        are the nearest and most alike.
      </p>

      {/* --- The number, or the honest absence of one --- */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-bone p-7">
        {valuation.withheld === 'far-from-asking' ? (
          <>
            {/* No number AND no headline range: a range printed large under an
                asking price twice its size is the same claim as a number. The
                figures are in the sentence, where they read as the reason. */}
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              No estimate for this home
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-700">
              The closest matching sales point to{' '}
              <span className="numeral">
                {formatPrice(valuation.low)}–{formatPrice(valuation.high)}
              </span>
              {asking !== null && (
                <>
                  , a long way from the{' '}
                  <span className="numeral">{formatPrice(asking)}</span> asking
                  price
                </>
              )}
              . When the two are that far apart it is almost always because
              something about {label} is not in the sale records — the
              building, the condition, the exact spot — so no estimate is given.
              The sales are listed below.
            </p>
          </>
        ) : estimate !== null ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              These sales suggest
            </p>
            <p className="numeral mt-2 text-4xl font-semibold text-ink sm:text-5xl">
              {formatPrice(estimate)}
            </p>
            {/* Five units in one building can close at one price, and "between
                $415,000 and $415,000" is not a range. */}
            {valuation.high > valuation.low && (
              <p className="numeral mt-2 text-sm text-gray-600">
                Most of the evidence falls between {formatPrice(valuation.low)} and{' '}
                {formatPrice(valuation.high)}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              What the comparable sales show
            </p>
            <p className="numeral mt-2 text-3xl font-semibold text-ink sm:text-4xl">
              {formatPrice(valuation.low)} – {formatPrice(valuation.high)}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
              {/* The reason is stated, because "no number" alone reads as the
                  feature failing — and each reason tells the reader something
                  true about this house or this market. */}
              {suppressed
                ? 'A single estimate is not shown for this listing. The comparable sales behind it are below.'
                : valuation.withheld === 'larger-than-comps'
                  ? `${label} is larger than every comparable sale nearby, so one number would be a projection past the evidence rather than a reading of it. The range is what these sales show.`
                  : valuation.withheld === 'smaller-than-comps'
                    ? `${label} is smaller than every comparable sale nearby, so one number would be a projection past the evidence rather than a reading of it. The range is what these sales show.`
                    : valuation.withheld === 'lot-beyond-comps'
                      ? `${label} sits on far more land than any comparable sale nearby. Past a point a lot is priced as land, not as the garden of a house, and these sales say nothing about that. The range is what they show for the house alone.`
                      : 'These sales disagree too much to name one number. That is worth knowing in itself — it usually means the houses nearby are less alike than their specifications suggest.'}
            </p>
          </>
        )}

        {gap !== null && Math.abs(gap) >= 0.02 && (
          <p className="numeral mt-4 text-sm text-gray-700">
            Asking {formatPrice(asking)} —{' '}
            <span className="font-semibold">
              {Math.abs(gap * 100).toFixed(0)}% {gap > 0 ? 'above' : 'below'}
            </span>{' '}
            what these sales suggest.
          </p>
        )}
      </div>

      <CompsScatter
        comps={valuation.comps}
        subjectArea={listing.living_area ?? 0}
        askingPrice={asking}
        estimate={estimate}
        low={valuation.low}
        high={valuation.high}
        subjectLabel={label}
      />

      {/* --- Derived, cited --- */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Market since these sold
          </dt>
          <dd className="numeral mt-1 text-xl font-semibold text-ink">
            {valuation.monthlyTrend === 0
              ? 'No measurable trend'
              : `${valuation.monthlyTrend > 0 ? '+' : '−'}${Math.abs(valuation.monthlyTrend * 100).toFixed(1)}% a month`}
          </dd>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {valuation.monthlyTrend === 0
              ? 'These sales show no trend this method is willing to call real, so no adjustment was made for the passage of time.'
              : 'Fitted across the sales in this town, and applied to each one to bring it to today.'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Each extra square foot
          </dt>
          <dd className="numeral mt-1 text-xl font-semibold text-ink">
            {valuation.marginalSqft ? formatPrice(Math.round(valuation.marginalSqft)) : '—'}
          </dd>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            What one more square foot is worth here — not the headline price per
            square foot, which is roughly twice this and the wrong number to
            adjust with.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Evidence behind it
          </dt>
          <dd className="numeral mt-1 text-xl font-semibold text-ink">
            {valuation.comps.length} {valuation.comps.length === 1 ? 'sale' : 'sales'}
          </dd>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {valuation.tier.label}
            {distance ? `, median ${distance} away` : ''}.
          </p>
        </div>
      </div>

      {/* --- What is known: the sales themselves --- */}
      <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">
        The sales this is built from
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th scope="col" className="py-2 pr-4 font-semibold">Address</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Sold</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Away</th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">Beds</th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">Baths</th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">Sq ft</th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">Sold for</th>
              <th scope="col" className="py-2 text-right font-semibold">
                Adjusted to this home
              </th>
            </tr>
          </thead>
          <tbody>
            {/* The subject first, so each sale is read against it rather than
                against a specification further up the page. */}
            <tr className="border-b border-gray-200 bg-bone align-top">
              <td className="py-3 pr-4 font-semibold text-ink">
                {label}
                <span className="block text-xs font-normal text-gray-500">This home</span>
              </td>
              <td className="py-3 pr-4 text-gray-500">—</td>
              <td className="py-3 pr-4 text-gray-500">—</td>
              <td className="numeral py-3 pr-4 text-right font-semibold text-ink">
                {listing.bedrooms ?? '—'}
              </td>
              <td className="numeral py-3 pr-4 text-right font-semibold text-ink">
                {listing.full_baths === null && listing.half_baths === null
                  ? '—'
                  : formatBathsShort(listing.full_baths, listing.half_baths)}
              </td>
              <td className="numeral py-3 pr-4 text-right font-semibold text-ink">
                {listing.living_area?.toLocaleString() ?? '—'}
              </td>
              <td className="py-3 pr-4 text-right text-gray-500">—</td>
              <td className="py-3 text-right text-gray-500">—</td>
            </tr>
            {valuation.comps.map((comp) => {
              const away = formatDistance(comp.distance_km);
              return (
                <tr key={comp.mls_number} className="border-b border-gray-100 align-top">
                  <td className="py-3 pr-4 text-ink">
                    {/* Every comp is a real listing on this site, so it links to
                        one. A comp a reader cannot go and look at is an
                        assertion rather than evidence. */}
                    <Link
                      // A comp row carries no state of its own. It does not
                      // need one: every comp query is filtered to the
                      // subject's state, so this listing's state is the comp's.
                      to={listingPath({ ...comp, state: listing.state })}
                      className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
                    >
                      {comp.address ?? `MLS ${comp.mls_number}`}
                    </Link>
                    {comp.town && <span className="block text-xs text-gray-500">{comp.town}</span>}
                  </td>
                  <td className="numeral py-3 pr-4 text-gray-700">
                    {formatMonths(comp.monthsAgo)}
                  </td>
                  <td className="numeral py-3 pr-4 text-gray-700">{away ?? '—'}</td>
                  <td className="numeral py-3 pr-4 text-right text-gray-700">
                    {comp.bedrooms ?? '—'}
                  </td>
                  <td className="numeral py-3 pr-4 text-right text-gray-700">
                    {comp.full_baths === null && comp.half_baths === null
                      ? '—'
                      : formatBathsShort(comp.full_baths, comp.half_baths)}
                  </td>
                  <td className="numeral py-3 pr-4 text-right text-gray-700">
                    {comp.living_area?.toLocaleString() ?? '—'}
                  </td>
                  <td className="numeral py-3 pr-4 text-right text-gray-700">
                    {formatPrice(comp.sale_price)}
                  </td>
                  <td className="numeral py-3 text-right font-semibold text-ink">
                    {formatPrice(Math.round(comp.adjustedPrice))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        &ldquo;Adjusted to this home&rdquo; is what each sale suggests{' '}
        {label} is worth, after correcting for when it sold and how it differs in
        size and features — the same line-by-line comparison an appraiser makes.
      </p>

      {/* --- Not modelled --- */}
      <div className="mt-10 rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500">
          What this could not look at
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-gray-700">
          {valuation.notModelled.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-champagne" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          Condition is usually the largest single variable in a price, and no
          public record contains it — a gut renovation and twenty years of
          deferred maintenance look identical in this data.{' '}
          <Link
            to="/blog/automated-home-valuations-what-they-miss"
            className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
          >
            Why four numbers called your home&rsquo;s value disagree
          </Link>{' '}
          and{' '}
          <Link
            to="/blog/how-to-read-a-comp-massachusetts"
            className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
          >
            how to read a comp
          </Link>{' '}
          both take this apart properly. For a number someone has stood inside
          the house to reach, that is{' '}
          <Link
            to="/home-valuation"
            className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
          >
            a written valuation
          </Link>
          .
        </p>
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          An estimate for information only — not an appraisal, and not a
          statement of what this home will sell for. See our{' '}
          <Link
            to="/disclaimer"
            className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
          >
            disclaimer
          </Link>
          .
        </p>
      </div>
    </section>
  );
};

export default ListingValuation;
