
import { CheckCircle } from "lucide-react";

const steps = [
  {
    title: "Get Pre-Approved",
    description: "Secure a mortgage pre-approval to understand your budget and show sellers you're serious.",
  },
  {
    title: "House Hunting",
    description: "Search properties that match your criteria and schedule viewings.",
  },
  {
    title: "Make an Offer",
    description: "When you find the right home, submit a competitive offer.",
  },
  {
    title: "Home Inspection",
    description: "Get a professional inspection to identify any potential issues.",
  },
  {
    title: "Final Approval",
    description: "Work with your lender to finalize the mortgage approval.",
  },
  {
    title: "Closing",
    description: "Sign the final paperwork and get your keys!",
  },
];

const BuyerRoadmap = () => {
  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">YOUR BUYING ROADMAP</h2>
      <div className="space-y-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerRoadmap;
