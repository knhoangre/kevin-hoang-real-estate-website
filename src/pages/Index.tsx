import React from "react";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Contact from "@/components/Contact";
import Reviews from "@/components/Reviews";
import { Element } from "react-scroll";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Seo from "@/components/Seo";
import { realEstateAgent, webSite, person } from "@/lib/schema";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle OAuth callback if code is in URL (catches redirects to root)
  // Note: The return path is already stored in sessionStorage before OAuth
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Redirect to auth callback handler (it will read return path from sessionStorage)
      navigate(`/auth/callback?code=${code}`, { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-white">
      {/*
        The homepage is the only page that declares the business itself. Every
        other page references those nodes by @id instead of restating them.
        person() must be emitted HERE too: realEstateAgent().employee points at
        the Person @id, and a reference only resolves if the entity it names
        appears on the same page.
      */}
      <Seo
        title="Needham & Greater Boston Real Estate Agent | Kevin Hoang"
        description="Kevin Hoang is a licensed Massachusetts real estate broker in Needham with Keller Williams Realty, helping buyers and sellers across MetroWest and Greater Boston in English and Vietnamese."
        keywords="Needham MA real estate agent, Greater Boston realtor, MetroWest homes for sale, Kevin Hoang real estate, Vietnamese speaking realtor Boston"
        jsonLd={[realEstateAgent(), webSite(), person()]}
      />
      <Element name="home">
        <Hero />
      </Element>
      <div className="enter-fade">
        <Element name="about">
          <About />
        </Element>
      </div>
      <div className="enter">
        <Stats />
      </div>
      <div className="enter">
        <Reviews />
      </div>
      <div className="enter">
        <Element name="contact">
          <Contact />
        </Element>
      </div>
    </div>
  );
};

export default Index;
