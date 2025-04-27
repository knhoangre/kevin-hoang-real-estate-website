import { Element } from "react-scroll";
import Navbar from "@/components/Navbar";
import BuyerRoadmap from "@/components/BuyerRoadmap";
import BuyerResources from "@/components/BuyerResources";

const Buyer = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-12">BUYER'S GUIDE</h1>
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
