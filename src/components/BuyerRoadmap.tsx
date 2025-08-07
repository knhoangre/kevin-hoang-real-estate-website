import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    title: "1. Preparation & Financial Readiness",
    description: "Check your credit score – Aim for 620+ for conventional loans (higher score = better terms).",
    details: [
      "Set a budget – Use online calculators or speak with a lender to determine how much you can afford (including taxes, insurance, and HOA fees if applicable).",
      "Save for upfront costs – Down payment (3–20%), closing costs (2–5%), inspections, and moving expenses.",
      "Get pre-approved – A lender issues a pre-approval letter showing sellers you're financially qualified.",
      "Identify must-haves vs. nice-to-haves – Location, size, layout, amenities, commute, school district."
    ]
  },
  {
    title: "2. Hiring Professionals",
    description: "Choose a buyer's agent – They represent your interests, negotiate on your behalf, and guide you through the process (paid from seller's commission in most cases).",
    details: [
      "Select a lender/mortgage broker – Compare rates, fees, and programs (FHA, VA, USDA, conventional).",
      "Optional specialists – Real estate attorney (common in some states), financial advisor, inspector."
    ]
  },
  {
    title: "3. House Hunting",
    description: "Search online & tour properties – MLS, Zillow, Redfin, open houses.",
    details: [
      "Narrow your search – Consider market trends, property taxes, neighborhood safety, and future resale value.",
      "Track comparable sales – Understand what similar homes sell for to avoid overpaying."
    ]
  },
  {
    title: "4. Making an Offer",
    description: "Review comparable sales – Helps determine a fair and competitive price.",
    details: [
      "Set terms – Price, deposit amount (earnest money), contingencies (inspection, financing, appraisal), closing date.",
      "Submit offer – Your agent delivers it to the seller's agent.",
      "Negotiate – Counteroffers may go back and forth until an agreement is reached."
    ]
  },
  {
    title: "5. Under Contract",
    description: "Deposit earnest money – Usually 1–3% of purchase price; held in escrow.",
    details: [
      "Schedule inspections – General home inspection, plus specialized ones (radon, mold, septic, pests) if needed.",
      "Negotiate repairs or credits – Based on inspection results.",
      "Lender orders appraisal – Ensures the property is worth the agreed price."
    ]
  },
  {
    title: "6. Financing & Due Diligence",
    description: "Provide documents to lender – Pay stubs, tax returns, bank statements.",
    details: [
      "Secure homeowner's insurance – Required by lenders before closing.",
      "Review title & HOA docs – Ensure no liens, unpaid fees, or restrictions that impact your plans.",
      "Get final loan approval – Known as 'clear to close.'"
    ]
  },
  {
    title: "7. Closing",
    description: "Do final walkthrough – Confirm repairs are complete and home is in agreed condition.",
    details: [
      "Sign closing documents – Mortgage, deed, disclosures.",
      "Pay closing costs & down payment – Usually via cashier's check or wire transfer.",
      "Receive keys – Congratulations, you officially own the home!"
    ]
  },
  {
    title: "8. Post-Closing",
    description: "Change locks & update security – Safety first.",
    details: [
      "Transfer utilities – Gas, electric, water, internet.",
      "File homestead exemption – In states where it lowers property taxes.",
      "Set a maintenance schedule – Protect your investment."
    ]
  }
];

const BuyerRoadmap = () => {
  return (
        <div className="py-12">
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-12">YOUR BUYING ROADMAP</h2>

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

export default BuyerRoadmap;
