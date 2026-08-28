import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
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

interface Property {
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
  image_urls: string[];
}

const PropertiesList = () => {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Sort properties by price (highest first, null prices go to end)
      const sortedData = (data || []).sort((a, b) => {
        if (a.sale_price === null && b.sale_price === null) return 0;
        if (a.sale_price === null) return 1;
        if (b.sale_price === null) return -1;
        return (b.sale_price as number) - (a.sale_price as number);
      });
      
      setProperties(sortedData);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
       * The head is emitted by the shell, above the isLoading branch below.
       *
       * Listings are fetched from Supabase in an effect, so at static-generation
       * time this component renders the spinner branch — which used to mean the
       * route prerendered with no title, description, or canonical at all.
       *
       * No ItemList schema, for the same reason: there are no listings in the
       * prerendered HTML to describe, and marking up an empty list would be a
       * claim about content that is not on the page.
       */
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

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No properties available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              // Handle null, undefined, or empty array cases
              const images = Array.isArray(property.image_urls) && property.image_urls.length > 0 
                ? property.image_urls 
                : [];
              const hasImages = images.length > 0;

              return (
                <Card
                  key={property.id}
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
                        {formatBadgeText(property.property_type, 'PROPERTY')}
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
                        {formatCurrency(property.sale_price)}
                      </div>
                      <div className="text-gray-600">
                        {property.address}, {property.town}, MA {property.zip_code}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
                        {property.bedrooms !== null && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms}</span>
                          </div>
                        )}
                        {(property.full_baths !== null || property.half_baths !== null) && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{formatBaths(property.full_baths, property.half_baths)}</span>
                          </div>
                        )}
                        {property.living_area !== null && (
                          <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            <span>{property.living_area.toLocaleString()} sq ft</span>
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
