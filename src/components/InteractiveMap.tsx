
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Boston coordinates
const BOSTON_CENTER = [-71.0589, 42.3601];

// Sample property listings
const SAMPLE_LISTINGS = [
  {
    id: 1,
    title: "Luxury Downtown Condo",
    price: 1200000,
    beds: 2,
    baths: 2,
    sqft: 1200,
    address: "120 Tremont St, Boston, MA",
    neighborhood: "Downtown",
    lat: -71.0605,
    lng: 42.3562,
    walkability: 95,
    schools: 4.2,
  },
  {
    id: 2,
    title: "Modern Back Bay Apartment",
    price: 950000,
    beds: 1,
    baths: 1,
    sqft: 850,
    address: "180 Newbury St, Boston, MA",
    neighborhood: "Back Bay",
    lat: -71.0789,
    lng: 42.3493,
    walkability: 90,
    schools: 4.5,
  },
  {
    id: 3,
    title: "Seaport Waterfront Condo",
    price: 1850000,
    beds: 3,
    baths: 2.5,
    sqft: 1800,
    address: "50 Liberty Dr, Boston, MA",
    neighborhood: "Seaport",
    lat: -71.0478,
    lng: 42.3537,
    walkability: 88,
    schools: 4.0,
  },
  {
    id: 4,
    title: "Beacon Hill Brownstone",
    price: 2500000,
    beds: 4,
    baths: 3,
    sqft: 2400,
    address: "34 Beacon St, Boston, MA",
    neighborhood: "Beacon Hill",
    lat: -71.0698,
    lng: 42.3578,
    walkability: 93,
    schools: 4.8,
  },
  {
    id: 5,
    title: "Cambridge Modern Townhome",
    price: 1350000,
    beds: 3,
    baths: 2.5,
    sqft: 1950,
    address: "125 Cambridge St, Cambridge, MA",
    neighborhood: "Cambridge",
    lat: -71.0842,
    lng: 42.3736,
    walkability: 91,
    schools: 4.7,
  },
];

type FilterState = {
  minPrice: number;
  maxPrice: number;
  beds: number;
  baths: number;
  neighborhoods: string[];
  minWalkability: number;
  minSchoolRating: number;
};

const InteractiveMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [showTokenInput, setShowTokenInput] = useState<boolean>(true);
  const [listings, setListings] = useState(SAMPLE_LISTINGS);
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 3000000,
    beds: 0,
    baths: 0,
    neighborhoods: [],
    minWalkability: 0,
    minSchoolRating: 0,
  });

  // Extract unique neighborhoods
  const neighborhoods = [...new Set(SAMPLE_LISTINGS.map(listing => listing.neighborhood))];

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: BOSTON_CENTER,
      zoom: 12.5,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add event listener for when the map finishes loading
    map.current.on('load', () => {
      addMarkers();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      markers.current = [];
    };
  };

  const addMarkers = () => {
    if (!map.current) return;
    
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for each listing
    listings.forEach(listing => {
      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold">${listing.title}</h3>
          <p class="text-green-600 font-semibold">$${listing.price.toLocaleString()}</p>
          <p>${listing.beds} bd | ${listing.baths} ba | ${listing.sqft} sqft</p>
          <p class="text-sm text-gray-600">${listing.address}</p>
          <button class="bg-[#1a1a1a] text-white px-2 py-1 rounded text-xs mt-2">View Details</button>
        </div>
      `);
      
      // Create marker
      const marker = new mapboxgl.Marker({ color: '#1a1a1a' })
        .setLngLat([listing.lat, listing.lng])
        .setPopup(popup)
        .addTo(map.current);
      
      markers.current.push(marker);
    });
  };

  const applyFilters = () => {
    const filteredListings = SAMPLE_LISTINGS.filter(listing => {
      // Price filter
      if (listing.price < filters.minPrice || listing.price > filters.maxPrice) return false;
      
      // Beds filter
      if (filters.beds > 0 && listing.beds < filters.beds) return false;
      
      // Baths filter
      if (filters.baths > 0 && listing.baths < filters.baths) return false;
      
      // Neighborhood filter
      if (filters.neighborhoods.length > 0 && !filters.neighborhoods.includes(listing.neighborhood)) return false;
      
      // Walkability filter
      if (listing.walkability < filters.minWalkability) return false;
      
      // School rating filter
      if (listing.schools < filters.minSchoolRating) return false;
      
      return true;
    });
    
    setListings(filteredListings);
    
    // Update map markers
    if (map.current) {
      setTimeout(() => addMarkers(), 0);
    }
  };

  useEffect(() => {
    if (mapboxToken) {
      initializeMap();
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (map.current) {
      addMarkers();
    }
  }, [listings]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken) {
      setShowTokenInput(false);
      initializeMap();
    }
  };

  const toggleNeighborhood = (neighborhood: string) => {
    setFilters(prev => {
      const updatedNeighborhoods = prev.neighborhoods.includes(neighborhood)
        ? prev.neighborhoods.filter(n => n !== neighborhood)
        : [...prev.neighborhoods, neighborhood];
      
      return {
        ...prev,
        neighborhoods: updatedNeighborhoods
      };
    });
  };

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">PROPERTY MAP</h2>
        
        {showTokenInput ? (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Enter Mapbox Token</h3>
            <p className="mb-4 text-gray-600">
              To use the interactive map, you need to provide a Mapbox access token. 
              Get one for free at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">mapbox.com</a>
            </p>
            <form onSubmit={handleTokenSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="pk.eyJ1IjoieW91..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Submit</Button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-1 space-y-6 bg-gray-50 p-4 rounded-lg h-[600px] overflow-y-auto">
              <div>
                <h3 className="font-semibold mb-2">Price Range</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: parseInt(e.target.value) || 0})}
                    className="w-full"
                  />
                  <span>to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value) || 0})}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Bedrooms</h3>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <Button
                      key={num}
                      type="button"
                      variant={filters.beds === num ? "default" : "outline"}
                      className="flex-1 px-2"
                      onClick={() => setFilters({...filters, beds: num})}
                    >
                      {num === 0 ? 'Any' : num === 5 ? '5+' : num}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Bathrooms</h3>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map(num => (
                    <Button
                      key={num}
                      type="button"
                      variant={filters.baths === num ? "default" : "outline"}
                      className="flex-1 px-2"
                      onClick={() => setFilters({...filters, baths: num})}
                    >
                      {num === 0 ? 'Any' : num === 4 ? '4+' : num}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Neighborhoods</h3>
                <div className="space-y-2">
                  {neighborhoods.map(neighborhood => (
                    <div key={neighborhood} className="flex items-center space-x-2">
                      <Checkbox
                        id={`neighborhood-${neighborhood}`}
                        checked={filters.neighborhoods.includes(neighborhood)}
                        onCheckedChange={() => toggleNeighborhood(neighborhood)}
                      />
                      <label 
                        htmlFor={`neighborhood-${neighborhood}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {neighborhood}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Walkability Score (Min: {filters.minWalkability})</h3>
                <Slider
                  defaultValue={[0]}
                  max={100}
                  step={5}
                  value={[filters.minWalkability]}
                  onValueChange={(value) => setFilters({...filters, minWalkability: value[0]})}
                  className="my-4"
                />
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">School Rating (Min: {filters.minSchoolRating})</h3>
                <Slider
                  defaultValue={[0]}
                  max={5}
                  step={0.5}
                  value={[filters.minSchoolRating]}
                  onValueChange={(value) => setFilters({...filters, minSchoolRating: value[0]})}
                  className="my-4"
                />
              </div>
              
              <Button onClick={applyFilters} className="w-full bg-[#1a1a1a]">
                Apply Filters
              </Button>
              
              <div className="text-center text-sm text-gray-500">
                {listings.length} properties found
              </div>
            </div>
            
            <div className="lg:col-span-3 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <div ref={mapContainer} className="w-full h-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMap;
