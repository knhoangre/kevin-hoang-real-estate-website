import { Children, isValidElement, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bed, Bath, Square, Calendar, Home, Phone, Printer, ArrowLeft,
  Car, Trees, Layers, Receipt, Waves, Building2, DoorOpen,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Seo from '@/components/Seo';
import IdxDisclosure from '@/components/IdxDisclosure';
import { formatPrice, formatBaths } from '@/lib/listings';
import { SITE, telHref, smsHref } from '@/lib/siteConfig';
import {
  listingByMls,
  officeName,
  photoUrls,
  propTypeLabel,
  statusLabel,
  isAvailable,
  type IdxListing,
} from '@/lib/idxSearch';

/**
 * One active listing, at /search/<mls>.
 *
 * THIS IS THE POINT OF THE WHOLE FEATURE. The ask was to send a client a link
 * to a home instead of a Zillow page, and to print a sheet instead of the MLS
 * printout — so this page is built to be opened by someone who was sent it,
 * not to be found by search.
 *
 * `noindex` does NOT stop that working: it tells search engines not to index,
 * while iMessage, Facebook, Slack and WhatsApp unfurlers ignore robots
 * directives entirely. A texted link still shows a photo card.
 *
 * Not prerendered, so <Seo> here writes its tags after hydration. That is
 * acceptable precisely because the audience is unfurlers and humans following a
 * link rather than crawlers building an index — and the fallback while the
 * fetch is in flight is an honest generic title, never a wrong specific one.
 */

/** A yes/no that is genuinely unknown renders nothing rather than "No". */
const yesNo = (v: boolean | null) => (v === null ? null : v ? 'Yes' : 'No');

const number = (v: number | null, unit = '') =>
  v === null ? null : `${v.toLocaleString()}${unit}`;

const Spec = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bed;
  label: string;
  value: string | null;
}) =>
  value === null ? null : (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-champagne-ink" aria-hidden />
      <div>
        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">{label}</dt>
        <dd className="numeral mt-1 font-medium text-ink">{value}</dd>
      </div>
    </div>
  );

/**
 * A titled block of specs that renders NOTHING when every child is null.
 *
 * React counts a `false`/`null` child as a child, so the emptiness has to be
 * tested on the rendered output rather than on children.length — otherwise a
 * listing with no lot data still shows a "Lot and parking" heading over an
 * empty box, which is the thin templated filler TownSoldListings was written to
 * avoid.
 */
const SpecGroup = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const shown = Children.toArray(children).filter(
    (child) => isValidElement(child) && (child.props as { value?: string | null }).value != null
  );
  if (shown.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">{title}</h2>
      <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3">{shown}</dl>
    </section>
  );
};

