
import { useEffect } from "react";
import Navbar from "@/components/Navbar";

const neighborhoods = [
  { 
    name: "Cambridge", 
    image: "https://images.unsplash.com/photo-1569262148976-0483d3720139?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Somerville", 
    image: "https://images.unsplash.com/photo-1598889556318-6f1427a9a8f3?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Newton", 
    image: "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Lexington", 
    image: "https://images.unsplash.com/photo-1600607286953-0cd6b629cfd5?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Weston", 
    image: "https://images.unsplash.com/photo-1561471606-23f2bcacee9c?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Wellesley", 
    image: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Dover", 
    image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Medford", 
    image: "https://images.unsplash.com/photo-1600607688066-89c8e9b11171?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Braintree", 
    image: "https://images.unsplash.com/photo-1564501984566-6d7484df3312?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Quincy", 
    image: "https://images.unsplash.com/photo-1534198237239-98efd261394e?auto=format&fit=crop&w=500&h=300" 
  },
  { 
    name: "Malden", 
    image: "https://images.unsplash.com/photo-1586892477838-2b96e85e0f96?auto=format&fit=crop&w=500&h=300" 
  }
];

const Neighborhoods = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-12">
            NEIGHBORHOODS SERVED
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {neighborhoods.map((neighborhood) => (
              <div 
                key={neighborhood.name}
                className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={neighborhood.image} 
                    alt={`${neighborhood.name} neighborhood`}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 bg-white">
                  <h3 className="text-2xl font-semibold uppercase">{neighborhood.name}</h3>
                </div>
              </div>
            ))}
            
            <div className="overflow-hidden rounded-lg shadow-md">
              <div className="p-6 bg-gray-50 h-full flex items-center justify-center">
                <h3 className="text-2xl font-semibold text-gray-500 uppercase">AND MANY MORE...</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Neighborhoods;
