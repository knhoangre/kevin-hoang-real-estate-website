
import React from "react";
import { Home, TrendingUp, FileCheck } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SellerResources = () => {
  const { t } = useTranslation();

  const resources = [
    {
      icon: Home,
      title: t('seller_guide.resources.home_preparation.title'),
      description: t('seller_guide.resources.home_preparation.description'),
      link: "/blog/home-preparation-guide",
    },
    {
      icon: TrendingUp,
      title: t('seller_guide.resources.pricing_strategy.title'),
      description: t('seller_guide.resources.pricing_strategy.description'),
      link: "/blog/pricing-strategy-guide",
    },
    {
      icon: FileCheck,
      title: t('seller_guide.resources.seller_documentation.title'),
      description: t('seller_guide.resources.seller_documentation.description'),
      link: "/blog/massachusetts-seller-closing-requirements",
    },
  ];
  return (
    <div className="py-12">
      {/* No container of its own: this renders inside the page's
          container, and nesting one in the other doubled the gutter. */}
      <div>
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-ink mb-4">{t('seller_guide.resources_title')}</h2>
          <p className="text-gray-600">
            {t('seller_guide.resources_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 enter" style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}>
              <div className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-ink-deep text-champagne">
                  <resource.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-ink">
                  {resource.title}
                </h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <Link
                  to={resource.link}
                  className="inline-flex items-center text-ink font-medium group relative"
                >
                  <span className="relative">
                    {t('seller_guide.view_resource')}
                    <span className="absolute -bottom-[2px] left-0 w-0 h-0.5 bg-ink group-hover:w-full transition-all duration-300" />
                  </span>
                  <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerResources;
