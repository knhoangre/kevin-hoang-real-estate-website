
import React from 'react';
import Navbar from '@/components/Navbar';
import { ArrowRight, CheckCircle, Home, DollarSign, KeyRound, FileText, HelpCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FirstTimeBuyers = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] mb-4">FIRST-TIME HOME BUYER GUIDE</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Buying your first home is an exciting milestone. This comprehensive guide will walk you through every step of the process.
            </p>
          </motion.div>

          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-xl overflow-hidden mb-16"
          >
            <div 
              className="h-[300px] md:h-[400px] w-full bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <div className="p-8 text-white max-w-2xl">
                  <h2 className="text-3xl font-bold mb-3">Begin Your Homeownership Journey</h2>
                  <p className="text-white/90">Understanding the process is the first step toward making confident decisions in your home buying journey.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step by Step Guide */}
          <div className="mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-[#1a1a1a] text-center mb-12"
            >
              YOUR STEP-BY-STEP GUIDE
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: DollarSign,
                  title: "Check Your Finances",
                  description: "Assess your credit score, calculate your debt-to-income ratio, and determine how much you can afford to spend on a home.",
                  delay: 0
                },
                {
                  icon: FileText,
                  title: "Get Pre-Approved",
                  description: "A mortgage pre-approval gives you a clear budget and shows sellers you're serious about buying.",
                  delay: 0.1
                },
                {
                  icon: Home,
                  title: "Find Your Home",
                  description: "Work with a real estate agent to view homes that match your criteria and budget.",
                  delay: 0.2
                },
                {
                  icon: KeyRound,
                  title: "Make an Offer",
                  description: "Once you find the right home, submit a competitive offer based on market research and your agent's advice.",
                  delay: 0.3
                },
                {
                  icon: HelpCircle,
                  title: "Home Inspection",
                  description: "Schedule a professional inspection to identify any potential issues or needed repairs.",
                  delay: 0.4
                },
                {
                  icon: CheckCircle,
                  title: "Closing",
                  description: "Sign the final paperwork, pay closing costs, and receive the keys to your new home.",
                  delay: 0.5
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: step.delay }}
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start">
                    <div className="bg-green-50 p-3 rounded-full mr-4">
                      <step.icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Common Mistakes Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-[#1a1a1a] text-center mb-12">AVOID THESE COMMON MISTAKES</h2>
            
            <div className="bg-red-50 p-8 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Skipping the pre-approval process",
                  "Not budgeting for closing costs and moving expenses",
                  "Making major purchases before closing",
                  "Skipping the home inspection",
                  "Not researching the neighborhood",
                  "Going with the first mortgage lender you find"
                ].map((mistake, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-gray-800">{mistake}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Financial Tips Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-[#1a1a1a] text-center mb-12">FINANCIAL CONSIDERATIONS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Down Payment Options",
                  description: "Learn about different down payment options, from conventional 20% down to low down payment programs for first-time buyers.",
                  color: "bg-blue-50",
                  textColor: "text-blue-800"
                },
                {
                  title: "Mortgage Types",
                  description: "Understand the differences between fixed-rate, adjustable-rate, FHA, VA, and USDA loans to find the best fit.",
                  color: "bg-green-50",
                  textColor: "text-green-800"
                },
                {
                  title: "First-Time Buyer Programs",
                  description: "Explore special programs, grants, and tax benefits available specifically for first-time home buyers.",
                  color: "bg-purple-50",
                  textColor: "text-purple-800"
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`${item.color} p-6 rounded-xl shadow-sm`}
                >
                  <h3 className={`text-xl font-semibold mb-3 ${item.textColor}`}>{item.title}</h3>
                  <p className="text-gray-700">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-[#1a1a1a] mb-6">READY TO START YOUR HOME BUYING JOURNEY?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              I'm here to guide you through every step of the process and help you find your perfect first home.
            </p>
            <Link 
              to="/contact" 
              className="bg-[#1a1a1a] text-white px-8 py-3 rounded-md inline-flex items-center group hover:bg-black transition-colors"
            >
              <span>SCHEDULE A CONSULTATION</span>
              <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeBuyers;
