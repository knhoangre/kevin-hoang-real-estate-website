/**
 * What an investment property earns — every strategy on /investments.
 *
 * PURE: no network, no DOM, no React. Like valuation.ts it can be run by
 * scripts/investment-check.ts against cases whose answer was worked out by
 * hand, and that check is what keeps a cash flow from quietly drifting a few
 * hundred dollars a month the wrong way.
 *
 * REUSES, NEVER RE-DERIVES. The mortgage payment is mortgage.ts's, the cost of
 * selling is sellerProceeds.ts's (commission plus the Massachusetts deed
 * excise), and the buy-and-hold statement with its extra lines set to zero is
 * exactly investmentReturns() — the check asserts it — so the listing page's
 * calculator and this page cannot disagree about the same house.
 *
 * WHAT THIS DOES NOT MODEL, and the page says so: income tax and depreciation,
 * a 1031 exchange, appreciation, short-term rental, and the condition of a
 * house, which no field in the feed records.
 */
import { monthlyPayment } from './mortgage.ts';
import { sellerProceeds, type ProceedsBreakdown } from './sellerProceeds.ts';

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(Number.isFinite(n) ? n : 0, lo), hi);
const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/* ========================================================================== */
/* Buy and hold                                                               */
/* ========================================================================== */

export interface OperatingInputs {
  /** All units together, per month. */
  grossMonthlyRent: number;
  /** Parking, laundry, storage — per month. */
  otherMonthlyIncome: number;
  vacancyPct: number;
  /** On rent actually collected, not on asking rent. */
  managementPct: number;
  annualTaxes: number;
  annualInsurance: number;
  monthlyHoa: number;
  annualMaintenance: number;
  /** Capital reserve, as a share of gross rent. */
  capexPct: number;
  /** Utilities the owner pays — in a MA multi-family, usually water and sewer. */
  monthlyOwnerUtilities: number;
  /** Months of rent to a leasing broker per new lease (MA: the landlord's broker is the landlord's to pay). */
  leasingFeeMonths: number;
  /** New leases a year across the building, per unit-equivalent of gross rent. */
  turnoversPerYear: number;
  /** Anything else a year: registration, snow, a lead-compliance letter amortised. */
  otherAnnual: number;
}

export interface Line {
  key: string;
  label: string;
  monthly: number;
}

export interface OperatingStatement {
  gross: number;
  vacancyLoss: number;
  effective: number;
  lines: Line[];
  /** Operating expenses, monthly. Excludes debt service by definition. */
  opex: number;
  /** Net operating income, MONTHLY. */
  noi: number;
  /** The part of opex that does not move with how much rent is collected. */
  fixedOpex: number;
}

export const operatingStatement = (i: OperatingInputs): OperatingStatement => {
  const rent = pos(i.grossMonthlyRent);
  const gross = rent + pos(i.otherMonthlyIncome);
  const vacancyLoss = (gross * clamp(i.vacancyPct, 0, 100)) / 100;
  const effective = gross - vacancyLoss;
  const management = (effective * clamp(i.managementPct, 0, 100)) / 100;

  const lines: Line[] = [
    { key: 'management', label: 'Management', monthly: management },
    { key: 'taxes', label: 'Property taxes', monthly: pos(i.annualTaxes) / 12 },
    { key: 'insurance', label: 'Insurance', monthly: pos(i.annualInsurance) / 12 },
    { key: 'hoa', label: 'Condo / HOA fee', monthly: pos(i.monthlyHoa) },
    { key: 'maintenance', label: 'Maintenance', monthly: pos(i.annualMaintenance) / 12 },
    { key: 'capex', label: 'Capital reserve', monthly: (rent * clamp(i.capexPct, 0, 100)) / 100 },
    { key: 'utilities', label: 'Owner-paid utilities', monthly: pos(i.monthlyOwnerUtilities) },
    {
      key: 'leasing',
      label: 'Leasing fees',
      monthly: (rent * pos(i.leasingFeeMonths) * pos(i.turnoversPerYear)) / 12,
    },
    { key: 'other', label: 'Other', monthly: pos(i.otherAnnual) / 12 },
  ];
  const opex = lines.reduce((sum, l) => sum + l.monthly, 0);
  return { gross, vacancyLoss, effective, lines, opex, noi: effective - opex, fixedOpex: opex - management };
};

