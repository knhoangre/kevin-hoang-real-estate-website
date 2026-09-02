/**
 * The one monthly-payment calculation on this site.
 *
 * Extracted from RealEstateCalculators' private `calculateMonthlyPayment` when
 * the listing page at /search/<mls> grew a payment estimate of its own. Two
 * copies of an amortisation formula is the same failure `submitContact.ts` and
 * `lib/listings.ts` were each written to end — there, a second contact form that
 * sent nothing, and three private `formatPrice` copies that had already drifted
 * over whether the fallback was "Price on Request" or "Price on request".
 *
 * The two calculators keep their own UI, defaults and copy. Neither owns the
 * arithmetic any more.
 */

export interface PaymentInputs {
  price: number;
  /** In dollars, not percent — the callers own that conversion. */
  downPayment: number;
  /** Annual nominal rate as a percentage, e.g. 6.25. */
  rate: number;
  termYears: number;
  annualTaxes: number;
  annualInsurance: number;
  /** Already monthly. See the note in ListingPayment about the feed's HOA_FEE. */
  monthlyHoa: number;
  /**
   * Annual PMI as a percentage of the ORIGINAL loan amount, e.g. 0.5.
   *
   * Optional so the older callers keep working; omitted means no mortgage
   * insurance is modelled at all, which is what /calculator did before this
   * existed.
   */
  pmiRate?: number;
}

export interface PaymentBreakdown {
  principalAndInterest: number;
  taxes: number;
  insurance: number;
  hoa: number;
  /** Zero at 20% down or more. See PMI_LTV_THRESHOLD. */
  pmi: number;
  total: number;
}

/**
 * The loan-to-value above which a conventional lender requires PMI.
 *
 * 80% is the statutory pivot, not a lender's preference: the Homeowners
 * Protection Act of 1998 (12 U.S.C. 4901 et seq.) gives the borrower the right
 * to request cancellation at 80% and requires automatic termination at 78% of
 * the original value. Modelling it anywhere else would misstate a legal
 * threshold.
 */
export const PMI_LTV_THRESHOLD = 0.8;

/**
 * Principal and interest, plus the monthly share of the carrying costs.
 *
 * DELIBERATELY EXCLUDES PMI, escrow and closing costs. A payment estimate that
 * quietly folded in a mortgage-insurance guess would state a number the reader
 * cannot reproduce; leaving it out and saying so is the same choice the rest of
 * this codebase makes about data it does not have. Callers must carry that
 * disclaimer next to the total.
 *
 * Two degenerate cases the original did not guard, both of which a reader can
 * reach in three keystrokes on a live input and both of which rendered "$NaN":
 *
 *   - A 0% RATE divides by zero in the amortisation formula
 *     (`(1+0)^n - 1` is 0), so the loan is repaid in equal instalments instead.
 *   - A PRINCIPAL OF ZERO OR LESS — paying cash, or a down payment typed past
 *     the price — has no loan to amortise, so P&I is zero. The taxes, insurance
 *     and HOA still apply: a house bought outright still costs money to hold,
 *     and zeroing the whole total there would be the more misleading answer.
 */
export const monthlyPayment = ({
  price,
  downPayment,
  rate,
  termYears,
  annualTaxes,
  annualInsurance,
  monthlyHoa,
  pmiRate = 0,
}: PaymentInputs): PaymentBreakdown => {
  const principal = price - downPayment;
  const n = termYears * 12;
  const monthlyRate = rate / 100 / 12;

  let principalAndInterest = 0;
  if (principal > 0 && n > 0) {
    principalAndInterest =
      monthlyRate > 0
        ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
          (Math.pow(1 + monthlyRate, n) - 1)
        : principal / n;
  }

  const taxes = annualTaxes > 0 ? annualTaxes / 12 : 0;
  const insurance = annualInsurance > 0 ? annualInsurance / 12 : 0;
  const hoa = monthlyHoa > 0 ? monthlyHoa : 0;

  /*
   * MORTGAGE INSURANCE, WHICH APPEARS AND DISAPPEARS ON ITS OWN.
   *
   * Charged on the original loan amount, and only while the loan is above 80%
   * of the price. Computing it as an input the reader has to remember to switch
   * off would reproduce the exact bug this replaces: down-payment scenarios
   * below 20% that showed a CHEAPER monthly payment than reality, which is the
   * most misleading direction for an estimate to be wrong in.
   */
  const pmi =
    price > 0 && principal > 0 && pmiRate > 0 && principal / price > PMI_LTV_THRESHOLD
      ? (principal * (pmiRate / 100)) / 12
      : 0;

  return {
    principalAndInterest,
    taxes,
    insurance,
    hoa,
    pmi,
    total: principalAndInterest + taxes + insurance + hoa + pmi,
  };
};

