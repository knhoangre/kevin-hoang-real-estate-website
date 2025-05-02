import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1487958449943-2429e8be8625')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-[#1a1a1a]/70" />
      </div>

      <div className="container relative z-10 px-4 py-32 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          ELEVATING BOSTON'S REAL ESTATE EXPERIENCE
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto">
          YOUR REAL ESTATE PARTNER FOR BUYING, SELLING, AND INVESTING IN BOSTON'S MOST DESIRABLE PROPERTIES THROUGH MARKET EXPERTISE AND INNOVATIVE STRATEGIES.
        </p>
        <Link to="/contact" className="bg-white text-[#1a1a1a] px-8 py-3 rounded-md inline-flex items-center group hover:bg-[#1a1a1a] hover:text-white transition-all duration-300">
          <span className="uppercase">BOOK A FREE CONSULTATION</span>
          <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
};

export default Hero;
