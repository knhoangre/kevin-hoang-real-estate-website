
const neighborhoods = [
  "Cambridge", "Somerville", "Newton", "Lexington", "Weston", 
  "Wellesley", "Dover", "Medford", "Braintree", "Quincy", "Malden"
];

const Neighborhoods = () => {
  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container px-4 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-12">
          NEIGHBORHOODS SERVED
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {neighborhoods.map((neighborhood) => (
            <div 
              key={neighborhood}
              className="p-6 bg-gray-50 rounded-lg hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 cursor-pointer"
            >
              <h3 className="text-2xl font-semibold uppercase">{neighborhood}</h3>
            </div>
          ))}
          
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="text-2xl font-semibold text-gray-500 uppercase">AND MANY MORE...</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Neighborhoods;
