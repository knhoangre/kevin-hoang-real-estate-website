import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import HoldPanel from '@/components/investments/HoldPanel';
import RulesPanel from '@/components/investments/RulesPanel';
import { Chip, LINK, Panel, Spinner } from '@/components/investments/ui';
import { VALUATION_ANCHOR } from '@/components/listing/ValuationSummary';
import { useDealListing, useDealParcel, useRentEvidence } from '@/hooks/useInvestmentData';
import { useListingValuation } from '@/hooks/useListingValuation';
import { useOfficeName } from '@/hooks/useOfficeName';
import { estimateSuppressed } from '@/lib/idxComps';
import { decodeCodes } from '@/lib/idxDecode';
import { isAvailable, photoUrl, propTypeLabel, statusLabel, type IdxListing } from '@/lib/idxSearch';
import { fieldFlags, isDwelling, remarkFlags, usableTaxes } from '@/lib/investment';
import { formatBaths, formatPrice } from '@/lib/listings';
import { listingPath } from '@/lib/listingUrl';
import { parcelFits, type Parcel } from '@/lib/parcels';
import { rentForListing } from '@/lib/rentComps';
import type { Valuation } from '@/lib/valuation';

/**
 * /investments?mls=<n> — one home, analysed.
 *
 * Reads the listing, the town's leases, the assessor's parcel and the
 * comparable sales, then hands a seeded calculator to the strategy panel. The
 * parcel and the sales are context and may fail on their own; the listing and
 * the leases are what the numbers are made of, so the panel waits for both.
 */

const INVESTABLE = ['SF', 'CC', 'MF'];

const Fact = ({ label, children, source }: { label: string; children: ReactNode; source?: string }) => (
  <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
    <dt className="text-sm text-gray-600">{label}</dt>
    <dd className="numeral text-sm font-medium text-ink sm:text-right">
      {children}
      {source && <span className="ml-2 text-xs font-normal text-gray-500">{source}</span>}
    </dd>
  </div>
);

const pctText = (n: number) => `${Math.round(n * 100)}%`;

const nearbySales = (v: Valuation | null | undefined, mls: string): ReactNode => {
  if (!v || estimateSuppressed(mls)) return null;
  if (v.estimate !== null) {
    return (
      <>
        about {formatPrice(Math.round(v.estimate))}{' '}
        <span className="text-xs font-normal text-gray-500">
          ({formatPrice(Math.round(v.low))}–{formatPrice(Math.round(v.high))})
        </span>
      </>
    );
  }
  return (
    <>
      {formatPrice(Math.round(v.low))}–{formatPrice(Math.round(v.high))}{' '}
      <span className="text-xs font-normal text-gray-500">(a range, no single figure)</span>
    </>
  );
};