export interface LoanTerms {
  price: number;
  downPct: number;
  ratePct: number;
  termYears: number;
  /** Mortgage insurance, % of the loan a year; applied only above 80% loan-to-value. */
  pmiRatePct: number;
  /** Origination points, % of the loan. */
  pointsPct: number;
}

export interface Financing {
  downPayment: number;
  loan: number;
  monthlyPI: number;
  monthlyPmi: number;
  points: number;
}

export const financing = (t: LoanTerms): Financing => {
  const price = pos(t.price);
  const downPayment = (price * clamp(t.downPct, 0, 100)) / 100;
  const b = monthlyPayment({
    price,
    downPayment,
    rate: pos(t.ratePct),
    termYears: pos(t.termYears),
    annualTaxes: 0,
    annualInsurance: 0,
    monthlyHoa: 0,
    pmiRate: pos(t.pmiRatePct),
  });
  const loan = Math.max(0, price - downPayment);
  return { downPayment, loan, monthlyPI: b.principalAndInterest, monthlyPmi: b.pmi, points: (loan * pos(t.pointsPct)) / 100 };
};

export interface HoldResult {
  statement: OperatingStatement;
  financing: Financing;
  /** Principal and interest plus mortgage insurance, monthly. */
  debtService: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  /** Annual NOI over price, %. Describes the building, not the loan. */
  capRate: number | null;
  /** Every dollar put in: down payment, closing costs, points and up-front work. */
  cashInvested: number;
  cashOnCash: number | null;
  /** NOI over debt service. Lenders on rental loans usually want 1.2 or more. */
  dscr: number | null;
  /** Price over a year's gross rent. */
  grm: number | null;
  /** Monthly gross rent as a share of price — the "1% rule" figure. */
  rentToPricePct: number | null;
  /** The share of gross rent that must be collected to cover every cost. Over 100 means it cannot. */
  breakEvenOccupancyPct: number | null;
}

export const holdAnalysis = (
  op: OperatingInputs,
  loan: LoanTerms,
  acquisition: { closingCosts: number; upfrontRepairs: number }
): HoldResult => {
  const statement = operatingStatement(op);
  const f = financing(loan);
  const debtService = f.monthlyPI + f.monthlyPmi;
  const monthlyCashFlow = statement.noi - debtService;
  const cashInvested = f.downPayment + pos(acquisition.closingCosts) + f.points + pos(acquisition.upfrontRepairs);
  const price = pos(loan.price);
  const collectable = statement.gross * (1 - clamp(op.managementPct, 0, 100) / 100);
  return {
    statement,
    financing: f,
    debtService,
    monthlyCashFlow,
    annualCashFlow: monthlyCashFlow * 12,
    capRate: price > 0 ? ((statement.noi * 12) / price) * 100 : null,
    cashInvested,
    cashOnCash: cashInvested > 0 ? ((monthlyCashFlow * 12) / cashInvested) * 100 : null,
    dscr: debtService > 0 ? statement.noi / debtService : null,
    grm: statement.gross > 0 && price > 0 ? price / (statement.gross * 12) : null,
    rentToPricePct: statement.gross > 0 && price > 0 ? (statement.gross / price) * 100 : null,
    breakEvenOccupancyPct:
      collectable > 0 ? ((statement.fixedOpex + debtService) / collectable) * 100 : null,
  };
};

/* ========================================================================== */
/* Flip and BRRRR                                                              */
/* ========================================================================== */

export interface HardMoney {
  /** Of purchase plus renovation. */
  ltcPct: number;
  /** Cap, as a share of the after-repair value. */
  maxArvPct: number;
  ratePct: number;
  pointsPct: number;
  fees: number;
  /** Interest on the whole loan from day one, drawn or not. */
  dutchInterest: boolean;
}

export interface BridgeLoan {
  loan: number;
  /** Funded at closing, toward the purchase. */
  atClose: number;
  /** Held back and paid out in draws as the work is done. */
  holdback: number;
  interest: number;
  points: number;
  fees: number;
}

/**
 * A hard-money loan over a renovation.
 *
 * The purchase share is funded at closing; the renovation share is drawn as
 * the work is done, so on average half of it is outstanding during the work
 * and all of it after — unless the lender charges "Dutch" interest on the
 * whole commitment from the start, which some do and which costs real money.
 */
