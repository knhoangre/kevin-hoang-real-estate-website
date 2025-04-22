
import { Home, TrendingUp, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const resources = [
  {
    title: "Home Preparation Guide",
    description: "Comprehensive guide to preparing your Boston area home for sale to maximize its appeal and value to potential buyers.",
    icon: Home,
    content: [
      "Essential repairs to complete before listing",
      "Cost-effective staging strategies",
      "Curb appeal improvements with high ROI",
      "Professional photography preparation checklist",
      "Quick fixes to address common buyer concerns"
    ],
    link: "/blog?category=home-preparation"
  },
  {
    title: "Pricing Strategy Guide",
    description: "Learn how to price your home effectively in the competitive Greater Boston market to attract serious buyers.",
    icon: TrendingUp,
    content: [
      "Comparative market analysis explained",
      "Pricing psychology that drives buyer interest",
      "When to consider pricing below market value",
      "Economic factors that influence local pricing",
      "Setting the right price for your neighborhood"
    ],
    link: "/blog?category=pricing-strategy"
  },
  {
    title: "Seller Documentation Guide",
    description: "Overview of all the documents and disclosures required when selling your home in Massachusetts.",
    icon: FileCheck,
    content: [
      "Required property disclosures in Massachusetts",
      "Title documentation preparation",
      "Understanding the purchase and sale agreement",
      "Environmental certifications and requirements",
      "Tax implications of your home sale"
    ],
    link: "/blog?category=seller-documentation"
  },
];

const SellerResources = () => {
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

export default SellerResources;
