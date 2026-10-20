/**
 * Every number the investment pages assume, with where it came from.
 *
 * PURE and checked: scripts/investment-check.ts asserts that every entry has a
 * source and an as-of date, and warns when one is more than a year old.
 *
 * THREE KINDS, and the page shows which is which beside the figure:
 *
 *   statute     the law says so (the deed excise, the broker-fee rule)
 *   published   a named, dated public source says so (Fannie Mae's limits)
 *   assumption  a planning figure an investor is expected to replace with
 *               their own — vacancy, maintenance, a capital reserve. Marked
 *               as such on the page, in words, every time it appears.
 *
 * The rule the content guidelines set for this site — never fabricate — is
 * what decides the third kind. A planning assumption labelled as one is a
 * starting point the investor can see and argue with; the same number printed
 * without the label would be a claim about somebody else's house.
 *
 * Renovation and construction prices are NOT here: they live in the cost book,
 * where Kevin can replace them with his own contractors' figures.
 */
import { SITE } from './siteConfig.ts';
import type { ScreenDefaults } from './investment.ts';

export type SourceKind = 'statute' | 'published' | 'assumption';

export interface Sourced<T> {
  value: T;
  kind: SourceKind;
  /** Shown beside the figure: who says so, or why it is assumed. */
  source: string;
  url?: string;
  /** YYYY-MM-DD: when the source was read, or the assumption last reviewed. */
  asOf: string;
}

const REVIEWED = '2026-10-19';

export const ASSUMPTIONS = {
  /* ---------------------------------------------------------------- loans */

  /** Added to SITE.assumedMortgageRate for a home the buyer will not live in. */
  investorRatePremium: {
    value: 0.75,
    kind: 'assumption',
    source:
      'Loans on a property you will not live in are priced above owner-occupied rates. Ask a lender for a real quote.',
    asOf: REVIEWED,
  },
  /** Percent down on an investment purchase. Fannie Mae's minimum is 15% for one unit, 25% for 2–4. */
  investorDownPct: {
    value: 25,
    kind: 'published',
    source:
      'Fannie Mae Eligibility Matrix: an investment purchase may borrow up to 85% for one unit and 75% for two to four units. 25% down also avoids mortgage insurance.',
    url: 'https://www.fanniemae.com/content/eligibility_information/eligibility-matrix.pdf',
    asOf: REVIEWED,
  },
  /** Percent down when the buyer lives in one unit of a 2–4 family. */
  ownerOccupiedDownPct: {
    value: 5,
    kind: 'published',
    source:
      'Since November 2023 Fannie Mae allows 5% down on a two- to four-family home the buyer lives in (FHA allows 3.5%).',
    url: 'https://themortgagereports.com/107690/fannie-mae-introduces-5-down-payment-option-for-multifamily-homes',
    asOf: REVIEWED,
  },
  /** Buyer's closing costs as a share of price. A MA buyer pays no deed excise. */
  buyerClosingPct: {
    value: 2,
    kind: 'assumption',
    source:
      "Closing attorney, lender's title insurance, recording at the Registry of Deeds, the municipal lien certificate, appraisal, inspection and prepaid escrows. In Massachusetts the seller pays the deed excise, not the buyer.",
    asOf: REVIEWED,
  },

  /* ------------------------------------------------------------ operating */

  vacancyPct: {
    value: 5,
    kind: 'assumption',
    source: 'About two and a half weeks empty a year. Use more for a unit that turns over often.',
    asOf: REVIEWED,
  },
  managementPct: {
    value: 10,
    kind: 'assumption',
    source: 'A property manager, charged on rent actually collected. Zero if you manage it yourself.',
    asOf: REVIEWED,
  },
  /** Maintenance a year, as a share of price. The listing calculator uses the same figure. */
  maintenancePctOfPrice: {
    value: 1,
    kind: 'assumption',
    source: 'The conventional planning figure of 1% of the price a year: repairs, not replacements.',
    asOf: REVIEWED,
  },
  /** Capital reserve, as a share of gross rent — the roof, the boiler, the next kitchen. */
  capexPctOfRent: {
    value: 5,
    kind: 'assumption',
    source:
      'Money set aside for things that wear out — roof, heating, appliances. Older buildings need more.',
    asOf: REVIEWED,
  },
  /** Months of rent paid to a leasing broker per new lease. */
  leasingFeeMonths: {
    value: 1,
    kind: 'statute',
    source:
      'Since 1 August 2025 a Massachusetts landlord who hires a broker pays that broker, and may not pass the fee to the tenant. One month per new lease is assumed.',
    url: 'https://www.mass.gov/info-details/frequently-asked-questions-about-residential-rental-brokers-fees',
    asOf: REVIEWED,
  },
  /** New leases per unit per year. 0.5 = a tenant stays two years. */
  turnoversPerYear: {
    value: 0.5,
    kind: 'assumption',
    source: 'A tenant staying two years on average.',
    asOf: REVIEWED,
  },
  /** Landlord insurance against the homeowner estimate in mortgage.ts. */
  landlordInsuranceFactor: {
    value: 1.25,
    kind: 'assumption',
    source:
      'A landlord policy (dwelling fire / DP-3) usually costs more than a homeowner policy on the same house; 25% more than the Massachusetts homeowner average is assumed.',
    asOf: REVIEWED,
  },
  /** Water and sewer per unit per month, which a MA multi-family owner usually pays. */
  ownerUtilitiesPerUnit: {
    value: 60,
    kind: 'assumption',
    source:
      'Water and sewer, which the owner of a Massachusetts multi-family usually pays: billing tenants for water is allowed only with submeters installed under the state rules. Use the seller’s actual bills.',
    asOf: REVIEWED,
  },

  /* ----------------------------------------------------- flip and BRRRR */

  hardMoneyRatePct: {
    value: 11,
    kind: 'published',
    source: 'Massachusetts fix-and-flip lenders advertised 10–12.5% in 2025–26.',
    url: 'https://www.offermarket.us/fix-and-flip-loan/massachusetts',
    asOf: REVIEWED,
  },
  hardMoneyPointsPct: {
    value: 2,
    kind: 'published',
    source: 'Origination of 1.5–3 points was typical in 2025–26.',
    url: 'https://www.offermarket.us/fix-and-flip-loan/massachusetts',
    asOf: REVIEWED,
  },
  hardMoneyLtcPct: {
    value: 90,
    kind: 'published',
    source: 'Lenders advertise up to 90% of purchase plus renovation, for experienced borrowers.',
    url: 'https://www.offermarket.us/fix-and-flip-loan/massachusetts',
    asOf: REVIEWED,
  },
  hardMoneyMaxArvPct: {
    value: 70,
    kind: 'published',
    source: 'Most cap the loan at 65–75% of the after-repair value.',
    url: 'https://www.offermarket.us/fix-and-flip-loan/massachusetts',
    asOf: REVIEWED,
  },
  hardMoneyFees: {
    value: 1500,
    kind: 'assumption',
    source: 'Underwriting, draw inspections and the lender’s legal fees.',
    asOf: REVIEWED,
  },
  /** Cash-out refinance on an investment property. */
  refiLtvOneUnitPct: {
    value: 75,
    kind: 'published',
    source: 'Fannie Mae: a cash-out refinance of a one-unit investment property may borrow up to 75%.',
    url: 'https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions',
    asOf: REVIEWED,
  },
  refiLtvMultiUnitPct: {
    value: 70,
    kind: 'published',
    source: 'Fannie Mae: a cash-out refinance of a two- to four-unit investment property may borrow up to 70%.',
    url: 'https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions',
    asOf: REVIEWED,
  },
  refiTitleMonths: {
    value: 6,
    kind: 'published',
    source:
      'Fannie Mae: a borrower must have been on title for six months before a cash-out refinance — unless the home was bought with cash, which "delayed financing" allows sooner, capped at what was paid.',
    url: 'https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions',
    asOf: REVIEWED,
  },
  refiNoteMonths: {
    value: 12,
    kind: 'published',
    source:
      'Fannie Mae (Announcement 2023-01): a loan being paid off by a cash-out refinance must be twelve months old, note date to note date. Before that only a limited cash-out refinance is possible.',
    url: 'https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions',
    asOf: REVIEWED,
  },
  refiClosingPct: {
    value: 2,
    kind: 'assumption',
    source: 'Lender fees, appraisal, title and recording on the new loan.',
    asOf: REVIEWED,
  },
  /** Months the renovation takes, permits included. */
  rehabMonths: {
    value: 4,
    kind: 'assumption',
    source: 'Permits, scheduling the trades and a cosmetic-to-moderate renovation. A gut renovation takes longer.',
    asOf: REVIEWED,
  },
  /** Months from finished to sold. */
  saleMonths: {
    value: 2,
    kind: 'assumption',
    source: 'About a month on the market and a month to closing.',
    asOf: REVIEWED,
  },
  /** Utilities, insurance and the like while a house is being worked on, per month. */
  rehabUtilitiesMonthly: {
    value: 300,
    kind: 'assumption',
    source: 'Heat, power and water while the house is empty and being worked on.',
    asOf: REVIEWED,
  },
  sellerOtherClosing: {
    value: 1500,
    kind: 'assumption',
    source: 'Seller’s attorney, and the smoke and carbon-monoxide certificate the fire department issues before a sale.',
    asOf: REVIEWED,
  },
} satisfies Record<string, Sourced<number>>;

