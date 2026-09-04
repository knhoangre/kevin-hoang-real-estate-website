import { Children, isValidElement, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bed, Bath, Square, Calendar, Home, Phone, Printer, ArrowLeft,
  Car, Trees, Layers, Receipt, Waves, Building2, DoorOpen,
  Flame, Snowflake, Droplets, Plug, Hammer, MapPin, Sofa, Sparkles,
  TrendingDown, TrendingUp, MessageSquare,
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
import ListingPayment from '@/components/listing/ListingPayment';
import ListingEnquiry from '@/components/listing/ListingEnquiry';
import SimilarListings from '@/components/listing/SimilarListings';
import { formatPrice, formatBaths, formatSoldMonth } from '@/lib/listings';
import { SITE, telHref, smsHrefWith } from '@/lib/siteConfig';
import {
  listingByMls,
  officeName,
  photoUrls,
  propTypeLabel,
  statusLabel,
  decodeCodes,
  headlinePrice,
  priceChange,
  priceHistory,
  pricePerSqft,
  type IdxListing,
  type PriceHistoryEntry,
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

/**
 * A day, for a price change. `formatSoldMonth` deliberately blurs a closing to
 * its month, but a price cut is a live event a buyer is timing against — "three
 * days ago" and "in March" are different pieces of news, so this keeps the day.
 * Parsed as a timestamp rather than a date string, because that is what the
 * history column stores.
 */
const formatChangeDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

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
    // border-t on every group, so "Lot and parking", "Interior" and "Costs" are
    // separated the same way the basics block is. Previously only the first had
    // a rule and the rest ran together as one undifferentiated column.
    <section className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">{title}</h2>
      <dl className="print-specs mt-5 grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3">{shown}</dl>
    </section>
  );
};