/**
 * What the loan costs over its whole life, not just this month.
 *
 * The monthly figure is what a buyer can act on; these are what they are
 * actually signing. Total interest on a 30-year note routinely exceeds the down
 * payment several times over, and it is the number no listing portal shows.
 *
 * Taxes, insurance and HOA are deliberately EXCLUDED here even though
 * `monthlyPayment` includes them in the monthly total. Those are not part of the
 * loan, they are not fixed for thirty years, and projecting today's tax bill
 * across three decades would be a fabricated forecast rather than arithmetic.
 * This describes the mortgage only, and the UI says so.
 */
export interface LoanSummary {
  loanAmount: number;
  totalInterest: number;
  /** Principal plus interest across the full term. */
  totalPaid: number;
}

export const loanSummary = (inputs: PaymentInputs): LoanSummary => {
  const loanAmount = Math.max(0, inputs.price - inputs.downPayment);
  const { principalAndInterest } = monthlyPayment(inputs);
  const totalPaid = principalAndInterest * inputs.termYears * 12;
  return {
    loanAmount,
    // Guarded rather than assumed non-negative: a zero-length term returns a
    // zero payment, and `0 - loanAmount` would report negative interest.
    totalInterest: Math.max(0, totalPaid - loanAmount),
    totalPaid,
  };
};

/**
 * A STARTING homeowner's insurance figure, from published Massachusetts data.
 *
 * This used to be a flat $1,800 with a note saying "a starting estimate", which
 * is honest about being a guess but is still a guess — the same number for a
 * $400k Lowell condo and a $5M Boston townhouse, and neither is right.
 *
 * Two rates, because condos are a different product and not a cheaper version
 * of the same one. A condo owner buys an HO-6, which covers the interior and
 * their belongings; the association's master policy covers the structure, so
 * the premium is a fraction of a comparable single-family's and does not scale
 * with the building. Applying a house's rate to a condo would overstate it
 * several times over.
 *
 * Sources, both stated in the UI and both dated:
 *   - Houses:  $1,471/yr at $300,000 dwelling coverage — Insure.com with
 *              Quadrant Information Services, updated 2026-08-04. That is
 *              0.49% of coverage, which is the rate applied here.
 *   - Condos:  $669/yr, the Massachusetts HO-6 average — Insure.com, 2026.
 *
 * THE HONEST CAVEAT, which the UI also carries: dwelling coverage is the cost
 * to REBUILD and excludes the land, while a listing price includes it. Applying
 * a coverage rate to a purchase price therefore runs high, and runs highest in
 * the towns where land is the most expensive part. It is a starting point to be
 * replaced with a real quote, which is why it stays an editable input rather
 * than a computed figure the reader cannot argue with.
 */
export const INSURANCE = {
  /** Annual premium as a share of price, for houses. See the note above. */
  houseRateOfPrice: 0.0049,
  /** Flat annual HO-6 premium for a condo; does not scale with the building. */
  condoAnnual: 669,
  asOf: '2026-09-01',
} as const;

export const estimateInsurance = (price: number, propType: string | null): number => {
  if (propType === 'CC') return INSURANCE.condoAnnual;
  if (price <= 0) return 0;
  return Math.round(price * INSURANCE.houseRateOfPrice);
};

/**
 * Whether a buyer might reasonably be an investor rather than an occupant.
 *
 * Multi-families are bought to rent by default; single-families and condos
 * often enough to be worth offering. A listing that IS a rental is excluded —
 * its price is a monthly rent, so every figure below would be nonsense.
 */