export const bridgeLoan = (
  price: number,
  rehab: number,
  arv: number,
  rehabMonths: number,
  holdMonths: number,
  hm: HardMoney
): BridgeLoan => {
  const loan = Math.max(
    0,
    Math.min((pos(price + rehab) * clamp(hm.ltcPct, 0, 100)) / 100, (pos(arv) * clamp(hm.maxArvPct, 0, 100)) / 100)
  );
  const atClose = Math.min(loan, (pos(price) * clamp(hm.ltcPct, 0, 100)) / 100);
  const holdback = loan - atClose;
  const monthly = pos(hm.ratePct) / 100 / 12;
  const work = Math.min(pos(rehabMonths), pos(holdMonths));
  const after = pos(holdMonths) - work;
  const interest = hm.dutchInterest
    ? loan * monthly * pos(holdMonths)
    : atClose * monthly * pos(holdMonths) + holdback * monthly * (work * 0.5 + after);
  return { loan, atClose, holdback, interest, points: (loan * pos(hm.pointsPct)) / 100, fees: pos(hm.fees) };
};

export interface SaleTerms {
  commissionPct: number;
  otherClosing: number;
  sellerCredits: number;
}

export type ProjectFinance = { kind: 'cash' } | { kind: 'hardMoney'; hm: HardMoney };

export interface FlipInputs {
  price: number;
  buyerClosing: number;
  /** Renovation including contingency. */
  rehab: number;
  rehabMonths: number;
  /** Purchase to sale, rehab included. */
  holdMonths: number;
  /** Taxes, insurance and utilities while the house is held. */
  monthlyCarry: number;
  arv: number;
  finance: ProjectFinance;
  sale: SaleTerms;
}

export interface FlipResult {
  loan: BridgeLoan | null;
  costLines: { key: string; label: string; amount: number }[];
  /** Everything spent, the cost of selling included. */
  projectCost: number;
  /** The investor's own money in before the sale. */
  cashIn: number;
  proceeds: ProceedsBreakdown;
  profit: number;
  roiPct: number | null;
  annualisedPct: number | null;
  /** The "70% rule": 70% of ARV less the renovation. A rule of thumb, labelled as one. */
  mao70: number;
}

export const flip = (i: FlipInputs): FlipResult => {
  const loan =
    i.finance.kind === 'hardMoney'
      ? bridgeLoan(i.price, i.rehab, i.arv, i.rehabMonths, i.holdMonths, i.finance.hm)
      : null;
  const carrying = pos(i.monthlyCarry) * pos(i.holdMonths);
  const proceeds = sellerProceeds({
    salePrice: pos(i.arv),
    mortgagePayoff: loan?.loan ?? 0,
    commissionRate: pos(i.sale.commissionPct),
    otherClosingCosts: pos(i.sale.otherClosing),
    sellerCredits: pos(i.sale.sellerCredits),
  });
  const costLines = [
    { key: 'price', label: 'Purchase price', amount: pos(i.price) },
    { key: 'closing', label: 'Buyer closing costs', amount: pos(i.buyerClosing) },
    { key: 'rehab', label: 'Renovation', amount: pos(i.rehab) },
    { key: 'carry', label: 'Holding costs', amount: carrying },
    { key: 'interest', label: 'Loan interest', amount: loan?.interest ?? 0 },
    { key: 'points', label: 'Loan points and fees', amount: (loan?.points ?? 0) + (loan?.fees ?? 0) },
    { key: 'sale', label: 'Cost of selling', amount: proceeds.costOfSale },
  ];
  const projectCost = costLines.reduce((s, l) => s + l.amount, 0);
  const beforeSale = projectCost - proceeds.costOfSale;
  const cashIn = Math.max(0, beforeSale - (loan?.loan ?? 0));
  const profit = pos(i.arv) - projectCost;
  const roi = cashIn > 0 ? profit / cashIn : null;
  return {
    loan,
    costLines,
    projectCost,
    cashIn,
    proceeds,
    profit,
    roiPct: roi === null ? null : roi * 100,
    annualisedPct:
      roi === null || i.holdMonths <= 0 || roi <= -1 ? null : (Math.pow(1 + roi, 12 / i.holdMonths) - 1) * 100,
    mao70: 0.7 * pos(i.arv) - pos(i.rehab),
  };
};

