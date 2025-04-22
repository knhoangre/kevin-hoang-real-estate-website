
import { Element } from "react-scroll";
import Navbar from "@/components/Navbar";
import SellerRoadmap from "@/components/SellerRoadmap";
import SellerResources from "@/components/SellerResources";

const Seller = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-[#1a1a1a] mb-8">SELLER'S GUIDE</h1>
        <Element name="roadmap">
          <SellerRoadmap />
        </Element>
        <Element name="resources">
          <SellerResources />
        </Element>
      </div>
    </div>
  );
};

export default Seller;
