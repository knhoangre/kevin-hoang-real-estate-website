import { Element } from "react-scroll";
import Navbar from "@/components/Navbar";
import BuyerRoadmap from "@/components/BuyerRoadmap";
import BuyerResources from "@/components/BuyerResources";
import { motion } from "framer-motion";

const Buyer = () => {
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
              BUYER'S GUIDE
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-xl text-gray-600 mb-12 max-w-3xl"
            >
              Your comprehensive resource for navigating the home buying process in Greater Boston, from pre-approval to closing.
            </motion.p>
          </motion.div>
          <Element name="roadmap">
            <BuyerRoadmap />
          </Element>
          <Element name="resources">
            <BuyerResources />
          </Element>
        </div>
      </div>
    </div>
  );
};

export default Buyer;
