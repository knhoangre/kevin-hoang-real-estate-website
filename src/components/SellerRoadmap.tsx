
import { CheckCircle } from "lucide-react";

const steps = [
  {
    title: "Home Evaluation",
    description: "Get a professional assessment of your home's current market value.",
  },
  {
    title: "Prepare Your Home",
    description: "Make necessary repairs and improvements to maximize value.",
  },
  {
    title: "Professional Photos",
    description: "Have professional photos taken to showcase your home.",
  },
  {
    title: "List Your Home",
    description: "List your property on the market with optimal pricing.",
  },
  {
    title: "Show Your Home",
    description: "Host showings and open houses for potential buyers.",
  },
  {
    title: "Review Offers",
    description: "Evaluate and negotiate offers with potential buyers.",
  },
  {
    title: "Closing",
    description: "Complete the final paperwork and hand over the keys.",
  },
];

const SellerRoadmap = () => {
  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">YOUR SELLING ROADMAP</h2>
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

export default SellerRoadmap;