export type AssumptionKey = keyof typeof ASSUMPTIONS;

/** What the page prints after an assumed figure, so no assumption is ever unlabelled. */
export const KIND_LABEL: Record<SourceKind, string> = {
  statute: 'Law',
  published: 'Published',
  assumption: 'Assumption',
};

/** The rate an investment purchase is modelled at: the site's assumed rate plus the premium. */
export const investorRate = (): number =>
  Math.round((SITE.assumedMortgageRate + ASSUMPTIONS.investorRatePremium.value) * 100) / 100;

/** The assumptions every card in the screener is computed at. */
export const screenDefaults = (): ScreenDefaults => ({
  vacancyPct: ASSUMPTIONS.vacancyPct.value,
  managementPct: ASSUMPTIONS.managementPct.value,
  maintenancePctOfPrice: ASSUMPTIONS.maintenancePctOfPrice.value,
  capexPct: ASSUMPTIONS.capexPctOfRent.value,
  leasingFeeMonths: ASSUMPTIONS.leasingFeeMonths.value,
  turnoversPerYear: ASSUMPTIONS.turnoversPerYear.value,
  landlordInsuranceFactor: ASSUMPTIONS.landlordInsuranceFactor.value,
  ownerUtilitiesPerUnit: ASSUMPTIONS.ownerUtilitiesPerUnit.value,
  downPct: ASSUMPTIONS.investorDownPct.value,
  ratePct: investorRate(),
  termYears: 30,
  pmiRatePct: SITE.assumedPmiRate,
  buyerClosingPct: ASSUMPTIONS.buyerClosingPct.value,
});
