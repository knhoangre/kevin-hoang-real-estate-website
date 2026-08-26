import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import FaqAccordion from "@/components/FaqAccordion";
import { breadcrumbs, faqPage } from "@/lib/schema";
import BreadcrumbBar from "@/components/BreadcrumbBar";

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
    // Deliberately does not scroll. Switching tab is not navigation, the tab
    // bar is sticky, and yanking the page to the top moves the reader away
    // from the control they just pressed.
    setActiveSection(sectionId);
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

  /**
   * All three sections are rendered into the DOM and the inactive ones are
   * hidden with `hidden`, rather than `{activeSection === x && ...}`.
   *
   * Conditional rendering meant the prerendered HTML contained ONE of the three
   * question sets and — because the Radix accordion unmounts collapsed content
   * — none of the answers at all. That both hides the copy from every crawler
   * that does not run JS and invalidates the FAQPage markup, which requires the
   * answers to actually be on the page.
   */
  const renderFaqSection = (
    title: string,
    items: Array<{ question: string; answer: string }>,
    sectionId: string
  ) => (
    <div key={sectionId} className="mb-16" hidden={activeSection !== sectionId}>
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">{title}</h2>
      <div className="rounded-lg bg-white px-6">
        <FaqAccordion faqs={items} />
      </div>
    </div>
  );

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/*
        FAQPage markup is kept for AI-search comprehension, not for a SERP
        feature — Google removed FAQ rich results in May 2026. Never build a
        page *for* that rich result.
      */}
      <Seo
        title="Frequently Asked Questions About Buying & Selling in Greater Boston"
        description="Straight answers to the questions buyers and sellers ask most about Massachusetts real estate — offers, inspections, pricing, closing, and agent fees."
        keywords="Massachusetts real estate FAQ, home buying questions MA, home selling questions Boston, real estate agent questions"
        jsonLd={[breadcrumbs(crumbs), faqPage([...generalFaqItems, ...sellerFaqItems, ...buyerFaqItems])]}
      />
      <div className="pt-16">
        {/* White section for heading - matches blog spacing */}
        <div className="bg-white container px-4 py-24">
            <div className="max-w-6xl mx-auto">
              <BreadcrumbBar items={crumbs} />
            </div>
          <div className="mb-16 enter-down">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4 enter-down" style={{ '--enter-delay': '0.2s' } as React.CSSProperties}>
              {t('faq.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl enter-down" style={{ '--enter-delay': '0.4s' } as React.CSSProperties}>
              {t('faq.subtitle')}
            </p>
          </div>
        </div>
        
        {/* Gray background section starts here - no overlap, clean transition */}
        <section className="bg-gray-50 pt-0 pb-24">
          <div className="container px-4">

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

            <div className="w-full max-w-4xl mx-auto">
              {renderFaqSection(t('faq.general'), generalFaqItems, "general")}
              {renderFaqSection(t('faq.sellers'), sellerFaqItems, "seller")}
              {renderFaqSection(t('faq.buyers'), buyerFaqItems, "buyer")}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQPage;
