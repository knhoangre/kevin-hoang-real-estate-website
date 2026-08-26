import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  return (
    <section id="about" className="py-24 bg-white">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-[#1a1a1a]">{t('about.title')}</h2>
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
            <div className="aspect-square bg-[#1a1a1a]/10 rounded-2xl overflow-hidden">
              {/* WebP first (15KB) with the original JPEG (231KB) as the
                  fallback. Below the fold, so it loads lazily. */}
              <picture>
                <source srcSet="/kevin_hoang.webp" type="image/webp" />
                <img
                  src="/kevin_hoang.jpg"
                  alt="Kevin Hoang, real estate agent, in a navy suit"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top scale-125"
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
