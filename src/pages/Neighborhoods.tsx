import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { neighborhoods } from "../data/neighborhoodData";
import { useTranslation } from "react-i18next";

const Neighborhoods = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4"
            >
              {t('neighborhoods.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-xl text-gray-600 mb-12 max-w-3xl"
            >
              {t('neighborhoods.subtitle')}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {neighborhoods.map((neighborhood) => (
              <div
                key={neighborhood.name}
                className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={neighborhood.image}
                    alt={`${neighborhood.name} neighborhood`}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 bg-white">
                  <h3 className="text-2xl font-semibold uppercase">{neighborhood.name}</h3>
                </div>
              </div>
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
