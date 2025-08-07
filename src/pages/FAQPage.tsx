import Navbar from "@/components/Navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const generalFaqItems = [
  {
    question: "What makes your real estate services unique?",
    answer: "Our real estate services stand out because of our personalized approach, deep market knowledge, and commitment to client satisfaction. We take the time to understand your specific needs and goals, provide tailored guidance throughout the process, and leverage our extensive local expertise to achieve the best possible outcomes."
  },
  {
    question: "What areas in and around Boston do you serve?",
    answer: "We serve the entire Greater Boston area, including Cambridge, Somerville, Newton, Brookline, Wellesley, Needham, Lexington, Winchester, Arlington, Medford, Malden, Weston, Dover, and many more. Our extensive knowledge of these diverse neighborhoods allows us to provide expert guidance regardless of where you're buying or selling."
  },
  {
    question: "What's the difference between a buyer's agent and a seller's agent?",
    answer: "A buyer's agent exclusively represents the interests of the home buyer, helping them find suitable properties, negotiating the best possible price and terms, and guiding them through inspections and closing. A seller's agent (or listing agent) represents the seller, marketing their property, advising on pricing strategy, and working to secure the most favorable terms for the seller. In Massachusetts, agents must disclose who they represent in a transaction."
  },
  {
    question: "Do I need a real estate attorney for my transaction?",
    answer: "In Massachusetts, it's common and advisable to have a real estate attorney represent you whether buying or selling. Unlike some states, attorneys typically handle the closing process here rather than title companies. An attorney will review the purchase and sale agreement, conduct title research, resolve any legal issues, and ensure that all documents are properly prepared and filed."
  },
  {
    question: "What's the current state of the Boston housing market?",
    answer: "The Boston housing market remains competitive, characterized by limited inventory and strong demand in many neighborhoods. Market conditions can vary significantly by location, property type, and price point. We provide clients with up-to-date market analyses specific to their areas of interest, including recent sales data, days on market, and pricing trends to inform strategic decisions."
  },
  {
    question: "How do you stay informed about the local real estate market?",
    answer: "We maintain active memberships in professional organizations, attend regular market updates and training sessions, subscribe to industry publications, and analyze MLS data daily. Additionally, we network with other real estate professionals and attend local community events to stay informed about neighborhood developments and market trends."
  },
  {
    question: "What is your approach to client communication?",
    answer: "We believe in transparent, consistent, and responsive communication. We provide regular updates via your preferred method (email, text, or phone), respond to inquiries promptly, and set clear expectations about the process and timeline. We also use technology to keep you informed about property viewings, offers, and important deadlines."
  },
  {
    question: "How do you handle multiple offers on a property?",
    answer: "When a property receives multiple offers, we guide our clients through a structured process. For sellers, we present all offers with a detailed analysis of each, including price, contingencies, and buyer qualifications. For buyers, we help craft competitive offers that stand out while protecting your interests. We maintain ethical standards and treat all parties fairly throughout the negotiation process."
  },
  {
    question: "What happens if a transaction doesn't close as expected?",
    answer: "While most transactions close successfully, issues can arise. We have extensive experience handling unexpected situations such as inspection issues, financing problems, or title concerns. We work proactively to identify potential issues early, communicate clearly about any problems, and develop creative solutions to keep the transaction moving forward when possible."
  },
  {
    question: "How do you ensure a smooth closing process?",
    answer: "We coordinate closely with all parties involved in the transaction, including attorneys, lenders, inspectors, and title companies. We create detailed timelines, track important deadlines, and ensure all required documentation is completed accurately and on time. Our systematic approach helps minimize surprises and keeps the closing process on track."
  },
  {
    question: "What happens after the sale is complete?",
    answer: "Our relationship doesn't end at closing. We provide post-closing support, including recommendations for local services, maintenance tips, and community resources. We stay in touch with our clients and are available to answer questions or assist with future real estate needs. Many of our clients become repeat customers or refer friends and family to us."
  },
  {
    question: "How do you handle client confidentiality?",
    answer: "We take client confidentiality very seriously. All information shared with us during the buying or selling process is kept strictly confidential. We never disclose personal financial information, motivations, or other sensitive details without explicit permission. This commitment to privacy helps build trust and ensures our clients feel comfortable sharing important information with us."
  }
];