const DataPanel = ({
  listing,
  parcel,
  parcelLoading,
  valuation,
}: {
  listing: IdxListing;
  parcel: Parcel | null | undefined;
  parcelLoading: boolean;
  valuation: Valuation | null | undefined;
}) => {
  const heating = decodeCodes('HEATING', listing.heating, listing.prop_type);
  const sewer = decodeCodes('SEWER', listing.sewer, listing.prop_type);
  const lotFromListing =
    listing.lot_size !== null
      ? `${Math.round(listing.lot_size).toLocaleString()} sq ft`
      : listing.acres !== null
        ? `${listing.acres} acres`
        : null;
  const sales = nearbySales(valuation, listing.mls_number);
  const taxes = usableTaxes(listing);

  return (
    <section aria-labelledby="known-heading" className="mt-12">
      <h2 id="known-heading" className="text-xl font-semibold uppercase tracking-wide text-ink">
        What we know about it
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-gray-600">
        From the listing, the town&rsquo;s assessor and recent sales nearby. Each figure says where it came from.
      </p>
      <div className="mt-6 grid gap-x-12 lg:grid-cols-2">
        <dl className="divide-y divide-gray-100 border-y border-gray-200">
          <Fact label="Asking price" source="listing">{formatPrice(listing.list_price)}</Fact>
          {taxes !== null && (
            <Fact label="Property taxes" source={listing.tax_year ? `listing, ${listing.tax_year}` : 'listing'}>
              {formatPrice(taxes)} a year
            </Fact>
          )}
          {(listing.hoa || (listing.hoa_fee ?? 0) > 0) && (
            <Fact label="Condo / HOA fee" source="listing">
              {listing.hoa_fee ? `${formatPrice(listing.hoa_fee)} a month` : 'not stated'}
            </Fact>
          )}
          {listing.year_built && <Fact label="Built" source="listing">{listing.year_built}</Fact>}
          {listing.living_area && (
            <Fact label="Living area" source="listing">{listing.living_area.toLocaleString()} sq ft</Fact>
          )}
          {lotFromListing && <Fact label="Lot" source="listing">{lotFromListing}</Fact>}
          {heating && <Fact label="Heating" source="listing">{heating}</Fact>}
          {sewer && <Fact label="Sewer" source="listing">{sewer}</Fact>}
          {sales && (
            <Fact label="Like homes nearby sold for" source="comparable sales">
              {sales}
            </Fact>
          )}
        </dl>
        <dl className="divide-y divide-gray-100 border-y border-gray-200 max-lg:mt-6 max-lg:border-t-0">
          {parcelLoading ? (
            <Fact label="Assessor’s record">reading…</Fact>
          ) : parcel ? (
            <>
              {parcel.total && (
                <Fact label="Assessed value" source={parcel.fy ? `assessor, FY${parcel.fy}` : 'assessor'}>
                  {formatPrice(parcel.total)}
                </Fact>
              )}
              {parcel.land && <Fact label="Land" source="assessor">{formatPrice(parcel.land)}</Fact>}
              {parcel.building !== null && <Fact label="Buildings" source="assessor">{formatPrice(parcel.building)}</Fact>}
              {parcel.landShare !== null && (
                <Fact label="Land share of the value" source="assessor">
                  {pctText(parcel.landShare)}
                </Fact>
              )}
              {parcel.lotSqft && (
                <Fact label="Lot" source={parcel.lotSource === 'polygon' ? 'measured from the parcel map' : 'assessor'}>
                  {parcel.lotSqft.toLocaleString()} sq ft
                </Fact>
              )}
              {parcel.zoning && <Fact label="Zoning district" source="assessor">{parcel.zoning}</Fact>}
              {parcel.useLabel && <Fact label="Assessed as" source="assessor">{parcel.useLabel}</Fact>}
              {parcel.grossArea && (
                <Fact label="Gross building area" source="assessor">{parcel.grossArea.toLocaleString()} sq ft</Fact>
              )}
              {parcel.lastSale && (
                <Fact label="Last recorded sale" source="assessor">
                  {formatPrice(parcel.lastSale.price)}, {parcel.lastSale.date.slice(0, 4)}
                </Fact>
              )}
            </>
          ) : (
            <Fact label="Assessor’s record">
              {listing.prop_type === 'CC' ? 'not found for this unit' : 'not found for this address'}
            </Fact>
          )}
        </dl>
      </div>
      {sales && (
        <p className="mt-3 text-xs text-gray-500">
          The comparable sales, and how each was adjusted, are on{' '}
          <Link to={`${listingPath(listing)}#${VALUATION_ANCHOR}`} className={LINK}>
            the listing&rsquo;s page
          </Link>
          .
        </p>
      )}
    </section>
  );
};

