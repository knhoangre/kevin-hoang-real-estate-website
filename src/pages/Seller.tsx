import { Element } from "react-scroll";
import Navbar from "@/components/Navbar";
import SellerRoadmap from "@/components/SellerRoadmap";
import SellerResources from "@/components/SellerResources";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const Seller = () => {
  const { t } = useTranslation();

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
{t('seller_guide.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-xl text-gray-600 mb-12 max-w-3xl"
            >
{t('seller_guide.subtitle')}
            </motion.p>
          </motion.div>
          <Element name="roadmap">
            <SellerRoadmap />
          </Element>

          <div className="py-8">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>{t('seller_guide.important_notice')}</strong> {t('seller_guide.important_notice_text')}
              </p>
            </div>
          </div>

          <Element name="resources">
            <SellerResources />
          </Element>
        </div>
      </div>
    </div>
  );
};

export default Seller;
