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
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">SELLER'S GUIDE</h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl">
            Everything you need to know about selling your home in Greater Boston, from preparation to maximizing your property's value.
          </p>
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
