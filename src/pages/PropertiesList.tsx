import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Bed, Bath, Square } from 'lucide-react';

interface Property {
  id: number;
  mlsnum: string;
  property_type: string;
  address: string;
  town: string;
  zip_code: string;
  sale_price: number | null;
  bedrooms: number | null;
  full_baths: number | null;
  half_baths: number | null;
  living_area: number | null;
  photo_count: number;
}

const PropertiesList = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Record<string, string[]>>({});

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
      
      // Generate image URLs for each property based on photo_count
      if (sortedData) {
        sortedData.forEach((property) => {
          loadPropertyImages(property.mlsnum, property.photo_count);
        });
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMLSPhotoUrl = (mlsnum: string, photoIndex: number): string => {
    return `https://media.mlspin.com/photo.aspx?nopadding=1&h=768&w=1024&mls=${mlsnum}&o=&n=${photoIndex}`;
  };

  const loadPropertyImages = (mlsnum: string, photoCount: number) => {
    const images: string[] = [];
    
    // Use photo_count from database - load photos from 0 to photo_count - 1
    for (let i = 0; i < photoCount; i++) {
      const url = getMLSPhotoUrl(mlsnum, i);
      images.push(url);
    }
    
    setLoadedImages((prev) => ({
      ...prev,
      [mlsnum]: images,
    }));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-4xl font-bold text-[#1a1a1a] mb-8">Properties</h1>
        
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No properties available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const images = loadedImages[property.mlsnum] || [];
              const hasImages = images.length > 0;
              
              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Photo Carousel */}
                  <div className="relative aspect-[16/9] bg-gray-200 overflow-hidden">
                    {hasImages ? (
                      <Carousel className="w-full h-full" opts={{ loop: true, dragFree: true }}>
                        <CarouselContent className="h-full -ml-0">
                          {images.map((imageUrl, index) => (
                            <CarouselItem key={index} className="h-full pl-0 basis-full">
                              <div className="w-full h-full overflow-hidden relative">
                                <img
                                  src={imageUrl}
                                  alt={`${property.address} - Photo ${index + 1}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  style={{
                                    objectPosition: 'center center',
                                  }}
                                  onError={(e) => {
                                    // If image fails to load, hide it
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
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-[#1a1a1a]">
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
            
            {/* AND MORE Card */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300">
              <div className="relative aspect-[16/9] bg-gray-100 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-4xl font-bold text-gray-400 mb-4">AND MORE</div>
                  <p className="text-gray-500 text-sm">
                    More properties coming soon
                  </p>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-400">
                    Coming Soon
                  </div>
                  <div className="text-gray-500 text-sm">
                    Check back for new listings
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesList;
