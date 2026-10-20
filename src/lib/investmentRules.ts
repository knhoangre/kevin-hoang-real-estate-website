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
  town?: string | null;
}

/* -------------------------------------------------------------------------- */
/* The seventeen towns                                                         */
/* -------------------------------------------------------------------------- */

/**
 * What each served town adds, read from its own pages where they could be
 * found (October 2026). A demolition delay marked `confirmed: false` is one
 * whose CURRENT length could not be confirmed — the page says so, gives what
 * the older source said, and sends the investor to the Historical Commission
 * rather than stating it as fact. Towns amend these bylaws; re-check before
 * relying on one.
 */
export interface DemolitionDelay {
  /** The longest delay a "preferably preserved" finding can impose, in months; null when unknown. */
  months: number | null;
  /** Which buildings are reviewed. */
  scope: string;
  confirmed: boolean;
  source: string;
  url: string;
}

export interface TownRules {
  demolition: DemolitionDelay | null;
  /** In the state's Fossil Fuel-Free Demonstration Program (DOER, 2025 roster). */
  fossilFree: boolean;
  /** Gives owner-occupants a residential exemption (Cambridge from its own FY26 notice; the others from a third-party list). */
  residentialExemption: boolean;
}

const DEMO = (months: number | null, scope: string, confirmed: boolean, source: string, url: string): DemolitionDelay => ({
  months,
  scope,
  confirmed,
  source,
  url,
});

export const TOWN_RULES: Record<string, TownRules> = {
  Newton: {
    demolition: DEMO(18, 'buildings 50 years old or more', true, 'Newton Historical Commission, demolition review: a delay of one year or 18 months', 'https://www.newtonma.gov/government/planning/historic-preservation/project-review-applications/demolition-review'),
    fossilFree: true,
    residentialExemption: false,
  },
  Needham: {
    demolition: DEMO(null, 'historically significant buildings', false, 'Needham General By-Laws \u00a72.11.5; its length was 6 months on the Massachusetts Historical Commission\u2019s 2012 list', 'https://needhamma.gov/1109/Historical-Commission'),
    fossilFree: false,
    residentialExemption: false,
  },
  Wellesley: {
    demolition: DEMO(12, 'houses built in 1949 or earlier', true, 'Wellesley Town Bylaw Article 46C (2017)', 'https://www.wellesleyma.gov/DocumentCenter/View/7432/Article-46C---Historic-Preservation-Demolition-Review-PDF'),
    fossilFree: false,
    residentialExemption: false,
  },
  Weston: {
    demolition: DEMO(12, 'historically significant buildings built before 1945', true, 'Weston General Bylaws Article XXVI, extended from 6 to 12 months by Town Meeting (Boston Globe, 2015)', 'https://www.bostonglobe.com/metro/2015/05/14/weston-residents-back-effort-save-mansion-from-demolition/ahxHE7JSD8ceDLPsBYOgmN/story.html'),
    fossilFree: false,
    residentialExemption: false,
  },
  Dover: {
    demolition: DEMO(null, 'buildings built in 1929 or earlier', false, 'Dover Demolition Delay By-law (1996); older reports give up to one year', 'https://doverma.gov/317/Historical-Commission'),
    fossilFree: false,
    residentialExemption: false,
  },
  Lexington: {
    demolition: DEMO(null, 'buildings on the town\u2019s inventory of significant buildings', false, 'Lexington Code Chapter 69; delays of 12 months imposed, and the bylaw was amended in 2023', 'https://www.ecode360.com/10420955'),
    fossilFree: true,
    residentialExemption: false,
  },
  Concord: {
    demolition: DEMO(12, 'buildings more than 50 years old', true, 'Concord Demolition Review Bylaw, amended 2023: one year for a building found Preferably Preserved', 'https://concordma.gov/DocumentCenter/View/46093/Demolition-Review-Bylaw-Amended-2023-'),
    fossilFree: true,
    residentialExemption: false,
  },
  Cambridge: {
    demolition: DEMO(12, 'buildings over 50 years old, citywide', true, 'Cambridge Historical Commission: extended from six to twelve months in 2019', 'https://cambridgema.gov/historic/districtsHistoricProperties/demolitiondelay'),
    fossilFree: true,
    residentialExemption: true,
  },
  Somerville: {
    demolition: DEMO(18, 'buildings 75 years old or more', true, 'Somerville Demolition Review Ordinance, raised to 18 months in 2021', 'https://www.somervillema.gov/dro'),
    fossilFree: false,
    residentialExemption: true,
  },
  Waltham: {
    demolition: DEMO(12, 'buildings 75 years old or more, or on the National Register', false, 'Waltham Ordinances Chapter 23; 12 months on the Massachusetts Historical Commission\u2019s 2019 list', 'https://www.mass.gov/doc/massachusetts-historical-commission-presentation/download'),
    fossilFree: false,
    residentialExemption: true,
  },
  Medford: {
    demolition: DEMO(18, 'buildings built before 1900, or on the National or State Register', true, 'Medford Historical Commission: up to 18 months', 'https://cs.umb.edu/masshistpres/2023-May/011454.html'),
    fossilFree: false,
    residentialExemption: false,
  },
  Malden: {
    demolition: null,
    fossilFree: false,
    residentialExemption: true,
  },
  Quincy: {
    demolition: null,
    fossilFree: false,
    residentialExemption: false,
  },
  Braintree: {
    demolition: DEMO(null, 'historically significant buildings', false, 'Braintree General Ordinances Chapter 5.700 (2019)', 'https://www.ecode360.com/36520097'),
    fossilFree: false,
    residentialExemption: false,
  },
  Brookline: {
    demolition: DEMO(18, 'significant buildings: 12 months, or 18 for one on the National or State Register', true, 'Brookline Preservation Commission, General By-Laws Article 5.3', 'https://www.brooklinema.gov/911'),
    fossilFree: true,
    residentialExemption: true,
  },
  Belmont: {
    demolition: DEMO(null, 'historically significant buildings', false, 'Belmont Demolition Delay Bylaw: 6 months as amended in 2017, amended again in 2022', 'https://belmont-ma.gov/1870/Buildings-Subject-to-Demolition-Delay'),
    fossilFree: false,
    residentialExemption: false,
  },
  Winchester: {
    demolition: DEMO(12, 'buildings built before 1941, or on the National or State Register', true, 'Winchester Town Bylaws Chapter 14 (Winchester News, 2026)', 'https://winchesternews.org/20260703_opinion-did-you-know-that-may-was-national-historic-preservation-month/'),
    fossilFree: false,
    residentialExemption: false,
  },
};

