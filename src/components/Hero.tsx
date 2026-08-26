import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SITE } from "@/lib/siteConfig";

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          // Sized and compressed on Unsplash's side. A bare
          // images.unsplash.com/photo-… URL serves the multi-megabyte
          // original, and this is the homepage's LCP element — it was the
          // single most expensive request on the site. The matching
          // <link rel="preload" fetchpriority="high"> is in index.html.
          backgroundImage:
            "url('https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1920&q=70')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-[#1a1a1a]/70" />
      </div>

      <div className="container relative z-10 px-4 py-32 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {t('hero.title')}
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto">
          {t('hero.subtitle')}
        </p>
        <a 
          href={SITE.appointmentUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white text-[#1a1a1a] px-8 py-3 rounded-md inline-flex items-center group hover:bg-[#1a1a1a] hover:text-white transition-all duration-300"
        >
          <span className="uppercase">{t('hero.cta')}</span>
          <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </section>
  );
};

export default Hero;