const sellerFaqItems = [
  {
    question: "How long does it typically take to sell a home in the Boston area?",
    answer: "The time it takes to sell a home in the Boston area varies depending on market conditions, property type, location, and pricing. On average, well-priced homes in desirable neighborhoods can sell within 30-45 days. However, luxury properties or homes in less competitive areas may take longer. We develop a strategic marketing plan for each property to ensure maximum exposure and the shortest possible time on market."
  },
  {
    question: "What should I do to prepare my home for sale?",
    answer: "To prepare your home for sale, focus on enhancing curb appeal, decluttering and depersonalizing interiors, making minor repairs, deep cleaning, and considering professional staging. We provide a personalized pre-listing consultation to identify specific improvements that will maximize your property's value and appeal to target buyers in your area."
  },
  {
    question: "How do you determine the right listing price for my home?",
    answer: "We determine the optimal listing price through a comprehensive comparative market analysis that considers recent sales of similar properties, current market conditions, your home's unique features and improvements, location advantages, and buyer trends. Our goal is to recommend a competitive price that attracts serious buyers while maximizing your return."
  },
  {
    question: "What costs should I expect when selling my home?",
    answer: "When selling your home, typical costs include real estate commission (usually 5-6% of the sale price), closing costs (1-3%), potential repairs identified during inspections, possible seller concessions, moving expenses, and any outstanding mortgage balance. We provide a detailed net proceeds estimate during our initial consultation so you'll have a clear understanding of your financial outcome."
  },
  {
    question: "How do you market properties to ensure maximum exposure?",
    answer: "Our comprehensive marketing strategy includes professional photography, virtual tours, targeted social media campaigns, premium placement on real estate platforms, email marketing to our buyer database, broker networking, and strategic open houses. For luxury properties, we also implement specialized marketing approaches to reach qualified buyers."
  },
  {
    question: "Should I make repairs before listing my home?",
    answer: "The decision to make repairs before listing depends on the type and extent of the issues. Generally, we recommend addressing major structural problems, safety concerns, and obvious cosmetic issues that could deter buyers or significantly impact value. For minor issues, we can discuss whether to repair them or adjust the price accordingly. We can help you prioritize repairs based on cost versus potential return on investment."
  },
  {
    question: "How do you handle showings and open houses?",
    answer: "We coordinate all showings through a secure online system that allows you to approve or decline requests based on your schedule. For open houses, we ensure your home is properly staged and marketed to attract qualified buyers. We provide detailed feedback after each showing to help you understand buyer interest and potential areas for improvement. We also implement security measures to protect your property during showings."
  },
  {
    question: "What happens during the negotiation process?",
    answer: "During negotiations, we act as your advocate while maintaining professional relationships with all parties. We present offers with detailed analysis, explain the pros and cons of each, and help you make informed decisions. We're skilled at crafting counter-offers that protect your interests while keeping the transaction moving forward. Our goal is to achieve the best possible terms while ensuring a smooth process."
  },
  {
    question: "How do you handle inspection issues?",
    answer: "When inspection issues arise, we help you evaluate their significance and determine the best response. We can recommend trusted contractors for estimates, negotiate repairs or credits with the buyer, or explore other solutions that work for both parties. Our experience helps us distinguish between minor issues and significant concerns that might affect the transaction."
  },
  {
    question: "What should I know about the closing process?",
    answer: "The closing process typically takes 30-45 days from the time a purchase and sale agreement is signed. During this period, we coordinate with attorneys, lenders, and other professionals to ensure all conditions are met and documentation is completed. We keep you informed about important deadlines and requirements, and we're present at the closing to address any last-minute questions or concerns."
  },
  {
    question: "How do you handle properties that aren't selling quickly?",
    answer: "If a property isn't attracting offers within the expected timeframe, we implement a strategic reassessment. This may include adjusting the price, enhancing marketing efforts, making additional property improvements, or exploring alternative selling strategies. We provide regular market updates and feedback from showings to help you make informed decisions about next steps."
  },
  {
    question: "What are the tax implications of selling my home?",
    answer: "Tax implications vary based on factors such as how long you've owned the property, whether it was your primary residence, and any capital improvements you've made. Generally, you may be eligible for a capital gains exclusion of up to $250,000 (single) or $500,000 (married) if the home was your primary residence for at least two of the past five years. We recommend consulting with a tax professional for specific advice about your situation."
  }
];