const DealView = ({ mls, enabled }: { mls: string; enabled: boolean }) => {
  const deal = useDealListing(mls, enabled);
  const listing = deal.data ?? null;
  const investable = Boolean(listing && listing.feed !== 'sold' && INVESTABLE.includes(listing.prop_type ?? ''));
  const rents = useRentEvidence(listing?.town ?? null, listing?.state ?? 'MA', enabled && investable);
  const parcel = useDealParcel(listing, enabled && investable);
  const valuation = useListingValuation(investable ? listing : null);
  const office = useOfficeName(listing?.list_office_id);

  const back = (
    <Link
      to={listing?.town ? `/investments?town=${encodeURIComponent(listing.town)}` : '/investments'}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-champagne-ink"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {listing?.town ? `Homes for sale in ${listing.town}` : 'All investments'}
    </Link>
  );

  if (deal.isLoading) return <Spinner label="Reading the listing…" />;
  if (deal.isError || !listing) {
    return (
      <div>
        {back}
        <Panel className="mt-6">
          That listing is not in the feed any more — it may have sold or been withdrawn.{' '}
          <Link to="/investments" className={LINK}>
            Look at what is for sale
          </Link>
          .
        </Panel>
      </div>
    );
  }
  if (!investable) {
    return (
      <div>
        {back}
        <Panel className="mt-6">
          This analysis is for single-family homes, condos and multi-families that are for sale.{' '}
          <Link to={listingPath(listing)} className={LINK}>
            Back to the listing
          </Link>
          .
        </Panel>
      </div>
    );
  }

  const flags = [
    ...fieldFlags({
      year_built: listing.year_built,
      heatingLabel: decodeCodes('HEATING', listing.heating, listing.prop_type),
      sewerLabel: decodeCodes('SEWER', listing.sewer, listing.prop_type),
      price_cut: listing.price_cut,
    }),
    ...remarkFlags(listing.remarks),
  ];
  const ev = rents.data ?? { leases: [], asking: [], capped: false };
  const dwelling = isDwelling(listing);
  const rent = dwelling ? rentForListing(listing, ev.leases, ev.asking, ev.capped) : { gross: null, units: [], mix: null };
  const fittingParcel = parcelFits(listing.prop_type, parcel.data);

  return (
    <div>
      {back}

      {/* ---------------- Header ---------------- */}
      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl bg-gray-100">
          {(listing.photo_count ?? 0) > 0 ? (
            <img
              src={photoUrl(listing.mls_number, 0, 'card')}
              alt={`${listing.address ?? 'Listing'}, ${listing.town ?? ''}`}
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-sm text-gray-400">No photo</div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            {propTypeLabel(listing.prop_type)}
            {statusLabel(listing.status) && !isAvailable(listing.status) && ` · ${statusLabel(listing.status)}`}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
            {listing.address}
            {listing.town ? `, ${listing.town}` : ''}
          </h2>
          <p className="numeral mt-2 text-xl font-semibold text-ink">{formatPrice(listing.list_price)}</p>
          <p className="numeral mt-1 text-sm text-gray-600">
            {[
              listing.bedrooms !== null ? `${listing.bedrooms} bed` : null,
              listing.full_baths !== null ? formatBaths(listing.full_baths, listing.half_baths) : null,
              listing.living_area ? `${listing.living_area.toLocaleString()} sq ft` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {flags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {flags.map((f) => (
                <Chip key={f.key} title={f.detail}>
                  {f.label}
                </Chip>
              ))}
            </div>
          )}
          <p className="mt-4 text-sm">
            <Link to={listingPath(listing)} className={`inline-flex items-center gap-1.5 ${LINK}`}>
              The full listing, photos and remarks
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
          <p className="mt-3 text-xs text-gray-500">
            {office ? `Listing courtesy of ${office}. ` : ''}Photo from MLS PIN.
          </p>
        </div>
      </div>

      <DataPanel listing={listing} parcel={fittingParcel} parcelLoading={parcel.isLoading} valuation={valuation.data} />

      {/* ---------------- Strategy ---------------- */}
      <section aria-labelledby="strategy-heading" className="mt-16 border-t border-gray-200 pt-10">
        <h2 id="strategy-heading" className="text-xl font-semibold uppercase tracking-wide text-ink">
          As a rental
        </h2>
        <p className="mt-2 mb-8 max-w-3xl text-sm text-gray-600">
          Buy it, rent it out, and hold it: what it earns before the mortgage, and what is left after. Every figure can
          be changed.
        </p>
        {!dwelling && (
          <Panel className="mb-8">
            This listing has no bathroom and no floor area — it is most likely a parking space or a storage unit, not a
            home to rent. The figures below start with no rent.
          </Panel>
        )}
        {rents.isLoading ? (
          <Spinner label={`Reading leases in ${listing.town}…`} />
        ) : (
          <HoldPanel
            key={listing.mls_number}
            seed={{ listing, rent, taxes: usableTaxes(listing), town: listing.town ?? '' }}
          />
        )}
      </section>

      <RulesPanel
        context={{
          strategy: 'hold',
          propType: listing.prop_type,
          yearBuilt: listing.year_built,
          septic: flags.some((f) => f.key === 'septic'),
          units: rent.mix?.units ?? 1,
        }}
      />
    </div>
  );
};

export default DealView;
