import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  return (
    <section id="about" className="py-24 bg-white">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {/* Heading block matching the other homepage sections: every one of
                them pairs a title with a standfirst line. `about.subtitle` has
                existed in both locale files since the section was written and
                was simply never rendered, so this was the only section on the
                page that dropped the reader straight from a heading into body
                copy. */}
            <div className="space-y-3">
              <span className="mb-5 block h-px w-10 bg-champagne" aria-hidden />
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink">
                {t('about.title')}
              </h2>
              <p className="text-lg font-medium text-champagne-ink">
                {t('about.subtitle')}
              </p>
            </div>
            <p className="text-lg text-gray-600">
              {t('about.paragraph1')}
            </p>
            <p className="text-lg text-gray-600">
              {t('about.paragraph2')}
            </p>
            <p className="text-lg text-gray-600">
              {t('about.paragraph3')}
            </p>
          </div>

          <div className="relative">
            <div className="aspect-square bg-ink/10 rounded-2xl overflow-hidden">
              {/* WebP first (15KB) with the original JPEG (231KB) as the
                  fallback. Below the fold, so it loads lazily.

                  The crop: the source is a 750x1125 full-length portrait whose
                  face sits at about 19% of the frame height. `object-cover` in a
                  square box can only ever show the top two thirds of that, which
                  still leaves the head near the top edge — so it has to be zoomed
                  to bring the face down to the middle.

                  `origin-top` is the part that was wrong before. The old
                  `scale-125` zoomed about the element's CENTRE while
                  `object-top` pinned the image to the TOP, so the zoom pushed
                  the crown of his head up past the edge and clipped it.
                  Anchoring the scale to the same edge the image is anchored to
                  makes the two agree: at 1.5x the visible window is the top
                  ~500px of the source, which puts the face at ~44% of the box
                  and leaves real headroom above it. */}
              <picture>
                <source srcSet="/kevin_hoang.webp" type="image/webp" />
                <img
                  src="/kevin_hoang.jpg"
                  alt="Kevin Hoang, licensed Massachusetts real estate broker, in a navy suit"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full origin-top scale-150 object-cover object-top"
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
