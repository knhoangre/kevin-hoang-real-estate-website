import { useMemo, useState } from 'react';
import { Link, type SetURLSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { listAnalyses, type SavedAnalysis } from '@/lib/investmentStore';
import { ArrowRight } from 'lucide-react';
import ListingCard from '@/components/listing/ListingCard';
import { Chip, LINK, Panel, Spinner } from '@/components/investments/ui';
import { useRentEvidence, useScreenerListings, useTownParcels } from '@/hooks/useInvestmentData';
import { aduMaxSqft, byMetric, fieldFlags, isDwelling, remarkFlags, screenMetrics, usableTaxes, type Flag, type ScreenMetrics } from '@/lib/investment';
import { ASSUMPTIONS, screenDefaults } from '@/lib/investmentAssumptions';
import { INVESTMENT_TYPES, SCREENER_LIMIT, type ScreenerListing, type ScreenerQuery } from '@/lib/investmentData';
import { decodeCodes } from '@/lib/idxDecode';
import { townsWithListings } from '@/lib/idxSearch';
import { formatPrice } from '@/lib/listings';
import { estimateInsurance } from '@/lib/mortgage';
import { describeRent, rentForListing, type ListingRent } from '@/lib/rentComps';
import { parcelFits, type Parcel } from '@/lib/parcels';
import { SITE } from '@/lib/siteConfig';
import { NativeSelect } from '@/components/ui/native-select';

/**
 * /investments with no listing open: one town's homes for sale, ranked by what
 * an investor would sort them by.
 *
 * ONE NAMED NUMBER PER TAB, never a blended "deal score". A score would be a
 * precision nobody could check — the same reason valuation.ts publishes no
 * confidence percentage. Each tab says what it sorts by, and each card shows
 * where its numbers came from.
 *
 * Nothing on a card is a value estimate. The comparable-sales engine runs only
 * when one home is opened, which keeps the IDX valuation rules about one
 * listing at a time and the page to three database requests and a handful to
 * the Commonwealth's parcel layer.
 */

export type Sort = 'cash' | 'value' | 'land' | 'lot';

const SORTS: { id: Sort; label: string; explain: string }[] = [
  {
    id: 'cash',
    label: 'Cash flow',
    explain:
      'Highest cap rate first: what the home would earn a year, after expenses and before the mortgage, against its price. Rent is the median of what similar homes in town actually leased for.',
  },
  {
    id: 'value',
    label: 'Below assessment',
    explain:
      'Lowest asking price against the town’s assessed value first. A home asking well under its assessment is often one that needs work — the listing’s own words about condition are quoted on the card.',
  },
  {
    id: 'land',
    label: 'Land value',
    explain:
      'Houses whose land is the largest share of their assessed value first. Where the building is worth little next to its lot, the lot is what is being sold — the usual sign of a teardown or a rebuild.',
  },
  {
    id: 'lot',
    label: 'Large lots',
    explain:
      'Houses on the largest lots first, from the assessor\u2019s records: room for an accessory dwelling unit, allowed by right on a single-family lot, and sometimes for more. Open one to see how its lot compares with the typical lot in its zoning district.',
  },
];

const PRICE_STEPS = [300_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000];
const PAGE = 24;

const DEFAULT_TOWN = SITE.address.addressLocality;

/** The screener's state, read from the URL (after hydration — see Investments.tsx). */
const queryFrom = (p: URLSearchParams): ScreenerQuery & { sort: Sort } => {
  const type = p.get('type');
  const num = (k: string) => {
    const n = Number(p.get(k));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const sort = p.get('sort');
  return {
    town: p.get('town') || DEFAULT_TOWN,
    state: 'MA',
    type: type === 'SF' || type === 'CC' || type === 'MF' ? type : '',
    min: num('min'),
    max: num('max'),
    order: p.get('order') === 'low' ? 'low' : 'high',
    sort: sort === 'value' || sort === 'land' || sort === 'lot' ? sort : 'cash',
  };
};

interface Row {
  listing: ScreenerListing;
  rent: ListingRent;
  parcel: Parcel | null;
  metrics: ScreenMetrics;
  flags: Flag[];
}

const pctText = (n: number) => `${Math.round(n * 100)}%`;

const SELECT =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink focus:border-champagne-ink focus:outline-none';
const FIELD_LABEL = 'text-xs font-semibold uppercase tracking-[0.12em] text-gray-500';

const ScreenerView = ({
  params,
  setParams,
  enabled,
}: {
  params: URLSearchParams;
  setParams: SetURLSearchParams;
  enabled: boolean;
}) => {
  const q = queryFrom(params);
  const [shown, setShown] = useState(PAGE);
  const defaults = useMemo(screenDefaults, []);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    setShown(PAGE);
    setParams(next, { replace: true });
  };

  const { user } = useAuth();
  const savedAnalyses = useQuery({
    queryKey: ['inv-analyses', user?.id ?? null, 'all'],
    queryFn: () => listAnalyses(user?.id as string),
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
  });

  const towns = useQuery({
    queryKey: ['town-list'],
    queryFn: townsWithListings,
    enabled,
    staleTime: 60 * 60 * 1000,
  });
  const listings = useScreenerListings(q, enabled);
  const rents = useRentEvidence(q.town, q.state, enabled);
  const parcels = useTownParcels(q.town, listings.data?.listings, enabled);

  const rows: Row[] = useMemo(() => {
    const ev = rents.data ?? { leases: [], asking: [], capped: false };
    const map = parcels.data ?? new Map<string, Parcel>();
    return (listings.data?.listings ?? []).map((l) => {
      const dwelling = isDwelling(l);
      const rent = dwelling
        ? rentForListing(l, ev.leases, ev.asking, ev.capped)
        : { gross: null, units: [], mix: null };
      const parcel = parcelFits(l.prop_type, map.get(l.mls_number));
      const metrics = screenMetrics(
        {
          price: l.list_price,
          propType: l.prop_type,
          taxes: usableTaxes(l),
          hoa: l.hoa,
          hoaFee: l.hoa_fee,
          units: rent.mix?.units ?? 1,
          grossRent: rent.gross,
          homeInsurance: estimateInsurance(l.list_price ?? 0, l.prop_type),
          assessedTotal: parcel?.total ?? null,
          landShare: parcel?.landShare ?? null,
          dwelling,
        },
        defaults
      );
      const flags = [
        ...fieldFlags({
          year_built: l.year_built,
          heatingLabel: decodeCodes('HEATING', l.heating, l.prop_type),
          sewerLabel: decodeCodes('SEWER', l.sewer, l.prop_type),
          price_cut: l.price_cut,
        }),
        ...remarkFlags(l.remarks),
      ];
      return { listing: l, rent, parcel, metrics, flags };
    });
  }, [listings.data, rents.data, parcels.data, defaults]);

  const sorted = useMemo(() => {
    const list = q.sort === 'land' || q.sort === 'lot' ? rows.filter((r) => r.listing.prop_type !== 'CC') : rows;
    const cmp =
      q.sort === 'value'
        ? byMetric<Row>((r) => r.metrics.priceToAssessed, 'asc')
        : q.sort === 'land'
          ? byMetric<Row>((r) => r.metrics.landShare, 'desc')
          : q.sort === 'lot'
            ? byMetric<Row>((r) => r.parcel?.lotSqft ?? null, 'desc')
            : byMetric<Row>((r) => r.metrics.capRate, 'desc');
    return [...list].sort(cmp);
  }, [rows, q.sort]);

  const servedNames = SITE.areaServed.map((t) => t.name) as string[];
  const otherTowns = (towns.data ?? [])
    .filter((t) => t.listings > 0 && !servedNames.includes(t.town))
    .map((t) => t.town)
    .sort();
  const sortInfo = SORTS.find((s) => s.id === q.sort) as (typeof SORTS)[number];
  const waitingOnParcels = q.sort !== 'cash' && parcels.isLoading;

  return (
    <div>
      {savedAnalyses.data && savedAnalyses.data.length > 0 && <SavedList rows={savedAnalyses.data} />}

      {/* ---------------- Controls ---------------- */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-bone p-5 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block lg:col-span-2">
          <span className={FIELD_LABEL}>Town</span>
          <NativeSelect wrapperClassName="mt-1" className={SELECT} value={q.town} onChange={(e) => set({ town: e.target.value === DEFAULT_TOWN ? null : e.target.value })}>
            <optgroup label="Towns Kevin serves">
              {servedNames.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
            {otherTowns.length > 0 && (
              <optgroup label="Other Massachusetts towns">
                {otherTowns.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
            )}
            {/* A town typed into the URL that is in neither list still shows as chosen. */}
            {!servedNames.includes(q.town) && !otherTowns.includes(q.town) && <option value={q.town}>{q.town}</option>}
          </NativeSelect>
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Type</span>
          <NativeSelect wrapperClassName="mt-1" className={SELECT} value={q.type} onChange={(e) => set({ type: e.target.value || null })}>
            <option value="">Any</option>
            {INVESTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Price from</span>
          <NativeSelect wrapperClassName="mt-1" className={SELECT} value={q.min ?? ''} onChange={(e) => set({ min: e.target.value || null })}>
            <option value="">No minimum</option>
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>
                {formatPrice(p)}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Up to</span>
          <NativeSelect wrapperClassName="mt-1" className={SELECT} value={q.max ?? ''} onChange={(e) => set({ max: e.target.value || null })}>
            <option value="">No maximum</option>
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>
                {formatPrice(p)}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex flex-wrap rounded-full border border-gray-300 p-1" role="tablist" aria-label="Rank by">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={q.sort === s.id}
              onClick={() => set({ sort: s.id === 'cash' ? null : s.id })}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5 ${
                q.sort === s.id ? 'bg-ink-deep text-white' : 'text-gray-700 hover:text-champagne-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Fetch
          <NativeSelect
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-ink focus:border-champagne-ink focus:outline-none"
            value={q.order}
            onChange={(e) => set({ order: e.target.value === 'low' ? 'low' : null })}
          >
            <option value="high">highest-priced first</option>
            <option value="low">lowest-priced first</option>
          </NativeSelect>
        </label>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600">{sortInfo.explain}</p>

      {/* ---------------- Results ---------------- */}
      {listings.isLoading || rents.isLoading || waitingOnParcels ? (
        <Spinner label={waitingOnParcels ? 'Reading the assessor’s records…' : `Reading ${q.town}’s listings and leases…`} />
      ) : listings.isError ? (
        <Panel className="mt-8">
          The listings could not be loaded just now. Refresh the page to try again.
        </Panel>
      ) : sorted.length === 0 ? (
        <Panel className="mt-8">
          No homes for sale in {q.town} match those filters right now. Widen the price range or choose another
          town.
        </Panel>
      ) : (
        <>
          <p className="numeral mt-6 text-sm text-gray-500">
            {sorted.length} {sorted.length === 1 ? 'home' : 'homes'} for sale in {q.town}
            {listings.data?.capped &&
              ` — the ${SCREENER_LIMIT} ${q.order === 'low' ? 'lowest' : 'highest'}-priced; narrow the price range to see the rest`}
            .
            {rents.data && rents.data.leases.length > 0 && <> Rents from {rents.data.leases.length} leases signed in the last twelve months.</>}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.slice(0, shown).map((row) => (
              <InvestmentCard key={row.listing.mls_number} row={row} sort={q.sort} town={q.town} />
            ))}
          </div>
          {shown < sorted.length && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE)}
                className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-champagne-ink hover:text-champagne-ink"
              >
                Show {Math.min(PAGE, sorted.length - shown)} more
              </button>
            </div>
          )}
          <p className="mt-10 max-w-3xl text-xs leading-relaxed text-gray-500">
            Every card is worked out at the same starting assumptions: {ASSUMPTIONS.investorDownPct.value}% down at{' '}
            {defaults.ratePct}% over 30 years, {ASSUMPTIONS.vacancyPct.value}% vacancy, {ASSUMPTIONS.managementPct.value}%
            management, maintenance of {ASSUMPTIONS.maintenancePctOfPrice.value}% of the price a year, a{' '}
            {ASSUMPTIONS.capexPctOfRent.value}% capital reserve, a landlord’s insurance policy and the listing’s own
            tax bill. Open a home to change any of them. Assessed values are the town’s, from the Commonwealth’s
            parcel records, for the fiscal year shown.
          </p>
        </>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */

const STRATEGY_LABEL: Record<string, string> = { hold: 'Rental', flip: 'Fix and flip', brrrr: 'BRRRR' };

/** The investor's saved analyses, newest first: each is the way back to its numbers. */
const SavedList = ({ rows }: { rows: SavedAnalysis[] }) => (
  <section aria-labelledby="saved-analyses" className="mb-12">
    <h2 id="saved-analyses" className="text-xl font-semibold uppercase tracking-wide text-ink">
      Your saved analyses
    </h2>
    <ul className="mt-4 divide-y divide-gray-100 border-y border-gray-200">
      {rows.map((r) => (
        <li key={r.id}>
          <Link
            to={`/investments?mls=${encodeURIComponent(r.mls_number)}`}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm hover:text-champagne-ink"
          >
            <span className="font-medium text-ink">
              {[r.address, r.town].filter(Boolean).join(', ') || `MLS ${r.mls_number}`}
            </span>
            <span className="numeral text-xs text-gray-500">
              {STRATEGY_LABEL[r.strategy] ?? r.strategy}
              {r.list_price !== null && ` · asking ${formatPrice(r.list_price)} when saved`}
              {' · '}
              {new Date(r.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </section>
);

const InvestmentCard = ({ row, sort, town }: { row: Row; sort: Sort; town: string }) => {
  const { listing, rent, parcel, metrics, flags } = row;
  const one = rent.units[0] ?? null;
  const rentLine =
    rent.gross === null
      ? null
      : rent.units.length > 1
        ? `${rent.units.length} units, ${describeRent(one as NonNullable<typeof one>, { town, zip: listing.zip })} for the first`
        : describeRent(one as NonNullable<typeof one>, { town, zip: listing.zip });

  const headline =
    sort === 'value'
      ? metrics.priceToAssessed !== null
        ? { label: 'Asking against assessed', value: pctText(metrics.priceToAssessed) }
        : null
      : sort === 'land'
        ? metrics.landShare !== null
          ? { label: 'Land share of assessed value', value: pctText(metrics.landShare) }
          : null
        : sort === 'lot'
          ? parcel?.lotSqft
            ? { label: parcel.zoning ? `Lot, zoned ${parcel.zoning}` : 'Lot', value: `${parcel.lotSqft.toLocaleString()} sq ft` }
            : null
          : metrics.capRate !== null
          ? { label: 'Cap rate', value: `${metrics.capRate.toFixed(1)}%` }
          : null;

  return (
    /* Siblings, not nested: the card is a link and so is "Analyse". */
    <div className="flex flex-col">
      <ListingCard listing={listing} />
      <div className="mt-3 flex flex-1 flex-col rounded-xl border border-gray-200 bg-bone p-4 text-sm">
        {headline ? (
          <p className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{headline.label}</span>
            <span className="numeral text-xl font-semibold text-ink">{headline.value}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            {sort === 'cash'
              ? `No cap rate: ${metrics.missing.join('; ')}.`
              : 'The assessor’s record for this address was not found.'}
          </p>
        )}

        <dl className="numeral mt-3 space-y-1 text-gray-600">
          {listing.prop_type === 'SF' && (parcel?.grossArea || listing.living_area) ? (
            <div className="flex justify-between gap-3">
              <dt title="By right on a lot in a single-family zoning district: 900 sq ft or half the house, whichever is smaller">ADU size cap</dt>
              <dd className="font-medium text-ink">up to {aduMaxSqft(parcel?.grossArea ?? listing.living_area ?? 0).toLocaleString()} sq ft</dd>
            </div>
          ) : null}
          {rent.gross !== null && (
            <div className="flex justify-between gap-3">
              <dt>Rent</dt>
              <dd className="font-medium text-ink">≈{formatPrice(rent.gross)}/mo</dd>
            </div>
          )}
          {metrics.monthlyCashFlow !== null && (
            <div className="flex justify-between gap-3">
              <dt>Cash flow</dt>
              <dd className={`font-medium ${metrics.monthlyCashFlow < 0 ? 'text-red-700' : 'text-ink'}`}>
                {metrics.monthlyCashFlow < 0 ? '−' : ''}
                {formatPrice(Math.round(Math.abs(metrics.monthlyCashFlow)))}/mo
              </dd>
            </div>
          )}
          {parcel?.total && (
            <div className="flex justify-between gap-3">
              <dt>Assessed{parcel.fy ? ` (FY${parcel.fy})` : ''}</dt>
              <dd className="font-medium text-ink">{formatPrice(parcel.total)}</dd>
            </div>
          )}
          {parcel?.landShare !== null && parcel?.landShare !== undefined && sort !== 'land' && (
            <div className="flex justify-between gap-3">
              <dt>Land share</dt>
              <dd className="font-medium text-ink">{pctText(parcel.landShare)}</dd>
            </div>
          )}
          {parcel?.lotSqft && sort !== 'lot' && (
            <div className="flex justify-between gap-3">
              <dt>Lot{parcel.zoning ? `, zoned ${parcel.zoning}` : ''}</dt>
              <dd className="font-medium text-ink">{parcel.lotSqft.toLocaleString()} sq ft</dd>
            </div>
          )}
        </dl>
        {rentLine && <p className="mt-2 text-xs leading-relaxed text-gray-500">Rent: {rentLine}.</p>}

        {flags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {flags.slice(0, 5).map((f) => (
              <Chip key={f.key} title={f.detail}>
                {f.label}
              </Chip>
            ))}
          </div>
        )}

        <Link
          to={`/investments?mls=${encodeURIComponent(listing.mls_number)}`}
          className={`mt-auto inline-flex items-center gap-1.5 self-start pt-4 ${LINK}`}
        >
          Analyse this home
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
};

export default ScreenerView;
