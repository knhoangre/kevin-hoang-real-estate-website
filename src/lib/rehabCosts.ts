/**
 * The cost book: what renovation, demolition and building cost, as RANGES.
 *
 * PURE and checked (scripts/investment-check.ts asserts every line has a source
 * and a date, and low ≤ mid ≤ high). Kevin replaces any line with his own
 * contractors' prices at /admin/costs; those overrides live in the database
 * and win per key (`withOverrides`). Investors change any line on their own
 * analysis.
 *
 * WHY RANGES, AND WHY SO MANY "ASSUMPTION" LABELS. Published renovation
 * prices for Greater Boston disagree by two or three times — new construction
 * is quoted anywhere from $350 to $650 a square foot — and most of what is
 * online is a contractor's marketing page. Where a named, dated source exists
 * it is cited; where none could be found the line is marked an assumption and
 * says what it covers, so an investor knows it is a placeholder for a bid.
 * A contractor's 2026 quote, entered by Kevin, is a better source than any of
 * these, which is why the override page exists.
 */

export type CostUnit = 'job' | 'each' | 'sqft' | 'unit' | 'pct';
export type Tier = 'low' | 'mid' | 'high';

export interface CostItem {
  key: string;
  label: string;
  /** What one unit of quantity is — a job, a window, a square foot, a dwelling unit. */
  unit: CostUnit;
  low: number;
  mid: number;
  high: number;
  kind: 'published' | 'assumption' | 'contractor';
  source: string;
  url?: string;
  asOf: string;
  group: 'Kitchen and bath' | 'Rooms and finishes' | 'Systems' | 'Outside' | 'Required by law' | 'Building';
}

const READ = '2026-10-20';

