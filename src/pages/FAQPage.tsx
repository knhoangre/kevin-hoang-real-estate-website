import Navbar from "@/components/Navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const FAQPage = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("general");
  const generalRef = useRef<HTMLDivElement>(null);
  const sellerRef = useRef<HTMLDivElement>(null);
  const buyerRef = useRef<HTMLDivElement>(null);

  const generalFaqItems = [
    {
      question: t('faq.general_items.item1.question'),
      answer: t('faq.general_items.item1.answer')
    },
    {
      question: t('faq.general_items.item2.question'),
      answer: t('faq.general_items.item2.answer')
    },
    {
      question: t('faq.general_items.item3.question'),
      answer: t('faq.general_items.item3.answer')
    },
    {
      question: t('faq.general_items.item4.question'),
      answer: t('faq.general_items.item4.answer')
    },
    {
      question: t('faq.general_items.item5.question'),
      answer: t('faq.general_items.item5.answer')
    },
    {
      question: t('faq.general_items.item6.question'),
      answer: t('faq.general_items.item6.answer')
    },
    {
      question: t('faq.general_items.item7.question'),
      answer: t('faq.general_items.item7.answer')
    },
    {
      question: t('faq.general_items.item8.question'),
      answer: t('faq.general_items.item8.answer')
    },
    {
      question: t('faq.general_items.item9.question'),
      answer: t('faq.general_items.item9.answer')
    },
    {
      question: t('faq.general_items.item10.question'),
      answer: t('faq.general_items.item10.answer')
    },
    {
      question: t('faq.general_items.item11.question'),
      answer: t('faq.general_items.item11.answer')
    },
    {
      question: t('faq.general_items.item12.question'),
      answer: t('faq.general_items.item12.answer')
    }
  ];

  const sellerFaqItems = [
    {
      question: t('faq.seller_items.item1.question'),
      answer: t('faq.seller_items.item1.answer')
    },
    {
      question: t('faq.seller_items.item2.question'),
      answer: t('faq.seller_items.item2.answer')
    },
    {
      question: t('faq.seller_items.item3.question'),
      answer: t('faq.seller_items.item3.answer')
    },
    {
      question: t('faq.seller_items.item4.question'),
      answer: t('faq.seller_items.item4.answer')
    },
    {
      question: t('faq.seller_items.item5.question'),
      answer: t('faq.seller_items.item5.answer')
    },
    {
      question: t('faq.seller_items.item6.question'),
      answer: t('faq.seller_items.item6.answer')
    },
    {
      question: t('faq.seller_items.item7.question'),
      answer: t('faq.seller_items.item7.answer')
    },
    {
      question: t('faq.seller_items.item8.question'),
      answer: t('faq.seller_items.item8.answer')
    },
    {
      question: t('faq.seller_items.item9.question'),
      answer: t('faq.seller_items.item9.answer')
    },
    {
      question: t('faq.seller_items.item10.question'),
      answer: t('faq.seller_items.item10.answer')
    },
    {
      question: t('faq.seller_items.item11.question'),
      answer: t('faq.seller_items.item11.answer')
    },
    {
      question: t('faq.seller_items.item12.question'),
      answer: t('faq.seller_items.item12.answer')
    }
  ];

  const buyerFaqItems = [
    {
      question: t('faq.buyer_items.item1.question'),
      answer: t('faq.buyer_items.item1.answer')
    },
    {
      question: t('faq.buyer_items.item2.question'),
      answer: t('faq.buyer_items.item2.answer')
    },
    {
      question: t('faq.buyer_items.item3.question'),
      answer: t('faq.buyer_items.item3.answer')
    },
    {
      question: t('faq.buyer_items.item4.question'),
      answer: t('faq.buyer_items.item4.answer')
    },
    {
      question: t('faq.buyer_items.item5.question'),
      answer: t('faq.buyer_items.item5.answer')
    },
    {
      question: t('faq.buyer_items.item6.question'),
      answer: t('faq.buyer_items.item6.answer')
    },
    {
      question: t('faq.buyer_items.item7.question'),
      answer: t('faq.buyer_items.item7.answer')
    },
    {
      question: t('faq.buyer_items.item8.question'),
      answer: t('faq.buyer_items.item8.answer')
    },
    {
      question: t('faq.buyer_items.item9.question'),
      answer: t('faq.buyer_items.item9.answer')
    },
    {
      question: t('faq.buyer_items.item10.question'),
      answer: t('faq.buyer_items.item10.answer')
    },
    {
      question: t('faq.buyer_items.item11.question'),
      answer: t('faq.buyer_items.item11.answer')
    },
    {
      question: t('faq.buyer_items.item12.question'),
      answer: t('faq.buyer_items.item12.answer')
    }
  ];

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSliderTransform = () => {
    switch (activeSection) {
      case "general":
        return "translateX(0%)";
      case "seller":
        return "translateX(100%)";
      case "buyer":
        return "translateX(200%)";
      default:
        return "translateX(0%)";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const renderFaqSection = (title: string, items: Array<{ question: string; answer: string }>, sectionId: string) => (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">{title}</h2>
      <Accordion type="multiple" className="w-full">
        {items.map((item, index) => (
          <motion.div key={index} variants={itemVariants}>
            <AccordionItem value={`${sectionId}-${index}`} className="bg-white mb-4 rounded-lg border border-gray-200 overflow-hidden">
              <AccordionTrigger className="text-xl font-semibold text-left px-6 py-4 hover:bg-gray-50">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 px-6 pb-6 pt-2">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <section className="py-24 bg-gray-50">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-16"
            >
              <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4"
              >
                {t('faq.title')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="text-xl text-gray-600 mb-12 max-w-3xl"
              >
                {t('faq.subtitle')}
              </motion.p>
            </motion.div>

            {/* Animated Navigation */}
            <div className="sticky top-20 bg-white shadow-md rounded-lg mb-8 z-10">
              <div className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-lg relative border border-gray-200">
                <button
                  onClick={() => handleSectionChange("general")}
                  className={`relative z-30 px-4 py-3 text-center font-medium transition-all duration-300 ease-in-out ${
                    activeSection === "general"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {t('faq.general')}
                </button>
                <button
                  onClick={() => handleSectionChange("seller")}
                  className={`relative z-30 px-4 py-3 text-center font-medium transition-all duration-300 ease-in-out ${
                    activeSection === "seller"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {t('faq.sellers')}
                </button>
                <button
                  onClick={() => handleSectionChange("buyer")}
                  className={`relative z-30 px-4 py-3 text-center font-medium transition-all duration-300 ease-in-out ${
                    activeSection === "buyer"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {t('faq.buyers')}
                </button>
                <div
                  className="absolute inset-1 bg-gray-800 rounded-md transition-transform duration-300 ease-in-out"
                  style={{
                    transform: getSliderTransform(),
                    width: 'calc(33.333% - 0.125rem)',
                  }}
                />
              </div>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="w-full max-w-4xl mx-auto"
            >
              {activeSection === "general" && renderFaqSection(t('faq.general'), generalFaqItems, "general")}
              {activeSection === "seller" && renderFaqSection(t('faq.sellers'), sellerFaqItems, "seller")}
              {activeSection === "buyer" && renderFaqSection(t('faq.buyers'), buyerFaqItems, "buyer")}
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQPage;
