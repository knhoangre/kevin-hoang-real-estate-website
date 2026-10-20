/**
 * The Massachusetts rules an investor meets, and which ones apply to a house.
 *
 * PURE. Each rule says when it applies, in plain words, with its source and
 * the date it was read; the page shows all three and links the blog post that
 * already explains it, where one exists. Written to agree with those posts —
 * massachusetts-lead-paint-law, title-5-septic-massachusetts and the rest — not
 * to restate them differently.
 *
 * Nothing here describes a neighbourhood or the people in it, and nothing asks
 * about tenants: those are fair-housing lines, and the lead-paint rule below is
 * written the way it is because of one of them.
 */

export type Strategy = 'hold' | 'brrrr' | 'flip' | 'build' | 'adu';

export interface RuleContext {
  strategy: Strategy;
  propType: string | null;
  yearBuilt: number | null;
  septic: boolean;
  units: number;
}

export interface Rule {
  id: string;
  title: string;
  body: string;
  applies: (c: RuleContext) => boolean;
  source: string;
  url: string;
  asOf: string;
  /** A post on this site that explains it at length. */
  blogSlug?: string;
}

const READ = '2026-10-19';
const RENTING: Strategy[] = ['hold', 'brrrr', 'adu'];

export const RULES: Rule[] = [
  {
    id: 'lead',
    title: 'Lead paint is a cost of renting a pre-1978 home',
    body:
      'In a home built before 1978, the Massachusetts Lead Law requires lead hazards to be removed or covered once a child under six lives there, and it is illegal to refuse to rent to a family to avoid that. So it belongs in the budget of every pre-1978 rental, not only the ones a family applies for. The end point is a Letter of Full Compliance from a licensed inspector.',
    applies: (c) => RENTING.includes(c.strategy) && (c.yearBuilt === null || c.yearBuilt < 1978),
    source: 'Massachusetts Department of Public Health, Lead Law',
    url: 'https://www.mass.gov/service-details/learn-about-massachusetts-lead-law',
    asOf: READ,
    blogSlug: 'massachusetts-lead-paint-law',
  },
  {
    id: 'deposits',
    title: 'What a landlord may collect up front',
    body:
      'First month, last month, a security deposit of no more than one month, and the cost of a new lock — nothing else, so no application or holding fees. The deposit goes in a separate interest-bearing account in a Massachusetts bank with a receipt, and interest is owed on last month’s rent too. Buy a building with tenants in it and their deposits and last month’s rent, with the interest, become yours to answer for.',
    applies: (c) => RENTING.includes(c.strategy),
    source: 'M.G.L. c.186 §15B',
    url: 'https://malegislature.gov/Laws/GeneralLaws/PartII/TitleI/Chapter186/Section15B',
    asOf: READ,
  },
  {
    id: 'broker-fee',
    title: 'Your leasing broker is yours to pay',
    body:
      'Since 1 August 2025 a landlord who hires a broker to find a tenant pays that broker, and may not make the tenant pay it as a condition of the lease. That is why the operating statement carries a leasing fee per new lease.',
    applies: (c) => RENTING.includes(c.strategy),
    source: 'Massachusetts Attorney General, rental broker fees',
    url: 'https://www.mass.gov/info-details/frequently-asked-questions-about-residential-rental-brokers-fees',
    asOf: READ,
  },
  {
    id: 'income-source',
    title: 'A housing voucher is income',
    body:
      'A landlord may not refuse a tenant because the rent is paid with a Section 8 voucher or other public assistance, or because of that program’s requirements, such as its inspection.',
    applies: (c) => RENTING.includes(c.strategy),
    source: 'M.G.L. c.151B §4(10); Attorney General guidance',
    url: 'https://www.mass.gov/doc/guidance-on-preventing-housing-discrimination-based-on-source-of-income/download',
    asOf: READ,
  },
  {
    id: 'water',
    title: 'Water and sewer are usually the owner’s',
    body:
      'A landlord may bill tenants for water only with submeters installed under the state’s rules and the charge written into the lease. Otherwise it is an owner’s expense — which is why a multi-family’s statement carries it.',
    applies: (c) => RENTING.includes(c.strategy) && c.units > 1,
    source: 'M.G.L. c.186 §22',
    url: 'https://malegislature.gov/Laws/GeneralLaws/PartII/TitleI/Chapter186/Section22',
    asOf: READ,
  },
  {
    id: 'septic',
    title: 'A septic system is inspected before the sale',
    body:
      'Title V requires an inspection within two years before a sale (three if the system has been pumped every year). A system that fails must be repaired or replaced, which runs from about $15,000 to $50,000 — worth knowing before an offer, not after.',
    applies: (c) => c.septic,
    source: 'MassDEP, buying or selling property with a septic system (310 CMR 15.301)',
    url: 'https://www.mass.gov/guides/buying-or-selling-property-with-a-septic-system',
    asOf: READ,
    blogSlug: 'title-5-septic-massachusetts',
  },
  {
    id: 'inspection',
    title: 'Inspect before you commit',
    body:
      'Since 15 October 2025 a Massachusetts seller may not require a buyer to waive the home inspection, or accept an offer that does. On a renovation the inspection is also the first draft of the budget.',
    applies: () => true,
    source: '760 CMR 74.00',
    url: 'https://www.mass.gov/info-details/residential-home-inspections',
    asOf: READ,
    blogSlug: 'massachusetts-home-inspection-waiver-law',
  },
  {
    id: 'rent-control',
    title: 'No rent control to model',
    body:
      'Massachusetts has had no rent control since 1994. A 2026 ballot question to bring it back was removed from the November ballot by the Supreme Judicial Court on 23 June 2026. Rents here can be raised at renewal, with notice.',
    applies: (c) => RENTING.includes(c.strategy),
    source: 'CBS Boston, 23 June 2026',
    url: 'https://www.cbsnews.com/boston/news/rent-control-ballot-question-massachusetts-ruling/',
    asOf: READ,
  },
];

export const rulesFor = (c: RuleContext): Rule[] => RULES.filter((r) => r.applies(c));
