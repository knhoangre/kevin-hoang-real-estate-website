/**
 * One home's analysis: every input of every tab, as one document.
 *
 * PURE. The deal view holds one Scenario in state and every tab reads and
 * writes it — so the price an investor types on the rental tab is the price
 * the flip uses, and a renovation scoped once is the renovation every strategy
 * pays for. It is also exactly what "Save this analysis" stores, as one jsonb
 * column, which makes this file the contract for that column the way
 * rentalApplication.ts is for an application's.
 *
 * `hydrateScenario` lays a stored document over a freshly seeded one field by
 * field, keeping a stored value only where its type matches — so an analysis
 * saved before a field existed still opens, and the new field takes today's
 * seed rather than nothing.
 */
import type { FlipInputs, HardMoney, OperatingInputs } from './investment.ts';
import { ASSUMPTIONS, investorRate } from './investmentAssumptions.ts';
import { scopeTotal, type CostItem, type Scope, type ScopeLine, type Tier } from './rehabCosts.ts';
import { SITE } from './siteConfig.ts';
import type { Valuation } from './valuation.ts';

export type DealTab = 'hold' | 'flip' | 'brrrr';

export interface Scenario {
  version: 1;
  tab: DealTab;
  price: number;
  closingCosts: number;
  /** The rental loan: buy-and-hold's, and the one a BRRRR refinances into is separate. */
  loan: { downPct: number; ratePct: number; termYears: number; pointsPct: number };
  liveInOne: boolean;
  /** Monthly rent per unit; one entry for a house or condo. */
  rents: number[];
  otherIncome: number;
  vacancyPct: number;
  managementPct: number;
  annualTaxes: number;
  annualInsurance: number;
  monthlyHoa: number;
  annualMaintenance: number;
  capexPct: number;
  ownerUtilities: number;
  leasingFeeMonths: number;
  turnovers: number;
  upfrontRepairs: number;
  scope: Scope;
  /** After-repair value: what the house sells or appraises for once the work is done. */
  arv: number;
  project: {
    rehabMonths: number;
    /** Purchase to sale, for a flip. */
    flipMonths: number;
    /** Purchase to refinance, for a BRRRR. */
    refiMonths: number;
    monthlyUtilities: number;
    finance: 'cash' | 'hardMoney';
    hm: HardMoney;
  };
  sale: { commissionPct: number; otherClosing: number; sellerCredits: number };
  refi: { program: 'conventional' | 'dscr'; ltvPct: number; ratePct: number; termYears: number; closingPct: number };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (stored: unknown, fallback: number) =>
  typeof stored === 'number' && Number.isFinite(stored) ? stored : fallback;
const bool = (stored: unknown, fallback: boolean) => (typeof stored === 'boolean' ? stored : fallback);
const oneOf = <T extends string>(stored: unknown, allowed: readonly T[], fallback: T): T =>
  typeof stored === 'string' && (allowed as readonly string[]).includes(stored) ? (stored as T) : fallback;

/** Every numeric field of a flat object, stored over seed. */
const numbers = <T extends Record<string, number>>(stored: unknown, seed: T): T => {
  const s = isObject(stored) ? stored : {};
  const out = { ...seed };
  for (const k of Object.keys(seed) as (keyof T)[]) out[k] = num(s[k as string], seed[k]) as T[keyof T];
  return out;
};

const TIERS: readonly Tier[] = ['low', 'mid', 'high'];

/** A stored scope's lines laid over the seeded ones, by key; lines the book has since dropped are dropped. */
const hydrateScope = (stored: unknown, seed: Scope): Scope => {
  if (!isObject(stored)) return seed;
  const byKey = new Map<string, Record<string, unknown>>();
  if (Array.isArray(stored.lines)) {
    for (const l of stored.lines) if (isObject(l) && typeof l.key === 'string') byKey.set(l.key, l);
  }
  return {
    contingencyPct: num(stored.contingencyPct, seed.contingencyPct),
    lines: seed.lines.map((line): ScopeLine => {
      const s = byKey.get(line.key);
      if (!s) return line;
      const amount = typeof s.amount === 'number' && Number.isFinite(s.amount) && s.amount >= 0 ? s.amount : undefined;
      return {
        key: line.key,
        on: bool(s.on, line.on),
        qty: num(s.qty, line.qty),
        tier: oneOf(s.tier, TIERS, line.tier),
        reason: line.reason,
        ...(amount !== undefined ? { amount } : {}),
      };
    }),
  };
};

export const hydrateScenario = (stored: unknown, seed: Scenario): Scenario => {
  if (!isObject(stored)) return seed;
  const p = isObject(stored.project) ? stored.project : {};
  const rents =
    Array.isArray(stored.rents) && stored.rents.length === seed.rents.length && stored.rents.every((r) => typeof r === 'number' && Number.isFinite(r))
      ? (stored.rents as number[])
      : seed.rents;
  return {
    version: 1,
    tab: oneOf(stored.tab, ['hold', 'flip', 'brrrr'] as const, seed.tab),
    price: num(stored.price, seed.price),
    closingCosts: num(stored.closingCosts, seed.closingCosts),
    loan: numbers(stored.loan, seed.loan),
    liveInOne: bool(stored.liveInOne, seed.liveInOne),
    rents,
    otherIncome: num(stored.otherIncome, seed.otherIncome),
    vacancyPct: num(stored.vacancyPct, seed.vacancyPct),
    managementPct: num(stored.managementPct, seed.managementPct),
    annualTaxes: num(stored.annualTaxes, seed.annualTaxes),
    annualInsurance: num(stored.annualInsurance, seed.annualInsurance),
    monthlyHoa: num(stored.monthlyHoa, seed.monthlyHoa),
    annualMaintenance: num(stored.annualMaintenance, seed.annualMaintenance),
    capexPct: num(stored.capexPct, seed.capexPct),
    ownerUtilities: num(stored.ownerUtilities, seed.ownerUtilities),
    leasingFeeMonths: num(stored.leasingFeeMonths, seed.leasingFeeMonths),
    turnovers: num(stored.turnovers, seed.turnovers),
    upfrontRepairs: num(stored.upfrontRepairs, seed.upfrontRepairs),
    scope: hydrateScope(stored.scope, seed.scope),
    arv: num(stored.arv, seed.arv),
    project: {
      rehabMonths: num(p.rehabMonths, seed.project.rehabMonths),
      flipMonths: num(p.flipMonths, seed.project.flipMonths),
      refiMonths: num(p.refiMonths, seed.project.refiMonths),
      monthlyUtilities: num(p.monthlyUtilities, seed.project.monthlyUtilities),
      finance: oneOf(p.finance, ['cash', 'hardMoney'] as const, seed.project.finance),
      hm: {
        ...numbers(
          isObject(p.hm) ? p.hm : {},
          {
            ltcPct: seed.project.hm.ltcPct,
            maxArvPct: seed.project.hm.maxArvPct,
            ratePct: seed.project.hm.ratePct,
            pointsPct: seed.project.hm.pointsPct,
            fees: seed.project.hm.fees,
          }
        ),
        dutchInterest: bool(isObject(p.hm) ? p.hm.dutchInterest : undefined, seed.project.hm.dutchInterest),
      },
    },
    sale: numbers(stored.sale, seed.sale),
    refi: {
      program: oneOf(isObject(stored.refi) ? stored.refi.program : undefined, ['conventional', 'dscr'] as const, seed.refi.program),
      ...numbers(isObject(stored.refi) ? stored.refi : {}, {
        ltvPct: seed.refi.ltvPct,
        ratePct: seed.refi.ratePct,
        termYears: seed.refi.termYears,
        closingPct: seed.refi.closingPct,
      }),
    },
  };
};

/**
 * A new analysis of one home, before the investor has touched anything: the
 * listing's own numbers, the leased rents, the cost book's suggested scope,
 * the comps' after-repair value when there is an honest one, and the dated
 * assumptions for everything else.
 */
export const seedScenario = (x: {
  price: number;
  propType: string | null;
  hoaFee: number | null;
  taxes: number | null;
  /** The homeowner estimate (mortgage.ts), before the landlord factor. */
  homeInsurance: number;
  units: number;
  rents: number[];
  scope: Scope;
  arv: number | null;
}): Scenario => {
  const a = ASSUMPTIONS;
  const rate = investorRate();
  const rehabMonths = a.rehabMonths.value;
  return {
    version: 1,
    tab: 'hold',
    price: x.price,
    closingCosts: Math.round((x.price * a.buyerClosingPct.value) / 100),
    loan: { downPct: a.investorDownPct.value, ratePct: rate, termYears: 30, pointsPct: 0 },
    liveInOne: false,
    rents: x.rents,
    otherIncome: 0,
    vacancyPct: a.vacancyPct.value,
    managementPct: a.managementPct.value,
    annualTaxes: x.taxes ?? 0,
    annualInsurance: Math.round(x.homeInsurance * a.landlordInsuranceFactor.value),
    monthlyHoa: x.hoaFee ?? 0,
    annualMaintenance: Math.round((x.price * a.maintenancePctOfPrice.value) / 100),
    capexPct: a.capexPctOfRent.value,
    ownerUtilities: x.propType === 'MF' ? a.ownerUtilitiesPerUnit.value * x.units : 0,
    leasingFeeMonths: a.leasingFeeMonths.value,
    turnovers: a.turnoversPerYear.value,
    upfrontRepairs: 0,
    scope: x.scope,
    arv: x.arv ?? 0,
    project: {
      rehabMonths,
      flipMonths: rehabMonths + a.saleMonths.value,
      refiMonths: Math.max(rehabMonths + 1, a.refiTitleMonths.value),
      monthlyUtilities: a.rehabUtilitiesMonthly.value,
      finance: 'hardMoney',
      hm: {
        ltcPct: a.hardMoneyLtcPct.value,
        maxArvPct: a.hardMoneyMaxArvPct.value,
        ratePct: a.hardMoneyRatePct.value,
        pointsPct: a.hardMoneyPointsPct.value,
        fees: a.hardMoneyFees.value,
        dutchInterest: false,
      },
    },
    sale: { commissionPct: SITE.assumedSellerCommissionRate, otherClosing: a.sellerOtherClosing.value, sellerCredits: 0 },
    refi: {
      program: 'conventional',
      ltvPct: x.units > 1 ? a.refiLtvMultiUnitPct.value : a.refiLtvOneUnitPct.value,
      ratePct: rate,
      termYears: 30,
      closingPct: a.refiClosingPct.value,
    },
  };
};

/** Taxes, insurance and utilities while a house is held empty for work, per month. */
export const monthlyCarry = (s: Scenario): number =>
  Math.max(0, s.annualTaxes) / 12 + Math.max(0, s.annualInsurance) / 12 + Math.max(0, s.project.monthlyUtilities) + Math.max(0, s.monthlyHoa);

/**
 * The few numbers that say what an investor was thinking, for Kevin's list:
 * their price, their rent, their after-repair value, and how much work they
 * scoped. Read defensively — this is a stored document, possibly old.
 */
export const summarizeScenario = (
  stored: unknown
): { price: number | null; rent: number | null; arv: number | null; tab: DealTab | null } => {
  if (!isObject(stored)) return { price: null, rent: null, arv: null, tab: null };
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
  const rents = Array.isArray(stored.rents) ? stored.rents.filter((r): r is number => typeof r === 'number' && Number.isFinite(r)) : [];
  const rent = rents.reduce((s, r) => s + r, 0);
  return {
    price: n(stored.price),
    rent: rent > 0 ? rent : null,
    arv: n(stored.arv),
    tab: oneOf(stored.tab, ['hold', 'flip', 'brrrr'] as const, 'hold'),
  };
};

/** The flip (and the purchase half of a BRRRR) as investment.ts takes it. */
export const flipInputs = (s: Scenario, book: CostItem[]): FlipInputs => ({
  price: s.price,
  buyerClosing: s.closingCosts,
  rehab: scopeTotal(s.scope, book).total,
  rehabMonths: s.project.rehabMonths,
  holdMonths: s.project.flipMonths,
  monthlyCarry: monthlyCarry(s),
  arv: s.arv,
  finance: s.project.finance === 'hardMoney' ? { kind: 'hardMoney', hm: s.project.hm } : { kind: 'cash' },
  sale: s.sale,
});

/**
 * The rental after a BRRRR's refinance: the rental tab's rent and costs, so
 * the two tabs cannot disagree about the same building. Every unit is let —
 * living in one is the rental tab's scenario, not a BRRRR's.
 */
export const operatingFrom = (s: Scenario): OperatingInputs => ({
  grossMonthlyRent: s.rents.reduce((sum, r) => sum + r, 0),
  otherMonthlyIncome: s.otherIncome,
  vacancyPct: s.vacancyPct,
  managementPct: s.managementPct,
  annualTaxes: s.annualTaxes,
  annualInsurance: s.annualInsurance,
  monthlyHoa: s.monthlyHoa,
  annualMaintenance: s.annualMaintenance,
  capexPct: s.capexPct,
  monthlyOwnerUtilities: s.ownerUtilities,
  leasingFeeMonths: s.leasingFeeMonths,
  turnoversPerYear: s.turnovers,
  otherAnnual: 0,
});

/**
 * The after-repair value's seed: the top of the comparable sales' range —
 * renovated homes sell near the top of what like homes fetch — rounded to the
 * thousand. Nothing where the comps say a number would be a projection past
 * their evidence, and nothing where the estimate is switched off for this
 * listing (SITE.valuation / estimateSuppressed, passed in as `suppressed`).
 */
export const arvSeed = (v: Pick<Valuation, 'withheld' | 'high'> | null | undefined, suppressed: boolean): number | null => {
  if (!v || suppressed) return null;
  if (v.withheld === 'larger-than-comps' || v.withheld === 'smaller-than-comps' || v.withheld === 'lot-beyond-comps') return null;
  return Math.round(v.high / 1000) * 1000;
};
