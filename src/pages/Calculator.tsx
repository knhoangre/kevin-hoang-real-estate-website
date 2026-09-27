import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageShell, { ShellSection } from "@/components/PageShell";
import HomeCalculator, { type CalculatorSeed } from "@/components/calculator/HomeCalculator";
import type { CalcLang } from "@/components/calculator/copy";
import { agentIdentity } from "@/lib/schema";

/**
 * /calculator — the same calculator as every listing page, opened on example
 * figures instead of a listing's.
 *
 * It ran RealEstateCalculators until 2026-09-27: sliders in cards, its own
 * arithmetic and 147 i18n keys, and no PMI, loan summary or cap rate. Its page
 * copy also promised an affordability calculator and a closing-cost calculator,
 * neither of which existed. The three blocks below now describe the three views
 * that do.
 *
 * EXAMPLE figures, and the calculator says so before it shows a number. None of
 * them is a claim about the market: the price is a round number, the tax bill
 * is labelled as an example with a pointer to the real one, and insurance is
 * the only derived figure, from the same cited average a listing uses.
 */
const EXAMPLE_PRICE = 800_000;

const SEED: CalculatorSeed = {
  price: EXAMPLE_PRICE,
  annualTaxes: 9_000,
  taxSource: { from: "example" },
  monthlyHoa: 0,
  hoaSource: "example",
  propType: "SF",
  rentLookup: null,
  exampleRent: 3_500,
  views: ["live", "invest", "sell"],
};

const linkClass =
  "underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink";

const Calculator = () => {
  /*
   * The CALCULATOR follows the language toggle; the page copy around it does not,
   * like every other English page. The toggle is applied after mount (see
   * LanguagePreference), so the prerendered HTML and the first client render are
   * both English and hydration matches.
   */
  const { i18n } = useTranslation();
  const lang: CalcLang = i18n.language === "vi" ? "vi" : "en";

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Calculators", path: "/calculator" },
  ];

  return (
    <PageShell
      path="/calculator"
      crumbs={crumbs}
      seo={{
        title: "Mortgage, Rental and Seller Proceeds Calculator",
        description:
          "Work out the real monthly cost of a Massachusetts home, what it returns as a rental, and what a seller walks away with after commission, the deed tax and the payoff.",
        keywords:
          "mortgage calculator Massachusetts, monthly payment calculator Boston, rental property calculator MA, seller net proceeds calculator Massachusetts, deed excise tax calculator",
      }}
      // Resolves the #agent reference these pages would otherwise leave
      // dangling, and ties the page to the business entity.
      jsonLd={agentIdentity()}
      eyebrow="Tools"
      h1="Massachusetts Mortgage, Rental and Seller Proceeds Calculator"
      lede="What a home costs you each month, what it would return rented out, and what you would walk away with selling one — with the Massachusetts costs that generic calculators leave out."
      hero={{
        image:
          "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=65",
        alt: "A desk with paperwork for a home purchase",
      }}
      heroSize="standard"
      width="wide"
      cta={{
        heading: "Want these numbers for a real address?",
        body:
          "A calculator uses the figures you give it. The tax rate, the insurance quote and the condo fee on an actual listing are what change the answer — and every listing in the search opens this calculator with its own.",
      }}
    >
      <ShellSection width="wide" className="bg-white pb-0 pt-16 md:pt-20">
        {/*
          The calculator is client-side, so the prerendered page would otherwise
          be a heading and a subtitle. This explains what each view does and —
          more usefully — what it leaves out, which is where estimates mislead.
        */}
        <div className="grid gap-8 border-y border-gray-200 py-8 md:grid-cols-3">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">Buying to live in</h2>
            <p className="leading-relaxed text-gray-600">
              Principal and interest, property tax, insurance, any association fee, and mortgage
              insurance below 20% down. Use the real tax bill for the address rather than a
              percentage —{" "}
              <Link to="/blog/mass-property-tax-guide" className={linkClass}>
                rates vary widely between neighbouring towns
              </Link>
              . What a lender approves is set by a{" "}
              <Link to="/blog/pre-approval-checklist" className={linkClass}>
                written pre-approval
              </Link>
              , and cash to close is{" "}
              <Link to="/blog/buyer-closing-costs-massachusetts" className={linkClass}>
                more than the down payment
              </Link>
              .
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">Buying to rent out</h2>
            <p className="leading-relaxed text-gray-600">
              Cash flow after vacancy, maintenance and management, plus the cap rate and the return
              on your down payment. It deliberately leaves out appreciation, so a deal has to stand
              on its rent. More in{" "}
              <Link to="/blog/rental-property-investment-massachusetts" className={linkClass}>
                buying a rental property in Massachusetts
              </Link>
              .
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">Selling</h2>
            <p className="leading-relaxed text-gray-600">
              The sale price less commission, the Massachusetts deed tax, closing costs, credits to
              the buyer and the mortgage payoff.{" "}
              <Link to="/blog/sellers-net-proceeds-massachusetts" className={linkClass}>
                The sale price and what you walk away with
              </Link>{" "}
              are different numbers, and the second is the one a next purchase is planned on.
            </p>
          </div>
        </div>
      </ShellSection>

      <ShellSection width="wide" className="bg-white py-16 md:py-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Run the numbers
        </h2>
        <div className="mt-5">
          <HomeCalculator lang={lang} context="general" seed={SEED} />
        </div>
      </ShellSection>
    </PageShell>
  );
};

export default Calculator;
