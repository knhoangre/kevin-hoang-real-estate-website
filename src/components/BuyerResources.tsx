
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calculator, FileText, Home, BarChart3, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const resources = [
  {
    icon: BookOpen,
    title: "First-Time Buyer Guide",
    description: "A comprehensive guide to help first-time homebuyers navigate the process with confidence.",
    color: "bg-blue-500",
    link: "/first-time-buyers"
  },
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    description: "Estimate your monthly mortgage payments based on home price, down payment, and interest rate.",
    color: "bg-green-500",
    link: "#"
  },
  {
    icon: FileText,
    title: "Pre-Approval Checklist",
    description: "Essential documents and steps to prepare for your mortgage pre-approval.",
    color: "bg-purple-500",
    link: "#"
  },
  {
    icon: Home,
    title: "Home Inspection Guide",
    description: "What to look for and questions to ask during your home inspection.",
    color: "bg-red-500",
    link: "#"
  },
  {
    icon: BarChart3,
    title: "Market Reports",
    description: "Stay updated with the latest real estate market trends and statistics in Boston.",
    color: "bg-amber-500",
    link: "#"
  },
  {
    icon: Eye,
    title: "Neighborhood Profiles",
    description: "Detailed information about Boston's diverse neighborhoods to help you find the perfect fit.",
    color: "bg-indigo-500",
    link: "/neighborhoods"
  },
];

const BuyerResources = () => {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a1a1a] mb-4">BUYER RESOURCES</h2>
          <p className="text-gray-600">
            Access these helpful resources to make informed decisions throughout your home buying journey.
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
                <div className={`w-12 h-12 ${resource.color} text-white rounded-lg flex items-center justify-center mb-4`}>
                  <resource.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">{resource.title}</h3>
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

export default BuyerResources;