export const COST_BOOK: CostItem[] = [
  /* ------------------------------------------------------ kitchen and bath */
  {
    key: 'kitchen-refresh',
    label: 'Kitchen refresh — counters, appliances, cabinet fronts',
    unit: 'job',
    low: 24_000,
    mid: 32_000,
    high: 42_000,
    kind: 'published',
    source:
      'Cost vs Value 2025 (Journal of Light Construction): a midrange minor kitchen remodel averaged $28,458 nationally; Greater Boston runs above the national average.',
    url: 'https://www.jlconline.com/cost-vs-value/2025/',
    asOf: READ,
    group: 'Kitchen and bath',
  },
  {
    key: 'kitchen-full',
    label: 'Kitchen, full remodel',
    unit: 'job',
    low: 45_000,
    mid: 65_000,
    high: 95_000,
    kind: 'published',
    source:
      'Greater Boston remodeling guides, 2025–26, put a mid-range kitchen at $35,000–$75,000 and more for high-end finishes. A contractor’s bid replaces this.',
    url: 'https://www.blockrenovation.com/guides/how-much-does-a-home-renovation-cost-in-boston',
    asOf: READ,
    group: 'Kitchen and bath',
  },
  {
    key: 'bath-refresh',
    label: 'Bathroom refresh — vanity, toilet, fixtures, paint',
    unit: 'each',
    low: 8_000,
    mid: 14_000,
    high: 20_000,
    kind: 'published',
    source: 'Massachusetts town cost guides (2026): a basic bathroom remodel at $8,000–$14,000.',
    url: 'https://bmnboston.com/cost-to-remodel-a-bathroom-in-west-newbury-ma/',
    asOf: READ,
    group: 'Kitchen and bath',
  },
  {
    key: 'bath-full',
    label: 'Bathroom, full remodel',
    unit: 'each',
    low: 15_000,
    mid: 28_000,
    high: 45_000,
    kind: 'published',
    source:
      'Cost vs Value 2024: a midrange bathroom remodel averaged $25,251 nationally, with New England among the regions where it is worth most. Massachusetts guides: $14,500–$30,000 mid-range.',
    url: 'https://www.hgtv.com/decorating/bathrooms/average-cost-master-bathroom-remodel',
    asOf: READ,
    group: 'Kitchen and bath',
  },
  {
    key: 'bath-added',
    label: 'Bathroom added where there was none',
    unit: 'each',
    low: 40_000,
    mid: 60_000,
    high: 90_000,
    kind: 'assumption',
    source:
      'New plumbing runs and venting, framing, and a full bathroom — roughly twice a remodel. No current local figure was found; get a bid.',
    asOf: READ,
    group: 'Kitchen and bath',
  },

  /* --------------------------------------------------- rooms and finishes */
  {
    key: 'bedroom-refresh',
    label: 'Bedroom refresh — paint, floors, lighting',
    unit: 'each',
    low: 2_500,
    mid: 4_000,
    high: 6_500,
    kind: 'assumption',
    source: 'A typical 12×12 room: patch and paint, refinish or replace the floor, new light and outlets.',
    asOf: READ,
    group: 'Rooms and finishes',
  },
  {
    key: 'flooring',
    label: 'Flooring, refinished or replaced',
    unit: 'sqft',
    low: 4,
    mid: 8,
    high: 14,
    kind: 'assumption',
    source: 'Per square foot of floor: refinishing existing hardwood at the low end, new hardwood at the high end.',
    asOf: READ,
    group: 'Rooms and finishes',
  },
  {
    key: 'paint-interior',
    label: 'Interior paint',
    unit: 'sqft',
    low: 3,
    mid: 4.5,
    high: 6,
    kind: 'assumption',
    source: 'Per square foot of living area: walls, ceilings and trim, professionally painted.',
    asOf: READ,
    group: 'Rooms and finishes',
  },
  {
    key: 'gut',
    label: 'Gut renovation, the whole house',
    unit: 'sqft',
    low: 150,
    mid: 225,
    high: 300,
    kind: 'published',
    source:
      'Greater Boston renovation guides, 2025–26: $150,000–$400,000 for homes under 2,500 sq ft; a Boston builder’s full remodel at $300 a sq ft. Use instead of the room-by-room lines, not with them.',
    url: 'https://www.blockrenovation.com/guides/how-much-does-a-home-renovation-cost-in-boston',
    asOf: READ,
    group: 'Rooms and finishes',
  },

  /* -------------------------------------------------------------- systems */
  {
    key: 'rewire',
    label: 'Rewire (knob-and-tube or old wiring)',
    unit: 'job',
    low: 12_000,
    mid: 20_000,
    high: 30_000,
    kind: 'published',
    source:
      'Whole-house rewiring ran $10,000–$15,000 nationally in 2025, and Boston-area work runs 30–50% above national ranges (60–120 labor hours).',
    url: 'https://www.blockrenovation.com/guides/knob-and-tube-wiring-replacement-cost-guide',
    asOf: READ,
    group: 'Systems',
  },
  {
    key: 'service-200a',
    label: 'Electrical service to 200 amps',
    unit: 'job',
    low: 2_500,
    mid: 4_000,
    high: 8_000,
    kind: 'published',
    source: 'A 200-amp service upgrade, panel and permit: $2,500–$4,500, more when the utility must replace the line.',
    url: 'https://inchcalculator.com/home-electrical-rewire-cost-guide',
    asOf: READ,
    group: 'Systems',
  },
  {
    key: 'repipe',
    label: 'Replumb supply and drain lines',
    unit: 'job',
    low: 8_000,
    mid: 14_000,
    high: 22_000,
    kind: 'assumption',
    source: 'Replacing old galvanized or cast-iron lines through a typical house. No current local figure was found; get a bid.',
    asOf: READ,
    group: 'Systems',
  },
  {
    key: 'boiler',
    label: 'Boiler replaced, radiators kept',
    unit: 'job',
    low: 12_000,
    mid: 13_500,
    high: 15_000,
    kind: 'published',
    source: 'Boston Globe, 16 October 2026: replacing an oil or gas boiler and keeping the radiators runs about $12,000–$15,000 in Massachusetts.',
    url: 'https://www.bostonglobe.com/2026/10/16/real-estate/heat-pump-oil-prices-winter-massachusetts/',
    asOf: READ,
    group: 'Systems',
  },
  {
    key: 'heat-pump',
    label: 'Whole-home heat pump, after the Mass Save rebate',
    unit: 'job',
    low: 6_500,
    mid: 11_500,
    high: 17_500,
    kind: 'published',
    source:
      'A whole-home cold-climate heat pump ran $15,000–$26,000 before incentives in Massachusetts (about $20,000 typical, Harvard Belfer Center); Mass Save’s whole-home rebate is up to $8,500 in 2026 and requires the house be weatherized first. Shown net of the rebate.',
    url: 'https://www.belfercenter.org/research-analysis/opportunities-cost-effective-residential-heat-pump-adoption-massachusetts',
    asOf: READ,
    group: 'Systems',
  },
  {
    key: 'water-heater',
    label: 'Water heater',
    unit: 'job',
    low: 1_800,
    mid: 2_800,
    high: 4_500,
    kind: 'assumption',
    source: 'A tank or tankless water heater, installed. Get a quote.',
    asOf: READ,
    group: 'Systems',
  },

  /* -------------------------------------------------------------- outside */
  {
    key: 'roof',
    label: 'Roof, asphalt shingles',
    unit: 'job',
    low: 18_000,
    mid: 28_000,
    high: 36_000,
    kind: 'published',
    source: 'Cost vs Value 2025: an asphalt roof replacement averaged $31,871 nationally (about 3,000 sq ft of roof).',
    url: 'https://www.jlconline.com/cost-vs-value/2025/',
    asOf: READ,
    group: 'Outside',
  },
  {
    key: 'windows',
    label: 'Replacement window',
    unit: 'each',
    low: 1_000,
    mid: 1_600,
    high: 2_700,
    kind: 'published',
    source: 'Cost vs Value 2025: ten wood replacement windows averaged $26,781 nationally ($2,678 each); vinyl costs less.',
    url: 'https://www.jlconline.com/cost-vs-value/2025/',
    asOf: READ,
    group: 'Outside',
  },
  {
    key: 'paint-exterior',
    label: 'Exterior paint',
    unit: 'job',
    low: 8_000,
    mid: 13_000,
    high: 20_000,
    kind: 'assumption',
    source: 'Scraping, priming and painting a typical wood-sided house. Pre-1978 paint is lead-safe work, which costs more.',
    asOf: READ,
    group: 'Outside',
  },

  /* ------------------------------------------------------ required by law */
  {
    key: 'lead',
    label: 'Lead paint abatement, to a Letter of Full Compliance',
    unit: 'unit',
    low: 3_000,
    mid: 6_000,
    high: 15_000,
    kind: 'published',
    source:
      'MassLandlords: deleading a Massachusetts rental unit averages about $6,000 and can reach $30,000. A state tax credit of up to $3,000 a unit applies with a Letter of Full Compliance (DOR Schedule LP), not counted here.',
    url: 'https://masslandlords.net/laws/lead-paint/basics/',
    asOf: READ,
    group: 'Required by law',
  },
  {
    key: 'title-v',
    label: 'Title V septic inspection',
    unit: 'job',
    low: 400,
    mid: 650,
    high: 900,
    kind: 'published',
    source: 'A Title V inspection at sale typically ran $400–$900 in 2025, with pumping often extra.',
    url: 'https://www.mass.gov/guides/buying-or-selling-property-with-a-septic-system',
    asOf: READ,
    group: 'Required by law',
  },
  {
    key: 'septic',
    label: 'Septic system replaced',
    unit: 'job',
    low: 15_000,
    mid: 30_000,
    high: 50_000,
    kind: 'published',
    source: 'A failed Title V system replaced: about $15,000–$50,000 depending on soil and size.',
    url: 'https://maxrealestateexposure.com/septic-inspection-cost',
    asOf: READ,
    group: 'Required by law',
  },
  {
    key: 'asbestos',
    label: 'Asbestos survey and abatement',
    unit: 'job',
    low: 2_000,
    mid: 6_000,
    high: 15_000,
    kind: 'published',
    source:
      'MassDEP requires a survey by a certified inspector before any demolition or renovation; abatement where asbestos is found ran about $2,000 for a little to $5,000–$15,000 throughout.',
    url: 'https://www.mass.gov/doc/asbestos-survey-requirements-prior-to-demolition-or-renovation-information-guide/download',
    asOf: READ,
    group: 'Required by law',
  },
  {
    key: 'permits',
    label: 'Building permits',
    unit: 'pct',
    low: 1,
    mid: 1.5,
    high: 2,
    kind: 'published',
    source: 'Towns charge on the value of the work — Revere, for one, $12 per $1,000 (1.2%) — plus electrical and plumbing permits.',
    url: 'https://permitmint.com/permits/massachusetts/revere/demolition',
    asOf: READ,
    group: 'Required by law',
  },

  /* ------------------------------------------------------------- building */
  {
    key: 'demolition',
    label: 'Demolition of the house',
    unit: 'job',
    low: 15_000,
    mid: 25_000,
    high: 40_000,
    kind: 'published',
    source: 'HomeAdvisor 2025: a 2,000 sq ft house averaged about $15,800 to demolish nationally; $12,000–$70,000 by size, with asbestos the biggest swing.',
    url: 'https://www.homeadvisor.com/cost/landscape/house-demolition',
    asOf: READ,
    group: 'Building',
  },
  {
    key: 'disconnects',
    label: 'Utility disconnects and demolition permit',
    unit: 'job',
    low: 2_000,
    mid: 4_000,
    high: 7_000,
    kind: 'assumption',
    source: 'Gas, electric, water and sewer cut and capped by the utilities, and the town’s demolition permit.',
    asOf: READ,
    group: 'Building',
  },
  {
    key: 'new-build',
    label: 'New construction',
    unit: 'sqft',
    low: 350,
    mid: 450,
    high: 650,
    kind: 'published',
    source:
      'Massachusetts guides put new construction at $350–$650 a sq ft by lot, finish and design; Greater Boston infill sits in the upper half. The widest range in this book — use a builder’s number.',
    url: 'https://www.angi.com/articles/how-much-does-it-cost-build-house/ma/boston',
    asOf: READ,
    group: 'Building',
  },
  {
    key: 'adu',
    label: 'Accessory dwelling unit, detached',
    unit: 'sqft',
    low: 250,
    mid: 325,
    high: 400,
    kind: 'published',
    source: 'Greater Boston builders quoted roughly $250–$400 a sq ft for a detached ADU in 2025–26, before site costs.',
    url: 'https://bankerandtradesman.com/months-after-legalization-building-adus-remains-costly/',
    asOf: READ,
    group: 'Building',
  },
  {
    key: 'adu-site',
    label: 'ADU site costs — survey, water and sewer connections',
    unit: 'job',
    low: 15_000,
    mid: 20_000,
    high: 30_000,
    kind: 'published',
    source: 'A site survey ($7,000–$10,000) and water and sewer connections ($6,000–$14,000), as one builder priced them.',
    url: 'https://bankerandtradesman.com/months-after-legalization-building-adus-remains-costly/',
    asOf: READ,
    group: 'Building',
  },
  {
    key: 'soft-costs',
    label: 'Design, engineering and survey',
    unit: 'pct',
    low: 8,
    mid: 12,
    high: 15,
    kind: 'assumption',
    source: 'An architect, a structural engineer and a site survey, as a share of construction.',
    asOf: READ,
    group: 'Building',
  },
];

