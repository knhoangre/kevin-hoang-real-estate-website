
import { BookOpen, Map, Flag } from "lucide-react";

const resources = [
  {
    title: "Home Preparation Guide",
    description: "How to prepare your home for a successful sale.",
    icon: BookOpen,
  },
  {
    title: "Market Analysis",
    description: "Understanding your home's value in the current market.",
    icon: Map,
  },
  {
    title: "Selling Timeline",
    description: "What to expect during the selling process.",
    icon: Flag,
  },
];

const SellerResources = () => {
  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">HELPFUL RESOURCES</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {resources.map((resource, index) => (
          <div key={index} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
            <resource.icon className="w-8 h-8 mb-4 text-[#1a1a1a]" />
            <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
            <p className="text-gray-600">{resource.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerResources;