export const canBeInvestment = (propType: string | null) =>
  propType === 'SF' || propType === 'CC' || propType === 'MF';

export interface InvestmentInputs {
  price: number;
  monthlyRent: number;
  /** Percentage of the year the unit is expected to be empty, e.g. 5. */
  vacancyRate: number;
  annualTaxes: number;
  annualInsurance: number;
  monthlyHoa: number;
  annualMaintenance: number;
  /** Property management, as a percentage of collected rent. */
  managementRate: number;
  /** Debt service, from monthlyPayment(). Excluded from NOI by definition. */
  monthlyPrincipalAndInterest: number;
  /**
   * Mortgage insurance, from monthlyPayment(). Zero at 20% down or more.
   *
   * A FINANCING COST, so it sits below NOI beside the debt service rather than
   * among the operating expenses. Putting it in opex would drag the cap rate
   * down, and the cap rate is supposed to describe the building — two investors
   * putting different amounts down would get different cap rates for the same
   * property, which is precisely what that measure exists not to do.
   *
   * It was missing here entirely until 2026-09-02: an investor putting 10% down
   * saw a cash flow that quietly omitted their PMI, which is the one direction
   * an estimate must never be wrong in.
   */
  monthlyPmi?: number;
}

export interface InvestmentReturns {
  effectiveRent: number;
  operatingExpenses: number;
  /** Net operating income, MONTHLY. Excludes debt service. */
  noi: number;
  /** Debt service plus mortgage insurance — everything below the NOI line. */
  financingCost: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  /** Annual NOI over price, as a percentage. Null when price is unknown. */
  capRate: number | null;
  /** Annual cash flow over cash invested, as a percentage. */
  cashOnCash: number | null;
}

/**
 * The three numbers an investor actually asks for.
 *
 * CAP RATE EXCLUDES THE MORTGAGE, and that is the whole point of it — it
 * describes the property, so two buyers financing differently get the same
 * figure and can compare it against other buildings. Cash-on-cash includes the
 * mortgage, because it describes the deal. Folding debt service into the cap
 * rate is the single most common way this number is published wrong.
 *
 * Cash-on-cash is divided by cash actually invested, which is passed in rather
 * than assumed to be the down payment: closing costs and any up-front work are
 * money in the deal too, and dividing by the down payment alone flatters the
 * return.
 */
export const investmentReturns = (
  inputs: InvestmentInputs,
  cashInvested: number
): InvestmentReturns => {
  const {
    price,
    monthlyRent,
    vacancyRate,
    annualTaxes,
    annualInsurance,
    monthlyHoa,
    annualMaintenance,
    managementRate,
    monthlyPrincipalAndInterest,
    monthlyPmi = 0,
  } = inputs;

  // Vacancy is a haircut on gross rent, so a rate typed past 100 would invent
  // negative income rather than a fully empty unit.
  const vacancy = Math.min(Math.max(vacancyRate, 0), 100);
  const effectiveRent = Math.max(0, monthlyRent) * (1 - vacancy / 100);

  const operatingExpenses =
    Math.max(0, annualTaxes) / 12 +
    Math.max(0, annualInsurance) / 12 +
    Math.max(0, monthlyHoa) +
    Math.max(0, annualMaintenance) / 12 +
    // Management is charged on rent actually collected, not on asking rent.
    (effectiveRent * Math.min(Math.max(managementRate, 0), 100)) / 100;

  const noi = effectiveRent - operatingExpenses;
  const financingCost = Math.max(0, monthlyPrincipalAndInterest) + Math.max(0, monthlyPmi);
  const monthlyCashFlow = noi - financingCost;
  const annualCashFlow = monthlyCashFlow * 12;

  return {
    effectiveRent,
    operatingExpenses,
    noi,
    financingCost,
    monthlyCashFlow,
    annualCashFlow,
    capRate: price > 0 ? ((noi * 12) / price) * 100 : null,
    // Null rather than 0 when nothing was invested: an all-cash-free deal has
    // no return to express, and 0% would read as a bad one.
    cashOnCash: cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : null,
  };
};