export interface RefiInputs {
  program: 'conventional' | 'dscr';
  units: number;
  /** Months from purchase to the refinance. */
  monthsOnTitle: number;
  /** How the purchase was paid for — decides which refinance is possible. */
  acquisition: 'cash' | 'hardMoney';
  /** Loan-to-value for a cash-out; conventional defaults to Fannie Mae's 75% / 70%. */
  ltvPct: number;
  ratePct: number;
  termYears: number;
  closingPct: number;
  /** Fannie Mae's rules, passed in so the page can show them with their sources. */
  rules: { titleMonths: number; noteMonths: number };
}

export interface RefiResult {
  kind: 'cash-out' | 'delayed-financing' | 'limited-cash-out';
  maxLoan: number;
  newLoan: number;
  closingCosts: number;
  /** What the borrower receives after the old loan and the costs, before anything else. */
  cashToBorrower: number;
  reason: string;
}

/**
 * The refinance at the end of a BRRRR, under Fannie Mae's rules.
 *
 *   cash purchase, at least six months on title      cash-out, up to the LTV
 *   cash purchase, sooner                            delayed financing: also capped
 *                                                    at what was paid for the house
 *   bought with a loan under twelve months old       limited cash-out: the old loan
 *                                                    and costs, plus at most the
 *                                                    lesser of 2% or $2,000
 *   bought with a loan at least twelve months old    cash-out
 *
 * A DSCR loan (qualified on the rent, not the borrower's income) follows its
 * lender's own rules, so it takes the LTV the investor enters and no seasoning.
 */
export const refinance = (
  arv: number,
  payoff: number,
  purchaseAndClosing: number,
  r: RefiInputs
): RefiResult => {
  const ltvLoan = (pos(arv) * clamp(r.ltvPct, 0, 100)) / 100;
  const cp = clamp(r.closingPct, 0, 50) / 100;
  const cashOut = (maxLoan: number, kind: RefiResult['kind'], reason: string): RefiResult => {
    const closingCosts = maxLoan * cp;
    return { kind, maxLoan, newLoan: maxLoan, closingCosts, cashToBorrower: maxLoan - pos(payoff) - closingCosts, reason };
  };

  if (r.program === 'dscr') return cashOut(ltvLoan, 'cash-out', 'A rental (DSCR) loan, on the lender’s own terms.');

  if (r.acquisition === 'cash') {
    if (r.monthsOnTitle >= r.rules.titleMonths) {
      return cashOut(ltvLoan, 'cash-out', `Bought with cash and on title ${r.rules.titleMonths} months: a cash-out refinance.`);
    }
    return cashOut(
      Math.min(ltvLoan, pos(purchaseAndClosing)),
      'delayed-financing',
      `Bought with cash less than ${r.rules.titleMonths} months ago: delayed financing, which cannot exceed what was paid for the house plus closing costs.`
    );
  }

  if (r.monthsOnTitle >= r.rules.noteMonths) {
    return cashOut(ltvLoan, 'cash-out', `The purchase loan is ${r.rules.noteMonths} months old: a cash-out refinance.`);
  }
  // Limited cash-out: the old loan, the costs, and at most the lesser of 2% or $2,000.
  const capped = (pos(payoff) + 2000) / (1 - cp);
  let newLoan = capped * 0.02 >= 2000 ? capped : pos(payoff) / (1 - cp - 0.02);
  newLoan = Math.min(newLoan, ltvLoan);
  const closingCosts = newLoan * cp;
  return {
    kind: 'limited-cash-out',
    maxLoan: ltvLoan,
    newLoan,
    closingCosts,
    cashToBorrower: newLoan - pos(payoff) - closingCosts,
    reason: `The purchase loan is under ${r.rules.noteMonths} months old, so only a limited cash-out refinance is possible: it repays the loan and costs, and returns at most the lesser of 2% or $2,000.`,
  };
};

export interface BrrrrResult {
  flip: FlipResult;
  /** The investor's own money in, through the renovation. */
  cashIn: number;
  refi: RefiResult;
  /** What stays in the deal after the refinance. Zero or less means every dollar came back. */
  cashLeftIn: number;
  equityAfter: number;
  after: HoldResult;
  /** Annual cash flow over the cash left in; null when none is left — "all cash back". */
  cashOnCashAfter: number | null;
}