const SearchListing = () => {
  const { mls } = useParams<{ mls: string }>();
  const [listing, setListing] = useState<IdxListing | null>(null);
  const [office, setOffice] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    if (!mls) return;
    let cancelled = false;
    setState('loading');

    listingByMls(mls)
      .then(async (row) => {
        if (cancelled) return;
        if (!row) {
          setState('missing');
          return;
        }
        setListing(row);
        setState('ready');
        // Attribution is required on every listing, so it is fetched even
        // though it costs a second round trip.
        const name = await officeName(row.list_office_id);
        if (!cancelled) setOffice(name);
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [mls]);

  const address = listing
    ? [listing.address, listing.town, listing.state, listing.zip].filter(Boolean).join(', ')
    : null;
  const photos = listing ? photoUrls(listing, 'full') : [];

  return (
    <div className="min-h-screen bg-white pt-20 print:pt-0">
      {/*
        The title and card come from the fetched listing once it arrives, and
        are deliberately generic before that — an unfurler that renders early
        gets an honest placeholder rather than a confident wrong one.
      */}
      <Seo
        title={address ? `${listing?.address} — MLS ${listing?.mls_number}` : 'Listing'}
        description={
          listing
            ? [
                propTypeLabel(listing.prop_type),
                address,
                listing.bedrooms !== null ? `${listing.bedrooms} bed` : null,
                listing.full_baths !== null
                  ? `${formatBaths(listing.full_baths, listing.half_baths)} bath`
                  : null,
                formatPrice(listing.list_price),
              ]
                .filter(Boolean)
                .join(' · ')
            : 'An active listing from MLS PIN.'
        }
        ogImage={photos[0]}
        // The MLS media host serves 1024x768, not the 1200x630 <Seo> declares by
        // default — so the declaration is corrected rather than left to promise
        // a size the image does not have.
        ogImageWidth={1024}
        ogImageHeight={768}
        noindex
      />

      <div className="container mx-auto max-w-6xl px-4 py-10">
        <Link
          to="/search"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:text-ink print:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to search
        </Link>

        {state === 'loading' && (
          <div className="space-y-6">
            <div className="aspect-[16/10] animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-10 w-1/3 animate-pulse rounded bg-gray-100" />
          </div>
        )}

        {state === 'missing' && (
          <div className="py-20 text-center">
            <h1 className="font-display text-3xl font-semibold text-ink">
              This listing is no longer available
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-gray-600">
              {/*
                The honest reading of an MLS number that is not in the feed: it
                sold, went under agreement, or was withdrawn. Saying "not found"
                would suggest a broken link, and the listing was real.
              */}
              MLS {mls} is not in the current feed, which usually means it has
              sold, gone under agreement, or been withdrawn since the link was
              shared.
            </p>
            <Link
              to="/search"
              className="btn-pill btn-pill-light mt-8 inline-flex items-center gap-2 rounded-full bg-ink-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-champagne hover:text-ink-deep"
            >
              Search current listings
            </Link>
          </div>
        )}

        {state === 'error' && (
          <p className="py-20 text-center text-gray-600">
            Could not load this listing. Please try again.
          </p>
        )}

        {state === 'ready' && listing && (
          <>
            {photos.length > 0 && (
              <Carousel className="mb-10 print:hidden" opts={{ loop: photos.length > 1 }}>
                <CarouselContent>
                  {photos.map((src, i) => (
                    <CarouselItem key={src}>
                      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100">
                        <img
                          src={src}
                          alt={`${listing.address ?? 'Listing'} — photo ${i + 1} of ${photos.length}`}
                          className="h-full w-full object-cover"
                          loading={i === 0 ? undefined : 'lazy'}
                          fetchPriority={i === 0 ? 'high' : undefined}
                          decoding="async"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {photos.length > 1 && (
                  <>
                    <CarouselPrevious className="left-3" />
                    <CarouselNext className="right-3" />
                  </>
                )}
              </Carousel>
            )}

            {/* One photo only when printing — 40 pages of photos is not a sheet. */}
            {photos.length > 0 && (
              <img
                src={photos[0]}
                alt=""
                className="mb-6 hidden max-h-64 w-full object-cover print:block"
              />
            )}

            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-ink">
                  {propTypeLabel(listing.prop_type)}
                  {/* "Under agreement", not "UAG". */}
                  {statusLabel(listing.status) ? ` · ${statusLabel(listing.status)}` : ''}
                </p>
                {/*
                  Inter, not the display serif. A street address is mostly
                  digits, and Playfair Display's default old-style figures put
                  half of them below the baseline — "80 Gary Rd" renders with a
                  sunken 8 and a raised 0. Same reason the prices moved off it.
                */}
                <h1 className="numeral mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                  {listing.address}
                </h1>
                <p className="mt-2 text-gray-600">
                  {[listing.town, listing.state, listing.zip].filter(Boolean).join(', ')}
                </p>
                {!isAvailable(listing.status) && statusLabel(listing.status) && (
                  <p className="mt-4 inline-block rounded-full bg-ink-deep px-4 py-1.5 text-sm font-semibold text-white">
                    {statusLabel(listing.status)}
                  </p>
                )}
                <p className="numeral mt-6 text-4xl font-semibold text-ink">
                  {formatPrice(listing.list_price)}
                  {listing.prop_type === 'RN' && (
                    <span className="text-lg font-medium text-gray-500"> /month</span>
                  )}
                </p>

                <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7 border-y border-gray-200 py-8 sm:grid-cols-3">
                  <Spec icon={Bed} label="Bedrooms" value={listing.bedrooms?.toString() ?? null} />
                  <Spec
                    icon={Bath}
                    label="Baths"
                    value={
                      listing.full_baths === null && listing.half_baths === null
                        ? null
                        : formatBaths(listing.full_baths, listing.half_baths)
                    }
                  />
                  <Spec icon={DoorOpen} label="Total rooms" value={number(listing.total_rooms)} />
                  <Spec
                    icon={Square}
                    label="Living area"
                    value={number(listing.living_area, ' sq ft')}
                  />
                  <Spec icon={Calendar} label="Year built" value={listing.year_built?.toString() ?? null} />
                  <Spec icon={Home} label="MLS #" value={listing.mls_number} />
                </dl>

                {/*
                  Everything below is optional and every row disappears when the
                  feed does not carry it — which is why these are grouped rather
                  than one long grid: a section with nothing in it is not
                  rendered at all, so a sparse listing does not show a wall of
                  blanks.

                  Deliberately absent: heating, cooling, water, sewer,
                  appliances, flooring, construction, roof and style. The feed
                  stores those as letter codes ("B,N", "A,C,F,I,K,L") whose
                  lookup tables are in the Field Reference behind the MLS PIN
                  login. Printing the codes is useless and expanding them by
                  guesswork would fabricate details about another firm's
                  listing.
                */}
                <SpecGroup title="Lot and parking">
                  <Spec
                    icon={Trees}
                    label="Lot size"
                    value={
                      listing.acres !== null
                        ? `${listing.acres} acres`
                        : number(listing.lot_size, ' sq ft')
                    }
                  />
                  <Spec icon={Car} label="Garage spaces" value={number(listing.garage_spaces)} />
                  <Spec icon={Car} label="Total parking" value={number(listing.parking_spaces)} />
                  <Spec icon={Layers} label="Basement" value={yesNo(listing.basement)} />
                  <Spec icon={Waves} label="Waterfront" value={yesNo(listing.waterfront)} />
                </SpecGroup>

                <SpecGroup title="Interior">
                  <Spec
                    icon={Square}
                    label="Above grade"
                    value={number(listing.sqft_above_grade, ' sq ft')}
                  />
                  <Spec
                    icon={Square}
                    label="Below grade"
                    value={number(listing.sqft_below_grade, ' sq ft')}
                  />
                  <Spec icon={Building2} label="Unit level" value={number(listing.unit_level)} />
                  <Spec icon={Building2} label="Units in building" value={number(listing.num_units)} />
                  <Spec icon={Home} label="Colour" value={listing.color} />
                  <Spec icon={Home} label="Neighbourhood" value={listing.neighborhood} />
                </SpecGroup>

                <SpecGroup title="Costs">
                  {/*
                    The tax year is shown WITH the tax figure, never without.
                    A property-tax number with no year attached is the kind of
                    stale figure a buyer budgets against and then finds out
                    is three years old.
                  */}
                  <Spec
                    icon={Receipt}
                    label={listing.tax_year ? `Taxes (${listing.tax_year})` : 'Taxes'}
                    value={listing.taxes !== null ? formatPrice(listing.taxes) : null}
                  />
                  <Spec icon={Receipt} label="HOA" value={yesNo(listing.hoa)} />
                  <Spec
                    icon={Receipt}
                    label="HOA fee"
                    value={listing.hoa_fee !== null ? formatPrice(listing.hoa_fee) : null}
                  />
                  <Spec
                    icon={Calendar}
                    label="Available from"
                    value={
                      listing.date_available
                        ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
                            .format(new Date(`${listing.date_available}T00:00:00Z`))
                        : null
                    }
                  />
                  <Spec
                    icon={Home}
                    label="55+ community"
                    value={yesNo(listing.adult_community)}
                  />
                </SpecGroup>

                {listing.remarks && (
                  <div className="mt-10">
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                      About this home
                    </h2>
                    <p className="mt-4 leading-relaxed text-gray-700">{listing.remarks}</p>
                  </div>
                )}

                {/*
                  Listing-office attribution. MLS PIN requires the listing
                  brokerage be identified on every listing displayed through
                  IDX — a listing here is usually another firm's, and
                  presenting it without saying so implies it is Kevin's.
                */}
                <p className="mt-10 text-sm text-gray-600">
                  {office
                    ? `Listing courtesy of ${office}.`
                    : 'Listing courtesy of the listing brokerage.'}
                </p>
              </div>

              <aside className="print:hidden lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-2xl border border-gray-200 bg-bone p-7">
                  <span className="mb-4 block h-px w-10 bg-champagne" aria-hidden />
                  <h2 className="font-display text-xl font-semibold text-ink">
                    See this home
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    I can arrange a showing for this or anything else on the
                    market — including homes not publicly listed yet.
                  </p>
                  <a
                    href={telHref}
                    className="btn-pill btn-pill-light mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-champagne hover:text-ink-deep"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    Call {SITE.phone}
                  </a>
                  <a
                    href={smsHref}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-champagne-ink"
                  >
                    Text about MLS {listing.mls_number}
                  </a>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-champagne-ink"
                  >
                    <Printer className="h-4 w-4" aria-hidden />
                    Print listing sheet
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}

        <IdxDisclosure className="mt-16" />
      </div>
    </div>
  );
};

export default SearchListing;