export const COST_KEYS = new Set(COST_BOOK.map((c) => c.key));

/** Kevin's figure for a line, from the database. */
export interface CostOverride {
  key: string;
  low: number;
  mid: number;
  high: number;
  note: string | null;
  updated_at: string;
}

/**
 * The book with Kevin's prices laid over it. An override replaces the three
 * figures and the source line; one for a key the book no longer has, or with
 * its figures out of order, is ignored rather than trusted.
 */
export const withOverrides = (overrides: CostOverride[] | null | undefined): CostItem[] => {
  const byKey = new Map((overrides ?? []).map((o) => [o.key, o]));
  return COST_BOOK.map((item) => {
    const o = byKey.get(item.key);
    if (!o || !(o.low >= 0 && o.low <= o.mid && o.mid <= o.high)) return item;
    return {
      ...item,
      low: Number(o.low),
      mid: Number(o.mid),
      high: Number(o.high),
      kind: 'contractor' as const,
      source: o.note?.trim() ? `Kevin’s figure: ${o.note.trim()}` : 'Kevin’s figure, from local contractors.',
      url: undefined,
      asOf: o.updated_at.slice(0, 10),
    };
  });
};

/* -------------------------------------------------------------------------- */
/* A renovation scope                                                          */
/* -------------------------------------------------------------------------- */