const buyerFaqItems = [
  {
    question: "What should first-time homebuyers know about the Boston market?",
    answer: "First-time homebuyers in Boston should understand that the market moves quickly, competition can be intense, and being financially prepared is essential. We recommend getting pre-approved for financing, understanding your must-haves versus nice-to-haves, being prepared to act decisively, and having realistic expectations about what your budget can purchase in different neighborhoods."
  },
  {
    question: "How can I get pre-approved for a mortgage?",
    answer: "To get pre-approved for a mortgage, you'll need to contact a lender and provide financial documentation such as proof of income, employment verification, credit history, and bank statements. The lender will review your financial situation and determine how much they're willing to lend you. We work with trusted local lenders who understand the Boston market and can guide you through this process efficiently."
  },
  {
    question: "What's the typical home buying process in Boston?",
    answer: "The home buying process typically begins with getting pre-approved for a mortgage, identifying your priorities and preferences, touring properties, making an offer, negotiating terms, conducting inspections, securing final financing, and closing. The entire process usually takes 2-3 months from start to finish, though this can vary based on market conditions and specific circumstances. We guide you through each step, explaining what to expect and helping you make informed decisions."
  },
  {
    question: "How do you help buyers find the right property?",
    answer: "We begin by understanding your specific needs, preferences, and budget through detailed consultations. We then use our extensive knowledge of the Boston area and access to comprehensive listing data to identify properties that match your criteria. We schedule viewings, provide neighborhood insights, and help you evaluate each property's pros and cons. Our goal is to find you a home that meets your needs and represents a good investment."
  },
  {
    question: "What should I look for during property viewings?",
    answer: "During viewings, we help you evaluate both the property itself and its location. We look at structural elements, layout, natural light, storage, and potential for improvements. We also assess neighborhood factors such as safety, schools, transportation, and future development plans. We encourage you to take notes and photos, and we're happy to point out features you might not notice on your own."
  },
  {
    question: "How do you help with the offer process?",
    answer: "When you're ready to make an offer, we provide a detailed market analysis to help determine an appropriate price. We explain the components of a strong offer, including price, contingencies, and timing. We draft the offer, present it to the seller's agent, and negotiate on your behalf. Our experience helps us anticipate potential issues and craft offers that stand out in competitive situations."
  },
  {
    question: "What contingencies should I include in my offer?",
    answer: "Common contingencies include financing, home inspection, and sale of your current home. The specific contingencies you include depend on your situation and the property. We help you understand the purpose and implications of each contingency and recommend which ones to include based on your needs and the current market conditions. We also explain how to structure contingencies to make your offer more attractive to sellers."
  },
  {
    question: "How do you handle the home inspection process?",
    answer: "We recommend a thorough home inspection by a qualified professional. We can suggest trusted inspectors and attend the inspection with you to help interpret the findings. If issues are discovered, we help you evaluate their significance and determine the best response, whether that's requesting repairs, negotiating a price adjustment, or, in some cases, walking away from the property."
  },
  {
    question: "What should I know about closing costs?",
    answer: "Closing costs typically range from 2-5% of the purchase price and may include loan origination fees, title insurance, attorney fees, property taxes, and escrow deposits. We provide a detailed estimate of these costs early in the process so you can budget accordingly. We also explain which costs are negotiable and which are fixed, helping you understand where you might save money."
  },
  {
    question: "How do you help with competitive bidding situations?",
    answer: "In competitive markets like Boston, multiple-offer situations are common. We help you craft a strong offer that stands out while protecting your interests. This may include offering a higher price, minimizing contingencies, providing a larger earnest money deposit, or writing a personal letter to the seller. We explain the pros and cons of each strategy and help you decide which approach aligns with your goals and risk tolerance."
  },
  {
    question: "What should I know about property taxes in Boston?",
    answer: "Property taxes in Boston and surrounding communities vary significantly. We provide information about current tax rates, assessment processes, and potential changes that might affect your tax burden. We also explain how property taxes are calculated and what factors might cause them to increase over time. This information helps you budget accurately and understand the true cost of homeownership."
  },
  {
    question: "How do you help with the final walkthrough and closing?",
    answer: "Before closing, we schedule a final walkthrough to ensure the property is in the agreed-upon condition. We attend the closing with you to address any last-minute questions or concerns. We explain all the documents you'll be signing and ensure everything proceeds smoothly. Our presence helps ensure that all terms of the agreement are fulfilled and that you're fully prepared for this important step."
  }
];

const FAQPage = () => {
  const [activeSection, setActiveSection] = useState("general");
  const generalRef = useRef<HTMLDivElement>(null);
  const sellerRef = useRef<HTMLDivElement>(null);
  const buyerRef = useRef<HTMLDivElement>(null);

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
                FREQUENTLY ASKED QUESTIONS
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="text-xl text-gray-600 mb-12 max-w-3xl"
              >
                Find answers to common questions about buying and selling real estate in the Greater Boston area.
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
                  General Questions
                </button>
                <button
                  onClick={() => handleSectionChange("seller")}
                  className={`relative z-30 px-4 py-3 text-center font-medium transition-all duration-300 ease-in-out ${
                    activeSection === "seller"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  Questions for Sellers
                </button>
                <button
                  onClick={() => handleSectionChange("buyer")}
                  className={`relative z-30 px-4 py-3 text-center font-medium transition-all duration-300 ease-in-out ${
                    activeSection === "buyer"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  Questions for Buyers
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
              {activeSection === "general" && renderFaqSection("General Questions", generalFaqItems, "general")}
              {activeSection === "seller" && renderFaqSection("Questions for Sellers", sellerFaqItems, "seller")}
              {activeSection === "buyer" && renderFaqSection("Questions for Buyers", buyerFaqItems, "buyer")}
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQPage;
