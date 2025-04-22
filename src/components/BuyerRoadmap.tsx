
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    title: "Get Pre-Approved",
    description: "Secure a mortgage pre-approval to understand your budget and show sellers you're serious.",
  },
  {
    title: "House Hunting",
    description: "Search properties that match your criteria and schedule viewings.",
  },
  {
    title: "Make an Offer",
    description: "When you find the right home, submit a competitive offer.",
  },
  {
    title: "Home Inspection",
    description: "Get a professional inspection to identify any potential issues.",
  },
  {
    title: "Final Approval",
    description: "Work with your lender to finalize the mortgage approval.",
  },
  {
    title: "Closing",
    description: "Sign the final paperwork and get your keys!",
  },
];

const BuyerRoadmap = () => {
  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-12">YOUR BUYING ROADMAP</h2>
      
      <div className="relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-4 top-3 bottom-0 w-0.5 bg-green-500 hidden md:block"></div>
        
        <div className="space-y-16">
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              className="flex flex-col md:flex-row gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex-shrink-0 relative z-10">
                <motion.div 
                  className="bg-white p-2 rounded-full" 
                  initial={{ scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20, 
                    delay: index * 0.1 + 0.2 
                  }}
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
                {index < steps.length - 1 && (
                  <motion.div 
                    className="absolute w-0.5 bg-green-500 left-1/2 transform -translate-x-1/2 top-12 h-16 md:hidden"
                    initial={{ height: 0 }}
                    whileInView={{ height: 50 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                  ></motion.div>
                )}
              </div>
              
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-lg flex-1 z-10 border border-gray-100 hover:shadow-xl transition-shadow"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                
                {/* Arrow pointing to next step */}
                {index < steps.length - 1 && (
                  <motion.div 
                    className="hidden md:block absolute right-0 top-1/2 transform translate-x-3 -translate-y-1/2"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
                  >
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerRoadmap;
