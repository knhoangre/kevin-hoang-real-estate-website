
import React from 'react';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Contact = () => {
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
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] mb-4">GET IN TOUCH</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Let's discuss your real estate goals. Whether you're looking to buy, sell, or just have questions about the Boston market, I'm here to help.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-6 text-[#1a1a1a]">Contact Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="bg-green-50 p-3 rounded-full mr-4">
                        <Mail className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1a1a1a]">Email</h3>
                        <p className="text-gray-600">kevin@kevinhoang.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-green-50 p-3 rounded-full mr-4">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1a1a1a]">Phone</h3>
                        <p className="text-gray-600">(617) 555-1234</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-green-50 p-3 rounded-full mr-4">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1a1a1a]">Office</h3>
                        <p className="text-gray-600">123 Beacon Street, Boston, MA 02116</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-green-50 p-3 rounded-full mr-4">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1a1a1a]">Hours</h3>
                        <p className="text-gray-600">Monday - Friday: 9am - 6pm</p>
                        <p className="text-gray-600">Weekends: By appointment</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-6 text-[#1a1a1a]">Send a Message</h2>
                  
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input type="text" id="first-name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" />
                      </div>
                      
                      <div>
                        <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input type="text" id="last-name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" id="email" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" id="phone" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea id="message" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"></textarea>
                    </div>
                    
                    <button type="submit" className="w-full bg-[#1a1a1a] text-white py-3 px-6 rounded-md hover:bg-black transition-colors font-medium">
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
