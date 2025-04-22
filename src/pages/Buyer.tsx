
import { Element } from "react-scroll";
import Navbar from "@/components/Navbar";
import BuyerRoadmap from "@/components/BuyerRoadmap";
import BuyerResources from "@/components/BuyerResources";

const Buyer = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-[#1a1a1a] mb-8">BUYER'S GUIDE</h1>
        <Element name="roadmap">
          <BuyerRoadmap />
        </Element>
        <Element name="resources">
          <BuyerResources />
        </Element>
      </div>
    </div>
  );
};

export default Buyer;