/**
 * Buy, renovate, rent, refinance — and what is left in the deal at the end.
 *
 * The purchase and renovation are the flip's, with no sale: the refinance takes
 * the sale's place, and the hold after it is a buy-and-hold on the new loan.
 */
export const brrrr = (
  project: Omit<FlipInputs, 'sale'>,
  refi: RefiInputs,
  rentAfter: OperatingInputs
): BrrrrResult => {
  const f = flip({ ...project, sale: { commissionPct: 0, otherClosing: 0, sellerCredits: 0 } });
  const cashIn = f.cashIn;
  const payoff = f.loan?.loan ?? 0;
  const r = refinance(project.arv, payoff, pos(project.price) + pos(project.buyerClosing), refi);
  const cashLeftIn = cashIn - r.cashToBorrower;
  const after = holdAnalysis(
    rentAfter,
    {
      price: pos(project.arv),
      downPct: project.arv > 0 ? Math.max(0, 100 - (r.newLoan / project.arv) * 100) : 100,
      ratePct: refi.ratePct,
      termYears: refi.termYears,
      pmiRatePct: 0,
      pointsPct: 0,
    },
    { closingCosts: 0, upfrontRepairs: 0 }
  );
  return {
    flip: f,
    cashIn,
    refi: r,
    cashLeftIn,
    equityAfter: pos(project.arv) - r.newLoan,
    after,
    cashOnCashAfter: cashLeftIn > 0 ? (after.annualCashFlow / cashLeftIn) * 100 : null,
  };
};

/** The same calculation with one thing changed at a time: what moves the answer. */
export const sensitivity = <T>(
  run: (x: T) => number,
  base: T,
  tweaks: { label: string; apply: (x: T) => T }[]
): { label: string; value: number; delta: number }[] => {
  const baseline = run(base);
  return tweaks.map((t) => {
    const value = run(t.apply(base));
    return { label: t.label, value, delta: value - baseline };
  });
};

/* ========================================================================== */
/* Teardown and build                                                          */
/* ========================================================================== */

/**
 * Interest on a construction loan.
 *
 * The land share is outstanding for the whole term. The construction share is
 * drawn as the house goes up — on average half of it during the build — and all
 * of it while the finished house is for sale.
 */
export const constructionInterest = (
  loan: number,
  landLoan: number,
  ratePct: number,
  buildMonths: number,
  saleMonths: number,
  holdBeforeBuildMonths = 0
): number => {
  const monthly = pos(ratePct) / 100 / 12;
  const construction = Math.max(0, pos(loan) - pos(landLoan));
  const term = pos(holdBeforeBuildMonths) + pos(buildMonths) + pos(saleMonths);
  return (
    pos(landLoan) * monthly * term +
    construction * monthly * (pos(buildMonths) * 0.5 + pos(saleMonths))
  );
};

export interface BuildInputs {
  price: number;
  buyerClosing: number;
  demolition: number;
  /** Utility disconnects, the demolition permit, the asbestos survey and any abatement. */
  demoExtras: number;
  newSqft: number;
  hardPerSqft: number;
  siteWork: number;
  /** Architect, engineer, survey, permits — a share of hard cost. */
  softPct: number;
  contingencyPct: number;
  loan: { ltcPct: number; ratePct: number; pointsPct: number; financeLand: boolean };
  months: { permitting: number; delay: number; build: number; sale: number };
  /** Taxes, insurance (builder's risk) and utilities while held, per month. */
  monthlyCarry: number;
  exitPrice: number;
  sale: SaleTerms;
}

export interface BuildResult {
  costLines: { key: string; label: string; amount: number }[];
  loan: number;
  interest: number;
  points: number;
  months: number;
  /** Everything spent, the cost of selling included. */
  totalCost: number;
  cashIn: number;
  proceeds: ProceedsBreakdown;
  profit: number;
  marginOnCostPct: number | null;
  roiPct: number | null;
  annualisedPct: number | null;
}

