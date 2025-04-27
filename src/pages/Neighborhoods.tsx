import { useEffect } from "react";
import Navbar from "@/components/Navbar";

const neighborhoods = [
  {
    name: "Cambridge",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=500&h=300"
  },
  {
    name: "Somerville",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&h=300"
  },
  {
    name: "Newton",
    image: "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&w=500&h=300"
  },
  {
    name: "Lexington",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&h=300"
  },
  {
    name: "Weston",
    image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=500&h=300"
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
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=500&h=300"
  },
  {
    name: "Braintree",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&h=300"
  },
  {
    name: "Quincy",
    image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=500&h=300"
  },
  {
    name: "Malden",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=500&h=300"
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