export interface ScopeLine {
  key: string;
  on: boolean;
  qty: number;
  tier: Tier;
  /** Why it was suggested, in the listing's own terms. */
  reason?: string;
  /** The investor's own figure for the whole line, replacing the book's. */
  amount?: number;
}

export interface Scope {
  lines: ScopeLine[];
  contingencyPct: number;
}

/** One line's cost. A percentage line (permits) is a share of everything else that is on. */
export const lineCost = (line: ScopeLine, item: CostItem, base = 0): number => {
  if (!line.on) return 0;
  if (line.amount !== undefined && line.amount >= 0) return line.amount;
  const rate = item[line.tier];
  return item.unit === 'pct' ? (base * rate) / 100 : rate * Math.max(0, line.qty);
};

export interface ScopeTotal {
  /** Before contingency. */
  work: number;
  contingency: number;
  total: number;
  lines: { key: string; label: string; amount: number }[];
}

export const scopeTotal = (scope: Scope, book: CostItem[]): ScopeTotal => {
  const items = new Map(book.map((b) => [b.key, b]));
  const fixed = scope.lines
    .filter((l) => items.get(l.key)?.unit !== 'pct')
    .map((l) => ({ key: l.key, label: items.get(l.key)?.label ?? l.key, amount: items.get(l.key) ? lineCost(l, items.get(l.key) as CostItem) : 0 }));
  const base = fixed.reduce((s, l) => s + l.amount, 0);
  const pct = scope.lines
    .filter((l) => items.get(l.key)?.unit === 'pct')
    .map((l) => ({ key: l.key, label: items.get(l.key)?.label ?? l.key, amount: lineCost(l, items.get(l.key) as CostItem, base) }));
  const lines = [...fixed, ...pct].filter((l) => l.amount > 0);
  const work = lines.reduce((s, l) => s + l.amount, 0);
  const contingency = (work * Math.min(Math.max(scope.contingencyPct, 0), 100)) / 100;
  return { work, contingency, total: work + contingency, lines };
};