const SearchListing = () => {
  const { mls } = useParams<{ mls: string }>();
  const [listing, setListing] = useState<IdxListing | null>(null);
  const [office, setOffice] = useState<string | null>(null);
  /*
   * Fetched separately and allowed to fail quietly. The history is additional
   * context, not the subject of the page — a listing whose history query errors
   * must still render the listing, so this never touches the page's own state
   * machine.
   */
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    if (!mls) return;
    let cancelled = false;
    setState('loading');
    setHistory([]);

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
        priceHistory(row.mls_number)
          .then((rows) => {
            if (!cancelled) setHistory(rows);
          })
          .catch(() => {
            if (!cancelled) setHistory([]);
          });
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
            {/*
              LETTERHEAD, PRINT ONLY.

              A sheet handed over at a showing leaves the building with the
              client and is read again that evening beside four others. Without
              this it carried no indication of who produced it — the navbar and
              footer that would have said so are hidden on paper, and rightly,
              because a link column is not a letterhead. NAP comes from SITE
              like everywhere else, so the printed sheet cannot drift from the
              Google Business Profile.

              The date matters as much as the name: an IDX sheet is a snapshot
              of an hourly feed, and a month-old printout stating today's price
              with no date on it is the kind of stale figure the rest of this
              page refuses to produce.
            */}
            <div className="print-letterhead mb-6 hidden border-b-2 border-black pb-3 print:block">
              <div className="flex items-baseline justify-between gap-6">
                <div>
                  <p className="text-lg font-semibold">{SITE.agentName}</p>
                  <p className="text-xs">{SITE.brokerage}</p>
                </div>
                <div className="text-right text-xs">
                  <p>{SITE.phone}</p>
                  <p>{SITE.email}</p>
                </div>
              </div>
              <p className="mt-2 text-[8pt] text-gray-700">
                Listing data from MLS PIN, printed{' '}
                {new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date())}.
                Prices and availability change; confirm before relying on this sheet.
              </p>
            </div>

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
                className="print-photo mb-6 hidden w-full object-cover print:block"
              />
            )}

            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] print:block">
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
                {/*
                  The dark status pill that used to sit here is gone. It said
                  "Sold" directly beneath a line that already reads "Single
                  family · Sold" — the same word twice, thirty pixels apart, the
                  second time in the heaviest treatment on the page. On a search
                  RESULT the badge earns its weight, because the reader is
                  scanning two dozen cards and needs the status without reading
                  any of them. Here they are reading one listing, and the eyebrow
                  has already answered it.
                */}
                <p className="print-price numeral mt-6 text-4xl font-semibold text-ink">
                  {/* What it closed at, when that is the number that exists. */}
                  {formatPrice(headlinePrice(listing))}
                  {listing.prop_type === 'RN' && (
                    <span className="text-lg font-medium text-gray-500"> /month</span>
                  )}
                </p>

                {/*
                  The most recent movement, spelled out in both directions and
                  in dollars as well as percent. A buyer reading "$1,150,000"
                  alone cannot tell a home priced there from one that has been
                  cut twice and is still sitting — and that difference is most of
                  what a price tells you.
                */}
                {(() => {
                  const change = priceChange(listing);
                  if (!change) return null;
                  const Icon = change.direction === 'down' ? TrendingDown : TrendingUp;
                  return (
                    <p
                      className={`numeral mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full px-4 py-1.5 text-sm font-semibold ${
                        change.direction === 'down'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {change.direction === 'down' ? 'Price cut' : 'Price raised'}{' '}
                      {formatPrice(change.amount)} ({change.percent}%)
                      <span className="font-normal text-gray-500 line-through">
                        {formatPrice(change.from)}
                      </span>
                      {formatChangeDate(change.at) && (
                        <span className="font-normal text-gray-600">
                          on {formatChangeDate(change.at)}
                        </span>
                      )}
                    </p>
                  );
                })()}

                {listing.feed === 'sold' && (
                  <p className="numeral mt-2 text-gray-600">
                    {formatSoldMonth(listing.settled_date)
                      ? `Sold ${formatSoldMonth(listing.settled_date)}`
                      : 'Sold'}
                    {/*
                      Asked-vs-closed, and only when both numbers exist. Deriving
                      it from a missing list price would be a fabricated statistic
                      about a real transaction.
                    */}
                    {listing.list_price && listing.sale_price
                      ? ` · asked ${formatPrice(listing.list_price)}`
                      : ''}
                  </p>
                )}

                {/*
                  The address on a map. A link, not an embed: an iframe would
                  pull Google's script onto a page that is otherwise entirely
                  first-party, and the viewer almost always wants it in their own
                  maps app anyway. `q=` with the full address rather than
                  coordinates, because the feed carries no lat/long and guessing
                  at one would drop a pin on the wrong house.
                */}
                {address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-ink underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink print:hidden"
                  >
                    <MapPin className="h-4 w-4 text-champagne-ink" aria-hidden />
                    View on Google Maps
                  </a>
                )}

                {/*
                  PRICE CHANGES, AND AN HONEST LABEL ON THEM.

                  The IDX feed carries no history at all — one row per listing,
                  today's price, nothing else. Every entry below is something
                  this site watched happen between two hourly syncs, so the
                  section says "recorded here" and dates its own starting point.
                  Calling it the listing's price history would claim knowledge of
                  everything that happened before we first saw it, which is
                  exactly the kind of confident wrongness the rest of this page
                  refuses.

                  ONLY MOVEMENTS. This used to render the first-observation
                  row too, and a trigger bug wrote one of those on every hourly
                  sync — so a listing showed fourteen identical "First seen
                  $21,500,000" lines, one per sync, and called it history. The
                  trigger is fixed; priceHistory() additionally refuses to
                  return first-observation rows at all, so the worst this can
                  now do is show nothing.

                  Showing nothing is the common case and the correct one: at
                  the time of writing, 25 price movements had been observed
                  across roughly 22,000 listings. A home whose price has not
                  moved has no price history, and saying so with silence is
                  better than a timeline restating the number above it.
                */}
                {history.length > 0 && (
                  <section className="mt-10 border-t border-gray-200 pt-8 print:hidden">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">
                      Price changes recorded here
                    </h2>
                    <ol className="mt-5 space-y-3">
                      {history.map((entry) => (
                        <li
                          key={entry.recorded_at}
                          className="numeral flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-gray-100 pb-3 text-sm last:border-0"
                        >
                          <span className="text-gray-600">
                            {formatChangeDate(entry.recorded_at) ?? '—'}
                          </span>
                          <span className="flex items-center gap-2">
                            {entry.previous_list_price !== null && (
                              <span className="text-gray-400 line-through">
                                {formatPrice(entry.previous_list_price)}
                              </span>
                            )}
                            <span className="font-semibold text-ink">
                              {formatPrice(entry.list_price)}
                            </span>
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              {/*
                                Every row here is a movement — priceHistory()
                                excludes the first-observation row, so the old
                                "First seen" branch is gone along with the
                                fourteen identical entries it used to render.
                              */}
                              {entry.list_price !== null &&
                              entry.previous_list_price !== null &&
                              entry.list_price < entry.previous_list_price
                                ? 'Cut'
                                : 'Raised'}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {/*
                  Titled like every other group. It used to be an untitled slab
                  of six specs, so the page opened with unlabelled numbers and
                  only started naming its sections halfway down.
                */}
                <section className="mt-10 border-t border-gray-200 pt-8">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Rooms and size
                  </h2>
                  <dl className="print-specs mt-5 grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3">
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
                  {/*
                    Above and below grade moved here from "Interior", where they
                    sat beside unit numbers and paint colour. They are square
                    footages: they belong next to the square footage they break
                    down, and a reader comparing living area against finished
                    basement should not have to scroll two sections to do it.
                  */}
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
                  </dl>
                </section>

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
                  <Spec icon={Waves} label="Waterfront type" value={decodeCodes('WATERFRONT', listing.waterfront_desc, listing.prop_type)} />
                  <Spec icon={Car} label="Garage" value={decodeCodes('GARAGE_PARKING', listing.garage_parking, listing.prop_type)} />
                  <Spec icon={Car} label="Parking" value={decodeCodes('PARKING_FEATURE', listing.parking_feature, listing.prop_type)} />
                  <Spec icon={Trees} label="Lot" value={decodeCodes('LOT_DESCRIPTION', listing.lot_description, listing.prop_type)} />
                  <Spec icon={Trees} label="Road" value={decodeCodes('ROAD_TYPE', listing.road_type, listing.prop_type)} />
                </SpecGroup>

                {/*
                  Was "Interior", which it was not. It held two square footages
                  (now with the other square footages), the exterior paint colour
                  (now with the other exterior materials, under Construction) and
                  three facts about where a unit sits in a building — which is
                  what actually unites the group, so it is named for that. The
                  real interior finishes were always under "Features".
                */}
                <SpecGroup title="Building and unit">
                  <Spec icon={Building2} label="Unit level" value={number(listing.unit_level)} />
                  <Spec icon={Building2} label="Unit placement" value={decodeCodes('UNIT_PLACEMENT', listing.unit_placement, listing.prop_type)} />
                  <Spec icon={Building2} label="Units in building" value={number(listing.num_units)} />
                  <Spec icon={MapPin} label="Neighbourhood" value={listing.neighborhood} />
                </SpecGroup>

                <SpecGroup title="Costs">
                  {/*
                    Price per square foot is a PRICE, not a dimension, and it
                    belongs with the other money on the page rather than in the
                    room count where it started. It is the number two homes are
                    actually compared on, and it leads this group for that
                    reason. Derived from headlinePrice, so a sold listing states
                    what it CLOSED at per square foot rather than what it asked.
                  */}
                  <Spec
                    icon={Receipt}
                    label="Price / sq ft"
                    value={
                      pricePerSqft(listing) !== null
                        ? `$${pricePerSqft(listing)!.toLocaleString()}`
                        : null
                    }
                  />
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

                <SpecGroup title="Systems">
                  {/*
                    Decoded through src/lib/idx-codes.ts, generated from MLS
                    PIN's own field reference. The property type is passed
                    because the codes are not global: HEATING "C" is "Gas" on a
                    rental and "Hot Water Baseboard" on a condo.
                  */}
                  <Spec icon={Flame} label="Heating" value={decodeCodes('HEATING', listing.heating, listing.prop_type)} />
                  <Spec icon={Snowflake} label="Cooling" value={decodeCodes('COOLING', listing.cooling, listing.prop_type)} />
                  <Spec icon={Droplets} label="Water" value={decodeCodes('WATER', listing.water, listing.prop_type)} />
                  <Spec icon={Droplets} label="Sewer" value={decodeCodes('SEWER', listing.sewer, listing.prop_type)} />
                  <Spec icon={Flame} label="Hot water" value={decodeCodes('HOT_WATER', listing.hot_water, listing.prop_type)} />
                  <Spec icon={Plug} label="Electric" value={decodeCodes('ELECTRIC_FEATURE', listing.electric_feature, listing.prop_type)} />
                  <Spec icon={Sparkles} label="Energy features" value={decodeCodes('ENERGY_FEATURES', listing.energy_features, listing.prop_type)} />
                </SpecGroup>

                <SpecGroup title="Features">
                  <Spec icon={Sofa} label="Appliances" value={decodeCodes('APPLIANCES', listing.appliances, listing.prop_type)} />
                  <Spec icon={Layers} label="Flooring" value={decodeCodes('FLOORING', listing.flooring, listing.prop_type)} />
                  <Spec icon={Home} label="Interior" value={decodeCodes('INTERIOR_FEATURES', listing.interior_features, listing.prop_type)} />
                  <Spec icon={Trees} label="Exterior" value={decodeCodes('EXTERIOR_FEATURES', listing.exterior_features, listing.prop_type)} />
                  <Spec icon={Layers} label="Laundry" value={decodeCodes('LAUNDRY_FEATURES', listing.laundry_features, listing.prop_type)} />
                  <Spec icon={Waves} label="Pool" value={decodeCodes('POOL_DESCRIPTION', listing.pool_description, listing.prop_type)} />
                  <Spec icon={Home} label="Pets" value={decodeCodes('PETS_ALLOWED', listing.pets_allowed, listing.prop_type)} />
                </SpecGroup>

                <SpecGroup title="Construction">
                  {/*
                    Year built sat under "Rooms and size", where it is neither a
                    room nor a size — and, more to the point, two rows away from
                    "Year built source", the field that says whether the date is
                    recorded or approximate. A date and its provenance now read
                    together, which is the same rule that keeps a tax figure
                    beside its tax year.
                  */}
                  <Spec icon={Calendar} label="Year built" value={listing.year_built?.toString() ?? null} />
                  <Spec icon={Home} label="Style" value={decodeCodes('STYLE', listing.style, listing.prop_type)} />
                  <Spec icon={Hammer} label="Construction" value={decodeCodes('CONSTRUCTION', listing.construction, listing.prop_type)} />
                  <Spec icon={Hammer} label="Siding" value={decodeCodes('EXTERIOR', listing.exterior, listing.prop_type)} />
                  <Spec icon={Home} label="Roof" value={decodeCodes('ROOF_MATERIAL', listing.roof_material, listing.prop_type)} />
                  <Spec icon={Layers} label="Basement" value={decodeCodes('BASEMENT_FEATURE', listing.basement_feature, listing.prop_type)} />
                  <Spec icon={Calendar} label="Year built source" value={decodeCodes('YEAR_BUILT_DESCRP', listing.year_built_descrp, listing.prop_type)} />
                  <Spec icon={Home} label="Exterior colour" value={listing.color} />
                </SpecGroup>

                {/*
                  The MLS number is not a room, a size or a feature — it is how
                  this listing is identified, so it sits with the other listing
                  metadata at the end rather than in the spec grid at the top.
                  It stays visible because it is what a reader quotes back on the
                  phone; the text-message draft in the sidebar carries it for the
                  same reason.
                */}
                <SpecGroup title="Listing">
                  <Spec icon={Home} label="MLS #" value={listing.mls_number} />
                  <Spec icon={Home} label="Property type" value={propTypeLabel(listing.prop_type)} />
                  <Spec icon={Home} label="Status" value={statusLabel(listing.status)} />
                </SpecGroup>

                {listing.remarks && (
                  <div className="mt-10">
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                      About this home
                    </h2>
                    <p className="print-remarks mt-4 leading-relaxed text-gray-700">{listing.remarks}</p>
                  </div>
                )}

                <ListingEnquiry listing={listing} />

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
                  {/*
                    The ADDRESS, not the MLS number — and the message is already
                    written.

                    "Text about MLS 73524017" asks the reader to identify a home
                    by a number they have no reason to remember, and lands them
                    in an empty compose window where they have to describe the
                    listing they were just looking at. They know the house as
                    "80 Gary Rd". The draft names it, and keeps the MLS number
                    on the end so the message is still unambiguous on the
                    receiving side, where several listings can share a street
                    name across towns.
                  */}
                  <a
                    href={smsHrefWith(
                      `Hi Kevin, I'm interested in ${[listing.address, listing.town]
                        .filter(Boolean)
                        .join(', ')} (MLS ${listing.mls_number}). Is it still available?`
                    )}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-champagne-ink"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    Text about {listing.address ?? `MLS ${listing.mls_number}`}
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
            {/*
              FULL WIDTH, BELOW THE GRID — not in the aside, where it started.
              320px holds a total and a column of inputs and nothing else, so
              the loan summary, the split and the down-payment scenarios had
              nowhere to go. Placed after the specs because it is the question a
              reader asks once they have decided they like the house.

              A mortgage estimate belongs on a home someone can buy and finance.
              On a RENTAL it is nonsense, and on a CLOSED SALE it is a monthly
              figure for a house nobody can have — the page's own "no longer
              available" copy is the standard here.
            */}
            {listing.feed !== 'sold' && listing.prop_type !== 'RN' && (
              <ListingPayment listing={listing} />
            )}

            <SimilarListings listing={listing} />
          </>
        )}

        <IdxDisclosure className="mt-16" />
      </div>
    </div>
  );
};

export default SearchListing;
