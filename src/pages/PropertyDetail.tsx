import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Bed, Bath, Square, Phone, CalendarDays, MapPin } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import PageShell, { ShellSection } from '@/components/PageShell';
import NotFound from '@/pages/NotFound';
import { soldListings, listingBySlug, type SoldListing } from '@/data/soldListings';
import { residence, person, agentIdentity } from '@/lib/schema';
import { SITE, telHref } from '@/lib/siteConfig';
import {
  formatPrice,
  formatBaths,
  formatSoldMonth,
  fullAddress,
  percentOfAsking,
  representationLabel,
} from '@/lib/listings';

/**
 * One closing, as its own document.
 *
 * WHY THESE PAGES EXIST. All ten listings used to live as `#listing-<slug>`
 * anchors on /properties. A fragment is not a page: it cannot be ranked, cited,
 * or linked to as a subject of its own, and the town guides had nothing
 * specific to point at. These sales are the only first-party, independently
 * checkable evidence on the site — a recorded transaction rather than a claim
 * about one — and evidence that cannot be addressed is evidence nobody reaches.
 *
 * WHAT KEEPS THEM FROM BEING THIN. Specs alone are what every aggregator
 * publishes about the same house, and ten pages of specs is precisely the
 * templated shape the blog corpus was cleaned of once. The `description`,
 * `soldDate`, `listPrice` and `represented` columns exist so each page can say
 * something only this broker can say. Every one of them is optional and every
 * one is OMITTED when absent — the page never placeholds, never rounds a
 * missing number to zero, and never implies a representation side that was not
 * recorded.
 *
 * Rendered entirely from the committed snapshot, deliberately. /properties
 * revalidates against Supabase after mount because a listing added since the
 * last sync should still appear in the list; a detail page has no such case —
 * its route does not exist until the next build anyway — so there is no fetch
 * here, no loading branch, and nothing that can differ between the prerendered
 * markup and the first client render.
 */

/** One labelled spec. Renders nothing when the value is unknown. */
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
        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
          {label}
        </dt>
        {/* Specs are numbers too — beds, baths, square feet, MLS number. */}
        <dd className="numeral mt-1 font-medium text-ink">{value}</dd>
      </div>
    </div>
  );

const PropertyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const listing = slug ? listingBySlug(slug) : undefined;

  /*
    A slug with no listing behind it. This is reachable only by hand-typing a
    URL — getStaticPaths builds a file for every real slug, and Vercel checks
    the filesystem before rewriting — but rendering the site's own 404 is
    better than a blank shell if it ever happens.
  */
  if (!listing) return <NotFound />;

  const address = fullAddress(listing);
  const soldMonth = formatSoldMonth(listing.soldDate);
  const asking = percentOfAsking(listing);
  const side = representationLabel(listing);
  const isSold = /sold/i.test(listing.status);

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Properties', path: '/properties' },
    { name: `${listing.address}, ${listing.town}`, path: `/properties/${listing.slug}` },
  ];

  /*
    Other closings in the same town, so a reader who came here from a search for
    the street has somewhere to go that is still about their town. Capped at
    three and silently empty when this is the only one — a "more in this town"
    heading over nothing is the same filler TownSoldListings refuses to render.
  */
  const alsoInTown = soldListings.filter(
    (l) => l.slug !== listing.slug && l.townSlug !== null && l.townSlug === listing.townSlug
  ).slice(0, 3);

  return (
    <PageShell
      path={`/properties/${listing.slug}`}
      crumbs={crumbs}
      width="wide"
      /*
        person() alongside the residence node: Kevin is the named agent on this
        transaction, and agentIdentity() is the compact declaration that lets
        any #agent reference resolve without dragging the full business node
        (address, hours, areaServed) onto ten more pages.
      */
      jsonLd={[residence(listing), agentIdentity(), person()]}
      seo={{
        // The address is unique across the site by construction, so no listing
        // title can collide with another page's under the topical-distinctness
        // rule. The town and state are what make it a real-world place rather
        // than a street name that exists in forty towns.
        title: `${listing.address}, ${listing.town}, MA`,
        description: [
          `${listing.propertyType || 'Home'} at ${address}`,
          listing.bedrooms !== null ? `${listing.bedrooms} bedrooms` : null,
          listing.livingArea !== null ? `${listing.livingArea.toLocaleString()} sq ft` : null,
          isSold && soldMonth ? `sold ${soldMonth}` : isSold ? 'sold' : null,
          `represented by Kevin Hoang, ${SITE.brokerage}.`,
        ]
          .filter(Boolean)
          .join(' · '),
        // The generated 1200x630 crop, never the 900px on-page photo. Null
        // falls through to SITE.defaultOgImage, which is always correct.
        ogImage: listing.ogImage ?? undefined,
        ogType: 'article',
      }}
      eyebrow={isSold ? 'Sold' : listing.status}
      h1={listing.address}
      lede={
        <>
          {listing.town}, Massachusetts
          {soldMonth ? ` · Sold ${soldMonth}` : null}
          {side ? ` · ${side}` : null}
        </>
      }
      heroSize="compact"
      cta={{
        // Interpolates the address, not just the town. Under the
        // topical-distinctness rule no <h2> string may repeat across pages, and
        // CtaBand's heading is an h2 — two Newton listings sharing a
        // town-level heading would collide with each other.
        heading: `What is a home like ${listing.address} worth today?`,
        body:
          'What this home actually closed at is the kind of evidence a valuation is built from. Ask what it means for yours — it costs nothing to find out.',
      }}
    >
      <ShellSection width="wide">
        {listing.images.length > 0 && (
          <Carousel className="mb-12" opts={{ loop: listing.images.length > 1 }}>
            <CarouselContent>
              {listing.images.map((src, i) => (
                <CarouselItem key={src}>
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={src}
                      /*
                        Positional alt text, deliberately. Nobody recorded what
                        each room is, and inventing "the sunlit primary
                        bedroom" would be describing a photograph nobody looked
                        at — the same fabrication rule that governs the copy.
                        The address plus the position is true and is what a
                        screen-reader user actually needs to navigate a gallery.
                      */
                      alt={`${listing.address} — photo ${i + 1} of ${listing.images.length}`}
                      className="h-full w-full object-cover"
                      loading={i === 0 ? undefined : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : undefined}
                      decoding="async"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {listing.images.length > 1 && (
              <>
                <CarouselPrevious className="left-3" />
                <CarouselNext className="right-3" />
              </>
            )}
          </Carousel>
        )}

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:gap-16">
          <div>
            {/*
              Inter with tabular lining figures, NOT the display serif. Playfair
              Display's default old-style figures make a price bounce — half the
              digits sit below the baseline and half are x-height. See .numeral
              in src/index.css.
            */}
            <p className="numeral text-4xl font-semibold tracking-tight text-ink">
              {formatPrice(listing.salePrice)}
            </p>
            <p className="mt-2 text-gray-600">
              <MapPin className="mr-1.5 inline h-4 w-4 text-champagne-ink" aria-hidden />
              {address}
            </p>

            {/*
              Closed-vs-asked, and only when both numbers are on the row.
              percentOfAsking returns null otherwise rather than assuming the
              asking price equalled the sale price — that would be a fabricated
              statistic about a real transaction.
            */}
            {asking !== null && listing.listPrice !== null && (
              <p className="mt-4 text-gray-700">
                Asked <span className="numeral">{formatPrice(listing.listPrice)}</span> ·
                closed at{' '}
                <strong className="numeral font-semibold text-ink">{asking}%</strong> of
                asking.
              </p>
            )}

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7 border-y border-gray-200 py-8 sm:grid-cols-3">
              <Spec icon={Bed} label="Bedrooms" value={listing.bedrooms?.toString() ?? null} />
              <Spec
                icon={Bath}
                label="Baths"
                value={
                  listing.fullBaths === null && listing.halfBaths === null
                    ? null
                    : formatBaths(listing.fullBaths, listing.halfBaths)
                }
              />
              <Spec
                icon={Square}
                label="Living area"
                value={listing.livingArea !== null ? `${listing.livingArea.toLocaleString()} sq ft` : null}
              />
              <Spec
                icon={MapPin}
                label="Property type"
                value={listing.propertyType || null}
              />
              <Spec icon={CalendarDays} label="Sold" value={soldMonth} />
              <Spec icon={Bed} label="MLS" value={listing.mlsnum || null} />
            </dl>

            {/*
              Kevin's own account of the property. Absent for a listing whose
              description has not been written, and the page simply does not
              have this section — no lorem, no auto-generated summary of the
              specs already listed above it.
            */}
            {listing.description && (
              <div className="mt-10">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  About {listing.address}
                </h2>
                <div className="mt-4 space-y-4 leading-relaxed text-gray-700">
                  {listing.description.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}

            {listing.townSlug && (
              <p className="mt-10 text-gray-700">
                More about this town in the{' '}
                <Link
                  to={`/neighborhoods/${listing.townSlug}`}
                  className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
                >
                  {listing.town} area guide
                </Link>
                , or see{' '}
                <Link
                  to="/properties"
                  className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
                >
                  every listing
                </Link>
                .
              </p>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-bone p-7">
              <span className="mb-4 block h-px w-10 bg-champagne" aria-hidden />
              <h2 className="font-display text-xl font-semibold text-ink">
                Ask about {listing.address}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                What a comparable home closed at — and how long it took — tells
                you more than any asking price. Ask what this one means for a
                home you own or want in {listing.town}.
              </p>
              <a
                href={telHref}
                className="btn-pill btn-pill-light mt-5 inline-flex items-center gap-2 rounded-full bg-ink-deep px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-champagne hover:text-ink-deep"
              >
                <Phone className="h-4 w-4" aria-hidden />
                Call {SITE.phone}
              </a>
              <p className="mt-5 text-sm text-gray-600">
                Or get a{' '}
                <Link
                  to="/home-valuation"
                  className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
                >
                  written valuation
                </Link>{' '}
                built from sales like this one.
              </p>
            </div>
          </aside>
        </div>

        {alsoInTown.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-12">
            {/*
              Heading interpolates the ADDRESS as well as the town. The town
              alone is not enough: two of these listings are in Newton, and a
              shared <h2> would have them competing with each other for the
              same query — which is the whole point of the rule.
            */}
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
              Other {listing.town} closings, besides {listing.address}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {alsoInTown.map((other: SoldListing) => (
                <li key={other.slug}>
                  <Link
                    to={`/properties/${other.slug}`}
                    className="block rounded-xl border border-gray-200 p-5 transition-colors hover:border-champagne"
                  >
                    <p className="font-semibold text-ink">{other.address}</p>
                    <p className="numeral mt-1 text-sm text-gray-600">
                      {formatPrice(other.salePrice)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ShellSection>
    </PageShell>
  );
};

export default PropertyDetail;
