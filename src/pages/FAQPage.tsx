
import Navbar from "@/components/Navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqItems = [
  {
    question: "What makes your real estate services unique?",
    answer: "Our real estate services stand out because of our personalized approach, deep market knowledge, and commitment to client satisfaction. We take the time to understand your specific needs and goals, provide tailored guidance throughout the process, and leverage our extensive local expertise to achieve the best possible outcomes."
  },
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
    question: "What areas in and around Boston do you serve?",
    answer: "We serve the entire Greater Boston area, including Cambridge, Somerville, Newton, Brookline, Wellesley, Needham, Lexington, Winchester, Arlington, Medford, Malden, Weston, Dover, and many more. Our extensive knowledge of these diverse neighborhoods allows us to provide expert guidance regardless of where you're buying or selling."
  },
  {
    question: "What should first-time homebuyers know about the Boston market?",
    answer: "First-time homebuyers in Boston should understand that the market moves quickly, competition can be intense, and being financially prepared is essential. We recommend getting pre-approved for financing, understanding your must-haves versus nice-to-haves, being prepared to act decisively, and having realistic expectations about what your budget can purchase in different neighborhoods."
  },
  {
    question: "How can I get pre-approved for a mortgage?",
    answer: "To get pre-approved for a mortgage, you'll need to contact a lender and provide financial documentation such as proof of income, employment verification, credit history, and bank statements. The lender will review your financial situation and determine how much they're willing to lend you. We work with trusted local lenders who understand the Boston market and can guide you through this process efficiently."
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
];

const FAQPage = () => {
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-24 bg-gray-50">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-[#1a1a1a] mb-4">FREQUENTLY ASKED QUESTIONS</h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl">
              Find answers to common questions about buying and selling real estate in the Greater Boston area.
            </p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full max-w-4xl mx-auto"
          >
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <AccordionItem value={`item-${index}`} className="bg-white mb-4 rounded-lg border border-gray-200 overflow-hidden">
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
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
