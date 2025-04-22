
import React from "react";
import { motion } from "framer-motion";
import { Home, TrendingUp, FileCheck } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const resources = [
  {
    icon: Home,
    title: "Home Preparation Guide",
    description:
      "Comprehensive guide to preparing your Boston area home for sale to maximize its appeal and value to potential buyers.",
    color: "bg-blue-500",
    link: "/blog?category=home-preparation",
  },
  {
    icon: TrendingUp,
    title: "Pricing Strategy Guide",
    description:
      "Learn how to price your home effectively in the competitive Greater Boston market to attract serious buyers.",
    color: "bg-green-500",
    link: "/blog?category=pricing-strategy",
  },
  {
    icon: FileCheck,
    title: "Seller Documentation Guide",
    description:
      "Overview of all the documents and disclosures required when selling your home in Massachusetts.",
    color: "bg-purple-500",
    link: "/blog?category=seller-documentation",
  },
];

const SellerResources = () => {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a1a1a] mb-4">SELLER RESOURCES</h2>
          <p className="text-gray-600">
            Access these resources to confidently prepare, price, and complete the sale of your property.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div
                  className={`w-12 h-12 ${resource.color} text-white rounded-lg flex items-center justify-center mb-4`}
                >
                  <resource.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
                  {resource.title}
                </h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <Link
                  to={resource.link}
                  className="inline-flex items-center text-[#1a1a1a] font-medium group relative"
                >
                  <span className="relative">
                    View Resource
                    <span className="absolute -bottom-[2px] left-0 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300" />
                  </span>
                  <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerResources;
