import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SITE, telHref } from "@/lib/siteConfig";
import { HOME_HERO_IMAGE } from "@/lib/images";
import HeroSkyline from "@/components/HeroSkyline";
import { pill } from '@/lib/pill';

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
            {/* The rules go on a phone, where the name and the brokerage need
                the whole width to stay on one line. */}
            <span className="hidden h-px w-10 bg-champagne sm:block" aria-hidden />
            {/* The name as well as the brokerage (2026-11-06): the h1 is the
                place and the service, so the person searched for by name has to
                be in the hero too. The brokerage stays — 254 CMR 3.09. */}
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne sm:tracking-[0.3em]">
              {SITE.agentName} · {SITE.brokerage}
            </p>
            <span className="hidden h-px w-10 bg-champagne sm:block" aria-hidden />
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
              It sets the line in two at max-w-4xl.

              The words are the page title's, "NEWTON & GREATER BOSTON REAL
              ESTATE AGENT", since 2026-11-06. "YOUR TRUSTED REAL ESTATE PARTNER
              IN GREATER BOSTON" named no town and no service anyone searches
              for; the subtitle carries what sets Kevin apart. */}
          <h1 className="font-sans text-3xl md:text-5xl lg:text-[3.25rem] font-semibold leading-[1.12] tracking-wider mb-5">
            {t('hero.title')}
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-3xl mx-auto leading-relaxed text-balance text-gray-300">
            {/* Four towns are named; the count of the rest follows areaServed. */}
            {t('hero.subtitle', { more: SITE.areaServed.length - 4 })}
          </p>
          {/* Buying and selling first: the homepage body linked to neither guide,
              and they are the two questions a visitor arrives with. Selling goes
              to the valuation request, not the seller's guide, because that is
              the step a seller takes. */}
          {/* One line of four on a laptop, two pairs on a phone. Two rows of
              two on a laptop pushed the skyline below the fold at 1280x720, and
              four stacked on a phone did the same there. On a phone the pairs
              share the width, so the arrows go and the padding comes in. */}
          <div className="flex flex-col items-center gap-3 lg:flex-row lg:justify-center">
            <div className="grid w-full max-w-sm grid-cols-2 gap-3 sm:flex sm:w-auto sm:max-w-none sm:justify-center">
              <Link to="/buyer" className={pill('white', 'lg', 'group btn-pill-glint justify-center px-3 sm:px-7')}>
                <span className="uppercase">{t('hero.buy')}</span>
                <ArrowRight className="hidden h-4 w-4 transform transition-transform group-hover:translate-x-1 sm:block" aria-hidden />
              </Link>
              <Link to="/home-valuation#request" className={pill('white', 'lg', 'group justify-center px-3 sm:px-7')}>
                <span className="uppercase">{t('hero.sell')}</span>
                <ArrowRight className="hidden h-4 w-4 transform transition-transform group-hover:translate-x-1 sm:block" aria-hidden />
              </Link>
            </div>
            <div className="grid w-full max-w-sm grid-cols-2 gap-3 sm:flex sm:w-auto sm:max-w-none sm:justify-center">
              <a
                href={SITE.appointmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={pill('gold', 'lg', 'group justify-center px-3 sm:px-7')}
              >
                {t('hero.cta')}
              </a>
              <a href={telHref} className={pill('ghost', 'lg', 'group justify-center px-3 sm:px-7')}>
                <Phone className="h-4 w-4" aria-hidden />
                {SITE.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      <HeroSkyline className="relative z-0 block h-[clamp(150px,28vh,300px)] w-full shrink-0" />
    </section>
  );
};

export default Hero;
