import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { soldListings, type SoldListing } from '@/data/soldListings';
import { itemList } from '@/lib/schema';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Bed, Bath, Square, Phone } from 'lucide-react';
import PageShell, { ShellSection } from "@/components/PageShell";
import { Link } from "react-router-dom";
import { SITE, telHref } from "@/lib/siteConfig";

/**
 * The Supabase row shape, which is snake_case and differs from the camelCase
 * SoldListing the prerendered snapshot uses. Only the live revalidation below
 * sees this; everything that renders works in SoldListing.
 */
interface PropertyRow {
  id: number;
  mlsnum: string;
  property_type: string;
  status?: string | null;
  address: string;
  town: string;
  zip_code: string;
  sale_price: number | null;
  bedrooms: number | null;
  full_baths: number | null;
  half_baths: number | null;
  living_area: number | null;
  image_urls: string[] | null;
}

/** Every MA ZIP starts with 0, and 8 of 10 rows lost it to a numeric import. */
const normalizeZip = (raw: string) => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits.length === 4 ? digits.padStart(5, '0') : digits;
};

/**
 * Maps a live Supabase row onto the snapshot's shape.
 *
 * Deliberately mirrors scripts/sync-listings.mjs — the town suffix strip and
 * the ZIP padding have to agree, or a listing would visibly change format the
 * instant the client-side revalidation replaced the prerendered copy.
 */
const fromRow = (r: PropertyRow): SoldListing => ({
  id: r.id,
  mlsnum: r.mlsnum ?? '',
  slug: String(r.id),
  status: (r.status ?? 'Sold').trim(),
  propertyType: (r.property_type ?? '').trim(),
  address: (r.address ?? '').trim(),
  town: String(r.town ?? '').replace(/,?\s*(MA|Massachusetts)\.?$/i, '').trim(),
  townSlug: null,
  zipCode: normalizeZip(r.zip_code),
  salePrice: r.sale_price,
  bedrooms: r.bedrooms,
  fullBaths: r.full_baths,
  halfBaths: r.half_baths,
  livingArea: r.living_area,
  images: Array.isArray(r.image_urls) ? r.image_urls.filter(Boolean) : [],
});

/** Highest price first; unpriced listings last rather than sorted as zero. */
const byPriceDesc = (a: SoldListing, b: SoldListing) => {
  if (a.salePrice === null && b.salePrice === null) return 0;
  if (a.salePrice === null) return 1;
  if (b.salePrice === null) return -1;
  return b.salePrice - a.salePrice;
};