/** Remark flags (investment.ts remarkFlags) that say the house needs work. "Investors" and "builder" do not. */
export const CONDITION_FLAGS = new Set(['as-is', 'tlc', 'needs-work', 'handyman', 'contractor', 'fixer', 'estate', 'probate']);

/**
 * A starting scope from what the listing says, each suggestion with its reason.
 *
 * Only what the listing actually evidences is switched on: the lead law for a
 * pre-1978 rental, a Title V inspection on septic, and — when the agent's own
 * remarks say the house needs work — a kitchen and bath refresh, paint and
 * floors. Everything else is in the list, off, for the investor to add from the
 * photos and the inspection. Nothing here claims to know a house's condition.
 */
export const seedScope = (l: {
  living_area: number | null;
  full_baths: number | null;
  bedrooms: number | null;
  year_built: number | null;
  units: number;
  septic: boolean;
  oilHeat: boolean;
  renting: boolean;
  conditionFlags: string[];
  conditionWords: string | null;
}): Scope => {
  const needsWork = l.conditionFlags.some((k) => CONDITION_FLAGS.has(k));
  const area = l.living_area && l.living_area > 0 ? l.living_area : 0;
  const baths = Math.max(1, l.full_baths ?? 1);
  const said = l.conditionWords ? `The remarks say ${l.conditionWords}.` : undefined;
  const pre1978 = l.year_built !== null && l.year_built > 1700 && l.year_built < 1978;

  const line = (key: string, on: boolean, qty: number, reason?: string): ScopeLine => ({ key, on, qty, tier: 'mid', reason });
  return {
    contingencyPct: 15,
    lines: [
      line('kitchen-refresh', needsWork, 1, needsWork ? said : undefined),
      line('kitchen-full', false, 1),
      line('bath-refresh', needsWork, baths, needsWork ? said : undefined),
      line('bath-full', false, baths),
      line('bath-added', false, 1),
      line('bedroom-refresh', false, Math.max(1, l.bedrooms ?? 1)),
      line('flooring', needsWork, area, needsWork ? said : undefined),
      line('paint-interior', needsWork, area, needsWork ? said : undefined),
      line('gut', false, area),
      line('rewire', false, 1, l.year_built && l.year_built < 1950 ? `Built ${l.year_built}: wiring that old is worth an electrician’s look.` : undefined),
      line('service-200a', false, 1),
      line('repipe', false, 1),
      line('boiler', false, 1, l.oilHeat ? 'The listing says oil heat.' : undefined),
      line('heat-pump', false, 1, l.oilHeat ? 'The listing says oil heat.' : undefined),
      line('water-heater', false, 1),
      line('roof', false, 1),
      line('windows', false, 10),
      line('paint-exterior', false, 1),
      line('lead', l.renting && pre1978, l.units, pre1978 ? `Built ${l.year_built}, before 1978.` : undefined),
      line('title-v', l.septic, 1, l.septic ? 'The listing says it is on septic.' : undefined),
      line('septic', false, 1),
      line('asbestos', false, 1),
      line('permits', needsWork, 1, needsWork ? 'Work of this size needs permits.' : undefined),
    ],
  };
};
