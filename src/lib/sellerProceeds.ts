/**
 * What a seller walks away with — the arithmetic behind the "selling" view of
 * the calculator, on /calculator, /vi/cong-cu-tinh-toan and every listing page.
 *
 * Pure and dependency-free, like @/lib/mortgage beside it, so the one formula is
 * shared by every rendering of it rather than copied into each.
 *
 * WHAT IS MODELLED: commission, the Massachusetts deed excise, the seller's
 * other closing costs, repairs or credits agreed with the buyer, and the
 * mortgage payoff. WHAT IS NOT: prorated property tax and the final water and
 * sewer bill (adjustments settled line by line on the closing statement),
 * capital gains tax, and any prepayment penalty. The UI names every one of
 * those rather than folding a guess into the total.
 */

/**
 * The Massachusetts deeds excise, per $500 of consideration or fraction of it.
 *
 * $2.00 under M.G.L. c.64D §1, plus the 14% surtax, is $2.28 — the rate the
 * Department of Revenue states in Directive 95-4. It applies when the price
 * exceeds $100. By long-standing Massachusetts practice the SELLER pays it; the
 * statute taxes the deed without saying which party, and the standard purchase
 * and sale agreement assigns it to the seller.
 *
 * BARNSTABLE COUNTY (Cape Cod) HAS ITS OWN RATE, and the official sources
 * disagree on what it currently is, so it is not modelled: the UI tells a Cape
 * seller to take the figure from their attorney instead. Every town this site
 * serves is outside Barnstable County.
 *
 * Checked 2026-09-27 against malegislature.gov (c.64D §1) and mass.gov
 * (Directive 95-4).
 */
export const DEED_EXCISE_PER_500 = 2.28;

export const deedExcise = (price: number): number =>
  price > 100 ? Math.ceil(price / 500) * DEED_EXCISE_PER_500 : 0;

export interface ProceedsInputs {
  salePrice: number;
  /** What is still owed on every mortgage and line of credit on the house. */
  mortgagePayoff: number;
  /** Total commission, as a percentage of the sale price. */
  commissionRate: number;
  /** Attorney, smoke certificate, discharge recording and the rest. */
  otherClosingCosts: number;
  /** Repairs the seller pays for, or credits given to the buyer at closing. */
  sellerCredits: number;
}

export interface ProceedsBreakdown {
  commission: number;
  deedExcise: number;
  otherClosingCosts: number;
  sellerCredits: number;
  /** Everything the sale costs, before the mortgage is paid off. */
  costOfSale: number;
  /** The price less the cost of the sale — the equity, before the payoff. */
  beforePayoff: number;
  mortgagePayoff: number;
  /** What reaches the seller. Negative when the house is worth less than owed. */
  net: number;
}

export const sellerProceeds = ({
  salePrice,
  mortgagePayoff,
  commissionRate,
  otherClosingCosts,
  sellerCredits,
}: ProceedsInputs): ProceedsBreakdown => {
  // Clamped at zero: every input here is a field someone types into, and a
  // negative commission or a negative payoff would quietly RAISE the total.
  const price = Math.max(0, salePrice);
  const commission = (price * Math.max(0, commissionRate)) / 100;
  const excise = deedExcise(price);
  const other = Math.max(0, otherClosingCosts);
  const credits = Math.max(0, sellerCredits);
  const payoff = Math.max(0, mortgagePayoff);

  const costOfSale = commission + excise + other + credits;
  const beforePayoff = price - costOfSale;
  return {
    commission,
    deedExcise: excise,
    otherClosingCosts: other,
    sellerCredits: credits,
    costOfSale,
    beforePayoff,
    mortgagePayoff: payoff,
    net: beforePayoff - payoff,
  };
};
