import RealEstateCalculators from "@/components/RealEstateCalculators";
import PageShell, { ShellSection } from "@/components/PageShell";
import { agentIdentity } from "@/lib/schema";
import { Link } from "react-router-dom";

const Calculator = () => {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Calculators", path: "/calculator" },
  ];

  return (
    <PageShell
      path="/calculator"
      crumbs={crumbs}
      seo={{
        title: 'Mortgage & Home Affordability Calculators',
        description:
          'Work out a realistic monthly payment, what you can afford, and your likely closing costs before you start touring homes in Greater Boston.',
        keywords:
          'mortgage calculator Massachusetts, home affordability calculator, closing cost calculator MA, monthly payment calculator Boston',
      }}
      // Resolves the #agent reference these pages would otherwise leave
      // dangling, and ties the page to the business entity.
      jsonLd={agentIdentity()}
      eyebrow="Tools"
      // The calculator components themselves only render h2s, so this page had
      // no h1 at all — every page needs exactly one.
      h1="Massachusetts Mortgage & Affordability Calculators"
      lede="Estimate a monthly payment, work out what you can afford, and see the closing costs to budget for before you start touring homes in Greater Boston."
      hero={{
        image:
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=65',
        alt: 'A desk with paperwork for a home purchase',
      }}
      heroSize="standard"
      width="wide"
      cta={{
        heading: 'Want these numbers for a real address?',
        body:
          'A calculator uses the figures you give it. The tax rate, the insurance quote and the condo fee on an actual listing are what change the answer.',
      }}
    >
      <ShellSection width="wide" className="pt-16 md:pt-20 pb-0 bg-white">
        {/*
          The calculators are client-side components, so the prerendered page
          was a heading and a subtitle. This explains what each one does and —
          more usefully — what it leaves out, which is where estimates mislead.
        */}
        <div className="mt-10 grid gap-8 border-y border-gray-200 py-8 md:grid-cols-3">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              Monthly payment
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Principal and interest, plus estimates for property tax and
              insurance. Use the real tax bill for a specific address from the
              town assessor rather than a percentage —{' '}
              <Link to="/blog/mass-property-tax-guide" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                rates vary widely between neighbouring towns
              </Link>{' '}
              and the bill never goes away.
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              What you can afford
            </h2>
            <p className="text-gray-600 leading-relaxed">
              What a lender will approve and what you should spend are different
              numbers, and the gap is where people get into trouble. A{' '}
              <Link to="/blog/pre-approval-checklist" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                written pre-approval
              </Link>{' '}
              is the figure that counts in an offer.
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              Cash to close
            </h2>
            <p className="text-gray-600 leading-relaxed">
              The down payment is the number people plan for. Attorney fees,
              title examination and insurance, recording, prepaid interest and
              the escrow account are the ones that surprise them — along with
              needing reserves left over{' '}
              <Link to="/blog/first-time-homebuyer-mistakes-massachusetts" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                after
              </Link>{' '}
              closing.
            </p>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-sm text-gray-500">
          These are estimates for planning, not quotes. Rates, tax rates and
          insurance costs change, and the figure that binds anyone is the Loan
          Estimate from a lender.
        </p>
      </ShellSection>

      {/* Full-bleed band, so it sits outside the shell's column and caps itself. */}
      <RealEstateCalculators />
    </PageShell>
  );
};

export default Calculator;
