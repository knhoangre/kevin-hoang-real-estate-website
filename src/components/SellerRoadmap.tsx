import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    title: "1. Preparation & Planning",
    description: "Assess your motivation & timing – Are you aiming for the highest price, quickest sale, or both?",
    details: [
      "Research the market – Review recent comparable sales (comps) to understand pricing trends.",
      "Estimate costs of selling – Agent commission, closing costs, repairs, staging, taxes, possible mortgage payoff.",
      "Gather property documents – Deed, permits, warranties, HOA rules, utility bills."
    ]
  },
  {
    title: "2. Hiring Professionals",
    description: "Choose a listing agent – They'll market, negotiate, and guide you through the sale (standard fee 5–6% split between listing and buyer agents).",
    details: [
      "Optional specialists – Real estate attorney (common in states like MA), home stager, photographer.",
      "Discuss pricing strategy – Pricing slightly above, at, or below market value depending on market conditions."
    ]
  },
  {
    title: "3. Preparing the Property",
    description: "Declutter & deep clean – Make rooms look larger and more inviting.",
    details: [
      "Complete repairs & touch-ups – Fix obvious defects that could turn buyers away.",
      "Enhance curb appeal – Landscaping, paint, lighting.",
      "Stage the home – Professional staging or DIY to highlight key features.",
      "Professional photos & videos – First impressions are made online."
    ]
  },
  {
    title: "4. Listing & Marketing",
    description: "List on MLS – Your agent posts your home with full details, professional photos, and possibly a 3D tour.",
    details: [
      "Marketing plan – Open houses, social media ads, email campaigns, real estate websites.",
      "Showings – Be flexible with showing times; keep the home tidy and ready."
    ]
  },
  {
    title: "5. Receiving & Negotiating Offers",
    description: "Review offers with your agent – Look beyond price: contingencies, closing date, financing type, earnest money.",
    details: [
      "Counteroffer if needed – Adjust price, terms, or credits to find common ground.",
      "Accept the best offer – Sign the purchase agreement."
    ]
  },
  {
    title: "6. Under Contract",
    description: "Buyer inspections – Buyer will typically conduct a home inspection within a set time.",
    details: [
      "Negotiate repairs or credits – Decide what to fix or credit back to the buyer.",
      "Appraisal – Ordered by the buyer's lender to confirm value.",
      "Title search – Ensures no liens or legal issues."
    ]
  },
  {
    title: "7. Preparing for Closing",
    description: "Address contingencies – Make any agreed repairs, gather receipts.",
    details: [
      "Coordinate move-out – Based on agreed closing and possession dates.",
      "Final utility readings – Gas, electric, water.",
      "Sign closing documents – Deed, settlement statement, affidavits."
    ]
  },
  {
    title: "8. Closing Day",
    description: "Buyer does final walkthrough – Confirms property condition matches agreement.",
    details: [
      "Attend closing (or sign remotely) – Sign final documents transferring ownership.",
      "Receive sale proceeds – Funds are wired or provided via check after closing is complete.",
      "Hand over keys – Including garage openers, mail keys, HOA fobs."
    ]
  },
  {
    title: "9. Post-Closing",
    description: "Cancel insurance – After the buyer officially owns the home.",
    details: [
      "File address change – USPS, banks, subscriptions.",
      "Keep closing documents – For tax purposes and future reference."
    ]
  }
];

const SellerRoadmap = () => {
  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-12">YOUR SELLING ROADMAP</h2>

      <div className="relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-6 top-3 bottom-0 w-0.5 bg-green-500 hidden md:block"></div>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col md:flex-row gap-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex-shrink-0 relative z-10">
                <motion.div
                  className="bg-white p-2 rounded-full"
                  initial={{ scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.1 + 0.2
                  }}
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
                {index < steps.length - 1 && (
                  <motion.div
                    className="absolute w-0.5 bg-green-500 left-1/2 transform -translate-x-1/2 top-12 h-16 md:hidden"
                    initial={{ height: 0 }}
                    whileInView={{ height: 50 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                  ></motion.div>
                )}
              </div>

              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg flex-1 z-10 border border-gray-100 hover:shadow-xl transition-shadow"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <h3 className="text-xl font-semibold mb-3 text-[#1a1a1a]">{step.title}</h3>
                <p className="text-gray-700 mb-4 font-medium">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="text-gray-600 text-sm leading-relaxed">
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerRoadmap;