export const build = (i: BuildInputs): BuildResult => {
  const land = pos(i.price) + pos(i.buyerClosing);
  const demo = pos(i.demolition) + pos(i.demoExtras);
  const hard = pos(i.newSqft) * pos(i.hardPerSqft) + pos(i.siteWork);
  const soft = (hard * clamp(i.softPct, 0, 100)) / 100;
  const contingency = ((hard + demo) * clamp(i.contingencyPct, 0, 100)) / 100;
  const construction = demo + hard + soft + contingency;

  const ltc = clamp(i.loan.ltcPct, 0, 100) / 100;
  const landLoan = i.loan.financeLand ? land * ltc : 0;
  const loan = landLoan + construction * ltc;
  const before = pos(i.months.permitting) + pos(i.months.delay);
  const months = before + pos(i.months.build) + pos(i.months.sale);
  const interest = constructionInterest(loan, landLoan, i.loan.ratePct, i.months.build, i.months.sale, before);
  const points = (loan * pos(i.loan.pointsPct)) / 100;
  const carrying = pos(i.monthlyCarry) * months;

  const proceeds = sellerProceeds({
    salePrice: pos(i.exitPrice),
    mortgagePayoff: loan,
    commissionRate: pos(i.sale.commissionPct),
    otherClosingCosts: pos(i.sale.otherClosing),
    sellerCredits: pos(i.sale.sellerCredits),
  });

  const costLines = [
    { key: 'land', label: 'Purchase and closing', amount: land },
    { key: 'demo', label: 'Demolition', amount: demo },
    { key: 'hard', label: 'Construction', amount: hard },
    { key: 'soft', label: 'Design, engineering and permits', amount: soft },
    { key: 'contingency', label: 'Contingency', amount: contingency },
    { key: 'interest', label: 'Loan interest and points', amount: interest + points },
    { key: 'carry', label: 'Holding costs', amount: carrying },
    { key: 'sale', label: 'Cost of selling', amount: proceeds.costOfSale },
  ];
  const totalCost = costLines.reduce((s, l) => s + l.amount, 0);
  const cashIn = Math.max(0, totalCost - proceeds.costOfSale - loan);
  const profit = pos(i.exitPrice) - totalCost;
  const roi = cashIn > 0 ? profit / cashIn : null;
  return {
    costLines,
    loan,
    interest,
    points,
    months,
    totalCost,
    cashIn,
    proceeds,
    profit,
    marginOnCostPct: totalCost > 0 ? (profit / totalCost) * 100 : null,
    roiPct: roi === null ? null : roi * 100,
    annualisedPct: roi === null || months <= 0 || roi <= -1 ? null : (Math.pow(1 + roi, 12 / months) - 1) * 100,
  };
};

/* ========================================================================== */
/* An accessory dwelling unit                                                  */
/* ========================================================================== */

/**
 * The largest ADU allowed by right: 900 square feet or half the gross floor
 * area of the house, whichever is smaller (760 CMR 71.00, effective
 * 2025-02-02). The floor area is the assessor's gross building area where the
 * parcel was found, else the listing's living area, and the page says which.
 */
export const aduMaxSqft = (mainGrossArea: number): number =>
  Math.max(0, Math.min(900, Math.floor(pos(mainGrossArea) / 2)));

export interface AduResult {
  maxSqft: number;
  cost: number;
  statement: OperatingStatement;
  /** Annual NOI over cost, %. */
  yieldOnCostPct: number | null;
  paybackYears: number | null;
}

export const adu = (i: {
  mainGrossArea: number;
  sqft: number;
  perSqft: number;
  /** Utility connections, permits, design — the costs that do not scale with size. */
  fixed: number;
  op: OperatingInputs;
}): AduResult => {
  const cost = pos(i.sqft) * pos(i.perSqft) + pos(i.fixed);
  const statement = operatingStatement(i.op);
  const annual = statement.noi * 12;
  return {
    maxSqft: aduMaxSqft(i.mainGrossArea),
    cost,
    statement,
    yieldOnCostPct: cost > 0 ? (annual / cost) * 100 : null,
    paybackYears: annual > 0 ? cost / annual : null,
  };
};

/* ========================================================================== */
/* Signals in a listing                                                        */
/* ========================================================================== */

export interface Flag {
  key: string;
  label: string;
  /** Why: the listing's own words, or the field it came from. */
  detail: string;
}

/**
 * Words in the listing agent's remarks that say something about condition or
 * opportunity, matched as whole words and quoted back exactly as written.
 * "Real estate taxes" is not an estate sale, and "as is" inside "has issues" is
 * not "as-is": every pattern is anchored at word boundaries.
 */
