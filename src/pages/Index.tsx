import React from "react";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Contact from "@/components/Contact";
import Reviews from "@/components/Reviews";
import { Element } from "react-scroll";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

  // Reset scroll position when navigating to home page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Element name="home">
        <Hero />
      </Element>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <Element name="about">
          <About />
        </Element>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <Stats />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <Reviews />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <Element name="contact">
          <Contact />
        </Element>
      </motion.div>
    </div>
  );
};

export default Index;
