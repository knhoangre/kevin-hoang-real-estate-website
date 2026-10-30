import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SITE, telHref } from "@/lib/siteConfig";
import { HOME_HERO_IMAGE } from "@/lib/images";
import HeroSkyline from "@/components/HeroSkyline";

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen relative flex flex-col overflow-hidden">
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
        {/* Night behind the skyline: without it the photograph's own lines
            show through the drawing's sky and compete with it. */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-deep via-ink-deep/85 to-transparent" />
      </div>

      {/* The copy takes whatever height the skyline leaves and centres in it;
          the skyline is in the flow below, so the two can never overlap.
          From sm up the padding is weighted to the top, which sets the copy
          40px lower than true centre (Kevin, 2026-10-29) without making the
          hero any taller. Phones keep the even split: they have no room. */}
      <div className="container relative z-10 flex flex-1 items-center justify-center px-4 pt-28 pb-6 sm:pt-44 sm:pb-2 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-champagne" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-champagne">
              {SITE.brokerage}
            </p>
            <span className="h-px w-10 bg-champagne" aria-hidden />
          </div>
          {/* Inter, not the Playfair `font-display` face the landing heroes use.
              The line is set in full caps, and Playfair is a high-contrast
              transitional serif — at display size its hairlines and its ball
              terminals are doing a great deal of work over a photograph, where
              Inter's even weight simply reads. Both faces are already loaded
              from the same stylesheet, so this costs no extra request, and it
              takes the LCP element off the serif entirely.

              `tracking-wider`, and POSITIVE tracking is the whole point. Caps
              are all one height with flat sidebearings, so a line of them set at
              a text face's default fit reads as a wall — the negative
              `tracking-tight` that was here is tuned for mixed-case display
              type and is exactly wrong for this. Less than the 0.1em the section
              headings take, because tracking should come down as size goes up
              and this is half again their size. Leading goes up with it:
              letterspaced caps need the extra air between lines or the block
              closes back up vertically.

              52px on a desktop, not 7xl (Kevin, 2026-10-29: the copy sat up
              against the navbar once the skyline took the bottom of the hero).
              It sets the line in two — "YOUR TRUSTED REAL ESTATE / PARTNER IN
              GREATER BOSTON" — with 40px to spare at max-w-4xl; 56px goes back
              to three. */}
          <h1 className="font-sans text-3xl md:text-5xl lg:text-[3.25rem] font-semibold leading-[1.12] tracking-wider mb-5">
            {t('hero.title')}
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-3xl mx-auto leading-relaxed text-balance text-gray-300">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={SITE.appointmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold tracking-wide text-ink-deep transition-colors hover:bg-champagne btn-pill btn-pill-glint"
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

      <HeroSkyline className="relative z-0 block h-[clamp(150px,28vh,300px)] w-full shrink-0" />
    </section>
  );
};

export default Hero;
