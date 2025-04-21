
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Sample listings for demonstration
const availableListings = [
  {
    id: 1,
    title: "Luxury Downtown Condo",
    price: 1200000,
    beds: 2,
    baths: 2,
    sqft: 1200,
    address: "120 Tremont St, Boston, MA",
    yearBuilt: 2018,
    hoa: 650,
    propertyTax: 12000,
    walkability: 95,
    transitScore: 98,
    schoolScore: 8.5,
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=500&h=300",
  },
  {
    id: 2,
    title: "Modern Back Bay Apartment",
    price: 950000,
    beds: 1,
    baths: 1,
    sqft: 850,
    address: "180 Newbury St, Boston, MA",
    yearBuilt: 2015,
    hoa: 550,
    propertyTax: 9500,
    walkability: 90,
    transitScore: 95,
    schoolScore: 8.2,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=500&h=300",
  },
  {
    id: 3,
    title: "Seaport Waterfront Condo",
    price: 1850000,
    beds: 3,
    baths: 2.5,
    sqft: 1800,
    address: "50 Liberty Dr, Boston, MA",
    yearBuilt: 2019,
    hoa: 850,
    propertyTax: 18500,
    walkability: 88,
    transitScore: 85,
    schoolScore: 8.0,
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=500&h=300",
  },
  {
    id: 4,
    title: "Beacon Hill Brownstone",
    price: 2500000,
    beds: 4,
    baths: 3,
    sqft: 2400,
    address: "34 Beacon St, Boston, MA",
    yearBuilt: 1920,
    hoa: 0,
    propertyTax: 25000,
    walkability: 93,
    transitScore: 90,
    schoolScore: 9.0,
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=500&h=300",
  },
  {
    id: 5,
    title: "Cambridge Modern Townhome",
    price: 1350000,
    beds: 3,
    baths: 2.5,
    sqft: 1950,
    address: "125 Cambridge St, Cambridge, MA",
    yearBuilt: 2017,
    hoa: 450,
    propertyTax: 13500,
    walkability: 91,
    transitScore: 88,
    schoolScore: 9.2,
    image: "https://images.unsplash.com/photo-1494526585095-c41caae081a2?auto=format&fit=crop&w=500&h=300",
  },
];

const PropertyComparison = () => {
  const [selectedProperties, setSelectedProperties] = useState<typeof availableListings>([]);
  
  const addProperty = (property: typeof availableListings[0]) => {
    if (selectedProperties.length < 3 && !selectedProperties.some(p => p.id === property.id)) {
      setSelectedProperties([...selectedProperties, property]);
    }
  };
  
  const removeProperty = (propertyId: number) => {
    setSelectedProperties(selectedProperties.filter(p => p.id !== propertyId));
  };
  
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">COMPARE PROPERTIES</h2>
        
        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            Select up to 3 properties to compare side-by-side. This helps you make an informed decision by easily comparing features.
          </p>
          
          {selectedProperties.length < 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {availableListings
                .filter(listing => !selectedProperties.some(p => p.id === listing.id))
                .map(listing => (
                  <div 
                    key={listing.id}
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={listing.image} 
                        alt={listing.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{listing.title}</h3>
                      <p className="text-green-600 font-bold">${listing.price.toLocaleString()}</p>
                      <p className="text-gray-600">
                        {listing.beds} bd | {listing.baths} ba | {listing.sqft.toLocaleString()} sqft
                      </p>
                      <p className="text-gray-500 text-sm">{listing.address}</p>
                      
                      <Button 
                        onClick={() => addProperty(listing)} 
                        className="mt-4 w-full"
                      >
                        Add to Comparison
                      </Button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
        
        {selectedProperties.length > 0 && (
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Features</TableHead>
                  {selectedProperties.map(property => (
                    <TableHead key={property.id} className="text-center">
                      <div className="flex flex-col items-center">
                        <div className="relative w-full h-32 mb-2">
                          <img 
                            src={property.image} 
                            alt={property.title} 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeProperty(property.id)}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="font-semibold">{property.title}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Price</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center font-semibold text-green-600">
                      ${property.price.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Address</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      {property.address}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bedrooms</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      {property.beds}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bathrooms</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      {property.baths}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Square Feet</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      {property.sqft.toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Year Built</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      {property.yearBuilt}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">HOA Fees</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      {property.hoa > 0 ? `$${property.hoa}/month` : 'None'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Property Tax</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      ${property.propertyTax.toLocaleString()}/year
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Walkability</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center relative">
                          <div 
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `conic-gradient(#1a1a1a ${property.walkability}%, transparent 0)`,
                              transform: 'rotate(-90deg)'
                            }}
                          />
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center z-10">
                            {property.walkability}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Transit Score</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center relative">
                          <div 
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `conic-gradient(#1a1a1a ${property.transitScore}%, transparent 0)`,
                              transform: 'rotate(-90deg)'
                            }}
                          />
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center z-10">
                            {property.transitScore}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">School Score</TableCell>
                  {selectedProperties.map(property => (
                    <TableCell key={property.id} className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                          <svg 
                            key={star} 
                            className={`w-4 h-4 ${star <= property.schoolScore ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyComparison;