export const townRules = (town: string | null | undefined): TownRules | null =>
  (town && TOWN_RULES[town]) || null;

/** The delay to plan for in a teardown: the town's longest, or null when unknown. */
export const demolitionDelayMonths = (town: string | null | undefined): number | null =>
  townRules(town)?.demolition?.months ?? null;

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
    id: 'asbestos',
    title: 'An asbestos survey comes before the wrecking ball',
    body:
      'MassDEP requires a survey by a certified asbestos inspector before any demolition — a letter from the owner will not do — and notice to MassDEP and the Department of Labor Standards at least 10 working days before work starts. Asbestos found has to be removed by a licensed contractor first.',
    applies: (c) => c.strategy === 'build',
    source: 'MassDEP, asbestos survey requirements before demolition or renovation',
    url: 'https://www.mass.gov/doc/asbestos-survey-requirements-prior-to-demolition-or-renovation-information-guide/download',
    asOf: READ,
  },
  {
    id: 'adu-by-right',
    title: 'An ADU is allowed by right',
    body:
      'Since 2 February 2025 one accessory dwelling unit is allowed by right on a lot in a single-family zoning district, in every town but Boston: up to 900 square feet, or half the house\u2019s floor area if that is smaller. A town may still apply its dimensional rules and site plan review, but may not require the owner to live there, and may not require more than one parking space — none near transit.',
    applies: (c) => c.strategy === 'adu',
    source: '760 CMR 71.00 (the Affordable Homes Act, c.150 of the Acts of 2024)',
    url: 'https://www.mapc.org/wp-content/uploads/2025/04/EMHCC_ADU-Overview.pdf',
    asOf: READ,
    blogSlug: 'in-law-apartments-adu-massachusetts',
  },
  {
    id: 'adu-septic',
    title: 'On septic, an ADU\u2019s bedrooms count against the system',
    body:
      'Title V sizes a septic system by bedrooms. An ADU adds bedrooms to the lot, and may need the system enlarged or replaced before it can be permitted.',
    applies: (c) => c.strategy === 'adu' && c.septic,
    source: 'MassDEP, Title V',
    url: 'https://www.mass.gov/guides/buying-or-selling-property-with-a-septic-system',
    asOf: READ,
    blogSlug: 'title-5-septic-massachusetts',
  },
  {
    id: 'lot-division',
    title: 'Dividing a lot is the planning board\u2019s call',
    body:
      'A second house lot needs the district\u2019s minimum area AND frontage on a qualifying street, and a plan the planning board endorses (\u201capproval not required\u201d, G.L. c.41 \u00a781P) or approves as a subdivision. A big lot without the frontage is one lot. Ask a surveyor and the planning department before paying for the land.',
    applies: (c) => c.strategy === 'adu' || c.strategy === 'build',
    source: 'G.L. c.41 \u00a7\u00a781L and 81P',
    url: 'https://malegislature.gov/Laws/GeneralLaws/PartI/TitleVII/Chapter41/Section81P',
    asOf: READ,
    blogSlug: 'zoning-laws-building-permits-massachusetts',
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

/** The rules that depend on which town, written from TOWN_RULES. */
const townRulesFor = (c: RuleContext): Rule[] => {
  const t = townRules(c.town);
  const name = c.town ?? 'the town';
  const out: Rule[] = [];
  if (c.strategy === 'build') {
    const d = t?.demolition;
    out.push(
      d
        ? {
            id: 'demolition-delay',
            title: `${name} can delay a demolition`,
            body: d.confirmed && d.months
              ? `${name} reviews the demolition of ${d.scope}. A building its Historical Commission finds worth preserving can be held for up to ${d.months} months, while the owner and the Commission look for an alternative. The build tab\u2019s delay scenario adds that time.`
              : `${name} reviews the demolition of ${d.scope}, but how long it can hold one up could not be confirmed when this was written (${d.source}). Ask the Historical Commission before counting on a date.`,
            applies: () => true,
            source: d.source,
            url: d.url,
            asOf: READ,
          }
        : {
            id: 'demolition-delay',
            title: 'Check for a demolition delay',
            body: `About 155 Massachusetts communities have a demolition delay bylaw, most of 6 to 18 months. Whether ${name} has one, and how long it is, was not confirmed when this was written. Ask its Historical Commission or building department before counting on a date.`,
            applies: () => true,
            source: 'Massachusetts Historical Commission',
            url: 'https://www.mass.gov/doc/massachusetts-historical-commission-presentation/download',
            asOf: READ,
          }
    );
    if (t?.fossilFree) {
      out.push({
        id: 'fossil-free',
        title: `${name} builds all-electric`,
        body: `${name} is one of ten communities in the state\u2019s Fossil Fuel-Free Demonstration Program: under its own bylaw, new buildings and major renovations are built without fossil-fuel connections, with limited exemptions. Price the new house with electric heat, hot water and cooking.`,
        applies: () => true,
        source: 'Massachusetts Department of Energy Resources',
        url: 'https://www.mass.gov/info-details/municipal-fossil-fuel-free-building-demonstration-project',
        asOf: READ,
      });
    }
  }
  if (t?.residentialExemption && (c.strategy === 'hold' || c.strategy === 'brrrr')) {
    out.push({
      id: 'residential-exemption',
      title: 'The tax bill may rise for an investor',
      body: `${name} gives owner-occupants a residential exemption. If the seller lives there, the tax bill on the listing may be lower than an investor\u2019s would be. Ask the assessor what the bill is without it.`,
      applies: () => true,
      source: c.town === 'Cambridge' ? 'City of Cambridge, FY26 property tax notice' : 'Property Tax Almanac, list of adopting communities (not an official list)',
      url:
        c.town === 'Cambridge'
          ? 'https://www.cambridgema.gov/Departments/Finance/publications/2026/fy26propertytaxupdate'
          : 'https://propertytaxalmanac.com/massachusetts/suffolk-ma/',
      asOf: READ,
    });
  }
  return out;
};

export const rulesFor = (c: RuleContext): Rule[] => [...townRulesFor(c), ...RULES.filter((r) => r.applies(c))];
