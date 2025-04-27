import { Element } from "react-scroll";
import Navbar from "@/components/Navbar";
import SellerRoadmap from "@/components/SellerRoadmap";
import SellerResources from "@/components/SellerResources";

const Seller = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-12">SELLER'S GUIDE</h1>
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
