
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  }
];

const FAQ = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container px-4">
        <h2 className="text-4xl font-bold text-[#1a1a1a] mb-12">FREQUENTLY ASKED QUESTIONS</h2>
        
        <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-xl font-semibold text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
