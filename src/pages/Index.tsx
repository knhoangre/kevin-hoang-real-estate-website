
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import InteractiveMap from "@/components/InteractiveMap";
import PropertyComparison from "@/components/PropertyComparison";
import RealEstateCalculators from "@/components/RealEstateCalculators";
import { Element } from "react-scroll";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Element name="home">
        <Hero />
      </Element>
      <Element name="about">
        <About />
      </Element>
      <Stats />
      <InteractiveMap />
      <PropertyComparison />
      <RealEstateCalculators />
      <Element name="faq">
        <FAQ />
      </Element>
      <Element name="contact">
        <Contact />
      </Element>
    </div>
  );
};

export default Index;
