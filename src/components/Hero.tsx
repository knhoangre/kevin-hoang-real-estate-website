import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SITE, telHref } from "@/lib/siteConfig";
import { HOME_HERO_IMAGE } from "@/lib/images";

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
          // <link rel="preload" fetchpriority="high"> is emitted by <Seo> in
          // Index.tsx, from this same constant, and ONLY on the homepage.
          backgroundImage: `url('${HOME_HERO_IMAGE}')`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        {/* The same scrim the landing heroes use, so the front door and the
            interior pages are lit the same way. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-deep via-ink-deep/80 to-ink-deep/50" />
      </div>

      <div className="container relative z-10 px-4 py-32 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-7 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-champagne" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-champagne">
              {SITE.brokerage}
            </p>
            <span className="h-px w-10 bg-champagne" aria-hidden />
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed text-gray-300">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={SITE.appointmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold tracking-wide text-ink-deep transition-colors hover:bg-champagne btn-pill"
            >
              <span className="uppercase">{t('hero.cta')}</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={telHref}
              className="group inline-flex items-center gap-2 rounded-full border border-champagne/60 px-7 py-3.5 text-sm font-semibold tracking-wide text-champagne transition-colors hover:bg-champagne hover:text-ink-deep btn-pill"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {SITE.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
