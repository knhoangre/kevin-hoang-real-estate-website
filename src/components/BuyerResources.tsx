
import React from 'react';
import { motion } from 'framer-motion';
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
      color: "bg-blue-500",
      link: "/first-time-buyers"
    },
    {
      icon: Calculator,
      title: t('buyer_guide.resources.mortgage_calculator.title'),
      description: t('buyer_guide.resources.mortgage_calculator.description'),
      color: "bg-green-500",
      link: "/#real-estate-calculators"
    },
    {
      icon: FileText,
      title: t('buyer_guide.resources.pre_approval_checklist.title'),
      description: t('buyer_guide.resources.pre_approval_checklist.description'),
      color: "bg-purple-500",
      link: "/blog/pre-approval-checklist"
    },
    {
      icon: Home,
      title: t('buyer_guide.resources.home_inspection_guide.title'),
      description: t('buyer_guide.resources.home_inspection_guide.description'),
      color: "bg-red-500",
      link: "/blog/home-inspection-guide"
    },
    {
      icon: BarChart3,
      title: t('buyer_guide.resources.market_reports.title'),
      description: t('buyer_guide.resources.market_reports.description'),
      color: "bg-amber-500",
      link: "/blog/market-reports"
    },
    {
      icon: Eye,
      title: t('buyer_guide.resources.neighborhood_profiles.title'),
      description: t('buyer_guide.resources.neighborhood_profiles.description'),
      color: "bg-indigo-500",
      link: "/neighborhoods"
    },
  ];
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a1a1a] mb-4">{t('buyer_guide.resources_title')}</h2>
          <p className="text-gray-600">
            {t('buyer_guide.resources_subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className={`w-12 h-12 ${resource.color} text-white rounded-lg flex items-center justify-center mb-4`}>
                  <resource.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">{resource.title}</h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <Link 
                  to={resource.link} 
                  className="inline-flex items-center text-[#1a1a1a] font-medium group relative"
                >
                  <span className="relative">
                    {t('buyer_guide.view_resource')}
                    <span className="absolute -bottom-[2px] left-0 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300" />
                  </span>
                  <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerResources;