const REMARK_FLAGS: { key: string; label: string; re: RegExp }[] = [
  { key: 'as-is', label: 'Sold as-is', re: /\bas[\s-]is\b/i },
  { key: 'tlc', label: 'Needs TLC', re: /\btlc\b/i },
  { key: 'needs-work', label: 'Needs work', re: /\bneeds?\s+(?:some\s+|a\s+little\s+)?(?:work|updating|updates|renovation|love|repairs?)\b/i },
  { key: 'handyman', label: 'Handyman special', re: /\bhandy\s?man\b/i },
  { key: 'contractor', label: 'Contractor special', re: /\bcontractor'?s?\s+special\b/i },
  { key: 'fixer', label: 'Fixer-upper', re: /\bfixer[\s-]?upper\b/i },
  { key: 'estate', label: 'Estate sale', re: /\bestate\s+sale\b/i },
  { key: 'probate', label: 'Probate', re: /\bprobate\b/i },
  { key: 'investor', label: 'Marketed to investors', re: /\binvestors?\b/i },
  { key: 'teardown', label: 'Teardown', re: /\btear[\s-]?down\b/i },
  { key: 'builder', label: 'Builder / developer', re: /\b(?:builders?|developers?|development\s+(?:opportunity|potential))\b/i },
  { key: 'subdivide', label: 'Subdivision mentioned', re: /\bsub-?divi(?:de|dable|sion|ded)\b/i },
  { key: 'adu', label: 'ADU / in-law mentioned', re: /\b(?:adu|in-?law)\b/i },
  { key: 'cash', label: 'Cash buyers only', re: /\bcash\s+(?:buyers?\s+)?only\b/i },
];

export const remarkFlags = (remarks: string | null): Flag[] => {
  if (!remarks) return [];
  const out: Flag[] = [];
  for (const f of REMARK_FLAGS) {
    const m = remarks.match(f.re);
    if (m) out.push({ key: f.key, label: f.label, detail: `Remarks: “${m[0]}”` });
  }
  return out;
};

/**
 * Whether a listing is a home somebody could rent. Parking spaces and storage
 * units are listed as condos, with no bathroom and no floor area; one ranked
 * first in Newton on 2026-10-20 with a studio's rent and a 6% cap rate.
 */
export const isDwelling = (l: { full_baths: number | null; living_area: number | null }): boolean =>
  !(l.full_baths === 0 && !(l.living_area && l.living_area > 0));

/** A tax bill is usable unless the feed marks it with an impossible year (9999 occurs). */
export const usableTaxes = (l: { taxes: number | null; tax_year: number | null }): number | null =>
  l.taxes !== null && l.taxes > 0 && (l.tax_year === null || l.tax_year < 2100) ? l.taxes : null;

/** Before 1978, the Massachusetts Lead Law applies the moment a child under six lives there. */
export const LEAD_LAW_YEAR = 1978;

/**
 * What the listing's own fields say an investor should budget for. The labels
 * come in already decoded (idxDecode.ts), because the codes differ by property
 * type: oil heat is "M" on a single-family and "H" on a multi-family.
 */
export const fieldFlags = (l: {
  year_built: number | null;
  heatingLabel: string | null;
  sewerLabel: string | null;
  price_cut?: boolean | null;
}): Flag[] => {
  const out: Flag[] = [];
  if (l.year_built && l.year_built > 1700 && l.year_built < LEAD_LAW_YEAR) {
    out.push({ key: 'lead', label: 'Lead law', detail: `Built ${l.year_built}, before 1978` });
  }
  // Every SEWER label that means an on-site system: "Private Sewerage", "Tight
  // Tank", "Pumice Wick", "Rock/Reed", and "Inspection Required for Sale",
  // which is Title V by another name.
  if (l.sewerLabel && /private|septic|tight tank|pumice|rock\/reed|inspection required/i.test(l.sewerLabel)) {
    out.push({ key: 'septic', label: 'Septic (Title V)', detail: `Sewer: ${l.sewerLabel}` });
  }
  if (l.heatingLabel && /\boil\b/i.test(l.heatingLabel)) {
    out.push({ key: 'oil', label: 'Oil heat', detail: `Heating: ${l.heatingLabel}` });
  }
  if (l.price_cut) out.push({ key: 'price-cut', label: 'Price cut', detail: 'The asking price has been reduced' });
  return out;
};

/* ========================================================================== */
/* The screener                                                                */
/* ========================================================================== */

export interface ScreenDefaults {
  vacancyPct: number;
  managementPct: number;
  maintenancePctOfPrice: number;
  capexPct: number;
  leasingFeeMonths: number;
  turnoversPerYear: number;
  landlordInsuranceFactor: number;
  ownerUtilitiesPerUnit: number;
  downPct: number;
  ratePct: number;
  termYears: number;
  pmiRatePct: number;
  buyerClosingPct: number;
}

export interface ScreenInput {
  price: number | null;
  propType: string | null;
  taxes: number | null;
  /** True when the listing says there is an association. */
  hoa: boolean | null;
  hoaFee: number | null;
  units: number;
  /** Gross monthly rent for the whole building, or null with no rent evidence. */
  grossRent: number | null;
  /** The homeowner insurance estimate, before the landlord factor. */
  homeInsurance: number;
  assessedTotal: number | null;
  landShare: number | null;
  /** False for a parking space or storage unit — see isDwelling. */
  dwelling?: boolean;
}

export interface ScreenMetrics {
  capRate: number | null;
  monthlyCashFlow: number | null;
  cashOnCash: number | null;
  grm: number | null;
  /** Asking over the assessor's total value. Under 1 is asking below assessment. */
  priceToAssessed: number | null;
  landShare: number | null;
  /** Why a figure is missing, when one is. */
  missing: string[];
}

/**
 * The few numbers each card in the screener sorts by, at the default
 * assumptions. A listing with no rent evidence, no tax bill or an association
 * with no fee listed gets NO cap rate rather than a flattering one — and sorts
 * last, with the reason on the card.
 */
export const screenMetrics = (s: ScreenInput, d: ScreenDefaults): ScreenMetrics => {
  const missing: string[] = [];
  const price = s.price !== null && s.price >= 10_000 ? s.price : null;
  if (price === null) missing.push('no usable asking price');
  if (s.dwelling === false) missing.push('no bathroom or floor area on the listing — parking or storage, not a home');
  else if (s.grossRent === null) missing.push('not enough leases to estimate rent');
  if (s.taxes === null) missing.push('no tax bill on the listing');
  if (s.hoa && (s.hoaFee === null || s.hoaFee <= 0)) missing.push('association fee not listed');

  const priceToAssessed = price !== null && s.assessedTotal ? price / s.assessedTotal : null;
  if (missing.length) {
    return {
      capRate: null,
      monthlyCashFlow: null,
      cashOnCash: null,
      grm: price !== null && s.grossRent ? price / (s.grossRent * 12) : null,
      priceToAssessed,
      landShare: s.landShare,
      missing,
    };
  }
  const p = price as number;
  const result = holdAnalysis(
    {
      grossMonthlyRent: s.grossRent as number,
      otherMonthlyIncome: 0,
      vacancyPct: d.vacancyPct,
      managementPct: d.managementPct,
      annualTaxes: s.taxes as number,
      annualInsurance: s.homeInsurance * d.landlordInsuranceFactor,
      monthlyHoa: s.hoa ? s.hoaFee ?? 0 : 0,
      annualMaintenance: (p * d.maintenancePctOfPrice) / 100,
      capexPct: d.capexPct,
      monthlyOwnerUtilities: s.propType === 'MF' ? d.ownerUtilitiesPerUnit * s.units : 0,
      leasingFeeMonths: d.leasingFeeMonths,
      turnoversPerYear: d.turnoversPerYear,
      otherAnnual: 0,
    },
    { price: p, downPct: d.downPct, ratePct: d.ratePct, termYears: d.termYears, pmiRatePct: d.pmiRatePct, pointsPct: 0 },
    { closingCosts: (p * d.buyerClosingPct) / 100, upfrontRepairs: 0 }
  );
  return {
    capRate: result.capRate,
    monthlyCashFlow: result.monthlyCashFlow,
    cashOnCash: result.cashOnCash,
    grm: result.grm,
    priceToAssessed,
    landShare: s.landShare,
    missing,
  };
};

/** Sort with nulls last, whichever way the numbers run. */
export const byMetric =
  <T>(get: (x: T) => number | null, direction: 'asc' | 'desc') =>
  (a: T, b: T): number => {
    const x = get(a);
    const y = get(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return direction === 'asc' ? x - y : y - x;
  };
