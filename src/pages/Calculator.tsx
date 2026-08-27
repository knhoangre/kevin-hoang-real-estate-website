import RealEstateCalculators from "@/components/RealEstateCalculators";
import Seo from "@/components/Seo";
import BreadcrumbBar from "@/components/BreadcrumbBar";
import { breadcrumbs } from "@/lib/schema";

const Calculator = () => {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Calculators", path: "/calculator" },
  ];

  return (
    <div className="min-h-screen bg-white pt-20">
      <Seo
        title="Mortgage & Home Affordability Calculators"
        description="Work out a realistic monthly payment, what you can afford, and your likely closing costs before you start touring homes in Greater Boston."
        keywords="mortgage calculator Massachusetts, home affordability calculator, closing cost calculator MA, monthly payment calculator Boston"
        jsonLd={breadcrumbs(crumbs)}
/>
      {/* The calculator components themselves only render h2s, so this page had
          no h1 at all — every page needs exactly one. */}
      <div className="container mx-auto px-4 pt-12">
            <BreadcrumbBar items={crumbs} />
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4 enter-down">
          Massachusetts Mortgage &amp; Affordability Calculators
        </h1>
        <p
          className="text-xl text-gray-600 max-w-3xl enter-down"
          style={{ '--enter-delay': '0.2s' } as React.CSSProperties}
        >
          Estimate a monthly payment, work out what you can afford, and see the closing
          costs to budget for before you start touring homes in Greater Boston.
        </p>
      </div>
      <RealEstateCalculators />
    </div>
  );
};

export default Calculator;
