
import { BookOpen, Map, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const resources = [
  {
    title: "First-Time Buyer Guide",
    description: "Everything you need to know about buying your first home in the Boston area, from financing options to what to expect during the closing process.",
    icon: BookOpen,
    content: [
      "Understanding mortgage pre-approval",
      "Hidden costs of homeownership",
      "First-time buyer assistance programs in Massachusetts",
      "The home inspection process explained",
      "Negotiation strategies for your first purchase"
    ],
    link: "/blog?category=first-time-buyers"
  },
  {
    title: "Neighborhood Guides",
    description: "Detailed information about Boston's diverse neighborhoods and surrounding communities, helping you find the perfect location for your lifestyle.",
    icon: Map,
    content: [
      "School district ratings and information",
      "Transportation options and commute times",
      "Local amenities and attractions",
      "Crime statistics and safety information",
      "Property value trends by neighborhood"
    ],
    link: "/neighborhoods"
  },
  {
    title: "Market Reports",
    description: "Stay informed with the latest Greater Boston market trends, pricing data, and forecasts to make confident real estate decisions.",
    icon: Flag,
    content: [
      "Monthly housing market updates",
      "Price per square foot analysis by neighborhood",
      "Days on market trends",
      "Absorption rate and inventory levels",
      "Interest rate impacts on the local market"
    ],
    link: "/blog?category=market-reports"
  },
];

const BuyerResources = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" } }
  };

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">HELPFUL RESOURCES</h2>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
      >
        {resources.map((resource, index) => (
          <motion.div 
            key={index} 
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
            variants={itemVariants}
          >
            <div className="p-6">
              <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <resource.icon className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{resource.title}</h3>
              <p className="text-gray-600 mb-6">{resource.description}</p>
              
              <div className="space-y-2 mb-6">
                {resource.content.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
              
              <Button asChild className="w-full bg-[#1a1a1a] hover:bg-black">
                <Link to={resource.link}>View Resource</Link>
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default BuyerResources;
