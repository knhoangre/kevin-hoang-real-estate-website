import { useEffect } from "react";
import { Link } from "react-router-dom";
import { neighborhoods } from "../data/neighborhoodData";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import { itemList } from "@/lib/schema";

const Neighborhoods = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Towns We Serve in MetroWest & Greater Boston"
        description="Area guides for the towns Kevin Hoang serves across MetroWest and Greater Boston — neighborhoods, schools, transit, and what each local housing market is like."
        keywords="Greater Boston neighborhoods, MetroWest towns, Needham Newton Wellesley real estate, best towns near Boston, Massachusetts town guides"
        jsonLd={itemList(
        neighborhoods.map((n) => ({
        name: `${n.name}, MA`,
        url: `/neighborhoods/${n.slug}`,
        }))
        )}
      />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <div className="enter-down">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4 enter-down" style={{ '--enter-delay': '0.2s' } as React.CSSProperties}>
              {t('neighborhoods.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl enter-down" style={{ '--enter-delay': '0.4s' } as React.CSSProperties}>
              {t('neighborhoods.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/*
              These are real <Link>s, not a div with an onClick. As click
              handlers they rendered no href at all, so no crawler could reach
              any of the fourteen town guides from their own hub page and they
              were reachable only via the sitemap — and they could not be
              tabbed to either.

              The image alt is empty on purpose: these are stock photographs,
              not photographs of these towns, so an alt of "Newton neighborhood"
              would assert something the picture does not support. The heading
              inside the link is what names the destination.
            */}
            {neighborhoods.map((neighborhood) => (
              <Link
                key={neighborhood.name}
                to={`/neighborhoods/${neighborhood.slug}`}
                className="block overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={neighborhood.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 bg-white">
                  <h2 className="text-2xl font-semibold uppercase">{neighborhood.name}</h2>
                </div>
              </Link>
            ))}

            <div className="overflow-hidden rounded-lg shadow-md">
              <div className="p-6 bg-gray-50 h-full flex items-center justify-center">
                <h3 className="text-2xl font-semibold text-gray-500 uppercase">{t('neighborhoods.and_many_more')}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Neighborhoods;
