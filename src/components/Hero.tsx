
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
        <div className="absolute inset-0 bg-realDark/70" />
      </div>
      
      <div className="container relative z-10 px-4 py-32 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Elevating Boston's Real Estate Experience
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Helping Boston homeowners sell fast with confidence through personalized service and market expertise.
        </p>
        <Button size="lg" className="bg-realPurple hover:bg-white hover:text-realDark">
          Book a Free Consultation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export default Hero;