const PropertiesList = () => {
  const { t } = useTranslation();

  /*
    Seeded from the committed snapshot rather than from an empty array.

    This is the whole reason src/data/soldListings.ts exists. The listings used
    to arrive only from the effect below, so at static-generation time this
    component rendered its spinner and the prerendered HTML for /properties
    contained no listings at all — on the one page whose subject is listings.
    Seeding from the snapshot puts the real content in the HTML, and because the
    server and the first client render both read the same module, hydration
    matches.
  */
  const [properties, setProperties] = useState<SoldListing[]>(() =>
    [...soldListings].sort(byPriceDesc)
  );

  /*
    Revalidate against Supabase after mount, so a listing added in
    /admin/properties appears before the next deploy re-runs the sync script.

    An effect, never during render: this reads the network and would otherwise
    diverge from the prerendered markup. A failure is deliberately silent — the
    snapshot is already on screen, and replacing real listings with an error
    state because a refresh failed would be strictly worse than showing slightly
    stale ones.
  */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        if (cancelled || !data?.length) return;

        setProperties((data as PropertyRow[]).map(fromRow).sort(byPriceDesc));
      } catch (err) {
        console.error('Error refreshing properties:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'Price on Request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatBaths = (full: number | null, half: number | null) => {
    const fullBaths = full || 0;
    const halfBaths = half || 0;
    if (halfBaths > 0) {
      return `${fullBaths}.${halfBaths}`;
    }
    return fullBaths.toString();
  };

  const formatBadgeText = (value: string | null | undefined, fallback: string) => {
    const normalized = value?.trim();
    if (!normalized) return fallback;
    return normalized.toUpperCase();
  };

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Properties", path: "/properties" },
  ];

  return (
    <PageShell
      path="/properties"
      crumbs={crumbs}
      /*
       * ItemList is now emitted, and the reason it previously was not has been
       * removed rather than worked around.
       *
       * It used to be withheld because the listings arrived from an effect, so
       * nothing was in the prerendered HTML and describing a list that was not
       * on the page would have been a claim about content that did not exist.
       * The page now renders from a committed snapshot, so the items ARE in the
       * document and the markup describes what a reader actually sees.
       *
       * ItemList and not RealEstateListing or Product: see the note at the foot
       * of src/lib/schema.ts. Neither yields a rich result for residential
       * listings, and Product markup on real estate is off-label enough to carry
       * manual-action risk.
       */
      jsonLd={itemList(
        properties.map((p) => ({
          name: `${p.address}, ${p.town}, MA`,
          url: `/properties#listing-${p.slug}`,
        }))
      )}
      seo={{
        title: 'Current Listings in Greater Boston',
        description:
          'Browse current and recent listings across Needham, MetroWest, and Greater Boston, with photos, details, and a direct line to ask about any of them.',
        keywords:
          'homes for sale Needham MA, Greater Boston listings, MetroWest homes for sale, Massachusetts property listings',
      }}
      eyebrow="Listings"
      h1={t('properties.title')}
      lede={t('properties.subtitle')}
      hero={{
        image:
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=65',
        alt: 'A grey New England colonial set back behind a wide front lawn',
      }}
      heroSize="standard"
      width="wide"
      cta={{
        heading: 'Want to see one of these in person?',
        body:
          'Ask about any listing here, or about one that is not. Touring costs nothing and is the fastest way to find out what you actually want.',
      }}
    >
      <ShellSection width="wide">
        {/*
          Prerendered context, above the data fetch.

          Everything below the heading on this page comes from Supabase, so what
          a crawler and a first-time visitor receive is a heading, a subtitle and
          a spinner. This block does not depend on the query, so it is in the
          static HTML, and it gives both a reason to stay.

          Two columns rather than three equal cells: the explanation is
          explanation, and "looking for something not here?" is a phone CTA that
          was wearing the same clothes as its neighbours — same heading size,
          same body colour, with the number buried as an inline underline in the
          fourth sentence of a paragraph.
        */}
        <div className="mb-14 grid gap-10 border-y border-gray-200 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:gap-14">
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">
                What you are looking at
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Current and recently closed listings represented by Kevin Hoang,
                across {SITE.areaServed.length} towns in MetroWest and Greater
                Boston. Sold properties stay listed because what a home actually
                closed at is more useful than what it was asked.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">
                What a listing price actually tells you
              </h2>
              <p className="text-gray-600 leading-relaxed">
                In much of MetroWest and Greater Boston, homes routinely close
                above asking, and in other segments and seasons they close below
                it — so the asking price is a starting position rather than a
                value. What a comparable home actually closed at, and how long it
                took, tells you far more. That is the same evidence a{' '}
                <Link to="/home-valuation" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                  written valuation
                </Link>{' '}
                is built from, and it is why sold listings stay on this page.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">
                Before you tour anything
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Two things make the difference between looking and buying: a
                written{' '}
                <Link to="/blog/pre-approval-checklist" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                  pre-approval
                </Link>{' '}
                rather than a pre-qualification, and knowing the{' '}
                <Link to="/neighborhoods" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                  town and the street
                </Link>{' '}
                before you fall for a house. The{' '}
                <Link to="/buyer" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                  buyer&rsquo;s roadmap
                </Link>{' '}
                walks through the rest.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-bone p-7 lg:sticky lg:top-28 lg:self-start">
            <span className="mb-4 block h-px w-10 bg-champagne" aria-hidden />
            <h2 className="font-display text-xl font-semibold text-ink">
              Looking for something not here?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              This is not the whole market — it is one broker&rsquo;s listings. If
              you are buying, the search that matters covers everything available
              in your towns and price band, including homes not yet publicly
              listed.
            </p>
            <a
              href={telHref}
              className="btn-pill btn-pill-light mt-5 inline-flex items-center gap-2 rounded-full bg-ink-deep px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-champagne hover:text-ink-deep"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Call {SITE.phone}
            </a>
          </div>
        </div>

          {/*
            No loading branch any more. The list is seeded from the committed
            snapshot, so there is content on the very first paint — including in
            the prerendered HTML — and a spinner would only ever have flashed for
            the background revalidation.
          */}
          {properties.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No properties available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              // Handle null, undefined, or empty array cases
              const images = Array.isArray(property.images) && property.images.length > 0 
                ? property.images 
                : [];
              const hasImages = images.length > 0;

              return (
                <Card
                  key={property.id}
                  id={`listing-${property.slug}`}
                  className="overflow-hidden border border-transparent transition-all duration-300 hover:border-champagne hover:shadow-lg"
                >
                  {/* Photo Carousel */}
                  <div className="relative aspect-[16/9] bg-gray-200 overflow-hidden">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center rounded-full bg-black/75 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
                        {formatBadgeText(property.status, 'ACTIVE')}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-ink backdrop-blur-sm">
                        {formatBadgeText(property.propertyType, 'PROPERTY')}
                      </span>
                    </div>
                    {hasImages ? (
                      <Carousel 
                        className="w-full h-full" 
                        opts={{ loop: true, dragFree: true }}
                        style={{ height: '100%' }}
                      >
                        <CarouselContent className="-ml-0 h-full">
                          {images.map((imageUrl, index) => (
                            <CarouselItem key={index} className="pl-0 basis-full h-full">
                              <div className="relative w-full h-full">
                                <img
                                  src={imageUrl}
                                  alt={`${property.address} - Photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  style={{
                                  objectPosition: 'center center',
                                  }}
                                  loading={index === 0 ? undefined : 'lazy'}
                                  decoding="async"
                                  onError={(e) => {
                                    // Hide a photo that 404s rather than
                                    // leaving a broken-image glyph in the
                                    // carousel. The console pair that used to
                                    // sit here fired on every image on every
                                    // render, in production.
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {images.length > 1 && (
                          <>
                            <CarouselPrevious className="left-2 h-8 w-8 bg-white/80 hover:bg-white" />
                            <CarouselNext className="right-2 h-8 w-8 bg-white/80 hover:bg-white" />
                          </>
                        )}
                      </Carousel>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Square className="h-16 w-16 mx-auto mb-2" />
                          <p className="text-sm">No photos available</p>
                          {property.mlsnum && (
                            <p className="text-xs mt-1 text-gray-300">
                              MLS: {property.mlsnum}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-ink">
                        {formatCurrency(property.salePrice)}
                      </div>
                      <div className="text-gray-600">
                        {property.address}, {property.town}, MA {property.zipCode}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
                        {property.bedrooms !== null && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms}</span>
                          </div>
                        )}
                        {(property.fullBaths !== null || property.halfBaths !== null) && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{formatBaths(property.fullBaths, property.halfBaths)}</span>
                          </div>
                        )}
                        {property.livingArea !== null && (
                          <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            <span>{property.livingArea.toLocaleString()} sq ft</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
          </div>
        )}
      </ShellSection>
    </PageShell>
  );
};

export default PropertiesList;
