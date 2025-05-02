import { Element } from "react-scroll";
import Navbar from "@/components/Navbar";
import SellerRoadmap from "@/components/SellerRoadmap";
import SellerResources from "@/components/SellerResources";
import { motion } from "framer-motion";

const Seller = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4"
            >
              SELLER'S GUIDE
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-xl text-gray-600 mb-12 max-w-3xl"
            >
              Everything you need to know about selling your home in Greater Boston, from preparation to maximizing your property's value.
            </motion.p>
          </motion.div>
          <Element name="roadmap">
            <SellerRoadmap />
          </Element>
          <Element name="resources">
            <SellerResources />
          </Element>
        </div>
      </div>
    </div>
  );
};

export default Seller;
