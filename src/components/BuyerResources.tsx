
import React from 'react';
import { BookOpen, Calculator, FileText, Home, BarChart3, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BuyerResources = () => {
  const { t } = useTranslation();

  const resources = [
    {
      icon: BookOpen,
      title: t('buyer_guide.resources.first_time_guide.title'),
      description: t('buyer_guide.resources.first_time_guide.description'),
      link: "/first-time-buyers"
    },
    {
      icon: Calculator,
      title: t('buyer_guide.resources.mortgage_calculator.title'),
      description: t('buyer_guide.resources.mortgage_calculator.description'),
      link: "/calculator"
    },
    {
      icon: FileText,
      title: t('buyer_guide.resources.pre_approval_checklist.title'),
      description: t('buyer_guide.resources.pre_approval_checklist.description'),
      link: "/blog/pre-approval-checklist"
    },
    {
      icon: Home,
      title: t('buyer_guide.resources.home_inspection_guide.title'),
      description: t('buyer_guide.resources.home_inspection_guide.description'),
      link: "/blog/home-inspection-guide"
    },
    {
      icon: BarChart3,
      title: t('buyer_guide.resources.market_reports.title'),
      description: t('buyer_guide.resources.market_reports.description'),
      link: "/blog/winning-a-bidding-war-greater-boston"
    },
    {
      icon: Eye,
      title: t('buyer_guide.resources.neighborhood_profiles.title'),
      description: t('buyer_guide.resources.neighborhood_profiles.description'),
      link: "/neighborhoods"
    },
  ];
  return (
    <div className="py-12">
      {/* No container of its own: this renders inside the page's
          container, and nesting one in the other doubled the gutter. */}
      <div>
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-ink mb-4">{t('buyer_guide.resources_title')}</h2>
          <p className="text-gray-600">
            {t('buyer_guide.resources_subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 enter" style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}>
              <div className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-ink-deep text-champagne">
                  <resource.icon size={24} />
                </div>
                {resource.link === "/calculator" ? (
                  <Link to={resource.link}>
                    <h3 className="text-xl font-semibold mb-2 text-ink hover:text-gray-600 transition-colors cursor-pointer">{resource.title}</h3>
                  </Link>
                ) : (
                  <h3 className="text-xl font-semibold mb-2 text-ink">{resource.title}</h3>
                )}
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <Link 
                  to={resource.link} 
                  className="inline-flex items-center text-ink font-medium group relative"
                >
                  <span className="relative">
                    {t('buyer_guide.view_resource')}
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

export default BuyerResources;
