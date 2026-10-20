/**
 * A listing's parcel in the assessor's records — what the land is worth, what
 * the building is worth, how big the lot is and what it is zoned.
 *
 * PURE: no network, no DOM. The asking is in parcelsFetch.ts; this decides
 * which record is which house, and what its numbers mean. Checked by
 * scripts/investment-check.ts, which runs it with no dependencies.
 *
 * THE SOURCE is MassGIS's Level 3 assessor parcels — every city and town's own
 * assessing records, standardised by the Commonwealth, free, keyless and
 * readable from this site's pages (CORS answers kevinhoang.co; checked
 * 2026-10-19). It is the one place the investment pages can learn what the MLS
 * feed does not carry: the split between land and building, the zoning
 * district, and a lot size that is not the listing agent's.
 *
 * WHY MATCHING IS THE HARD PART. Every town writes its own addresses. Measured
 * 2026-10-19 with an exact `SITE_ADDR IN (…)` match, Newton found 105 of 139
 * single-family listings and Quincy 66 of 70 — and Medford found 7 of 45,
 * because Medford writes "MYSTIC AV" where the feed says "Mystic Ave", pads
 * with double spaces, and files "70-72 Stanley Ave" under "70". So a listing is
 * matched on the house number (any part of a range) and the street with its
 * suffix in one canonical USPS form, and the query asks for every record on a
 * street that STARTS with the listing's first street word — loose on purpose,
 * then narrowed here.
 *
 * WHAT THESE NUMBERS ARE. Assessed values, by Massachusetts law full and fair
 * cash value as of 1 January before the fiscal year — not a sale price and not
 * an appraisal. Towns revalue on their own schedules, so FY is shown beside
 * every figure (Needham was FY2025 and Quincy FY2027 on the day this was
 * written). The owner fields are never requested: nothing on these pages needs
 * to know who owns a house.
 */
import { USPS_SUFFIXES } from './massgis.ts';

export const PARCELS_LAYER =
  'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/L3Parcels_feature_service/FeatureServer/0';

/** Exactly the fields read below. OWNER1, OWN_ADDR and the rest are never asked for. */
export const PARCEL_FIELDS = [
  'LOC_ID',
  'SITE_ADDR',
  'ADDR_NUM',
  'FULL_STR',
  'LOCATION',
  'CITY',
  'BLDG_VAL',
  'LAND_VAL',
  'OTHER_VAL',
  'TOTAL_VAL',
  'FY',
  'LOT_SIZE',
  'LOT_UNITS',
  'USE_CODE',
  'ZONING',
  'YEAR_BUILT',
  'BLD_AREA',
  'RES_AREA',
  'UNITS',
  'STYLE',
  'LS_DATE',
  'LS_PRICE',
  'Shape__Area',
] as const;

/** One record as the layer returns it. Every field may be null. */
export type ParcelAttributes = Partial<Record<(typeof PARCEL_FIELDS)[number], string | number | null>>;

export interface Parcel {
  locId: string | null;
  address: string;
  /** Assessed values in dollars. */
  land: number | null;
  building: number | null;
  total: number | null;
  /** The fiscal year the values are for. */
  fy: number | null;
  lotSqft: number | null;
  /** 'assessor' when the town recorded it; 'polygon' when it is the mapped shape's area. */
  lotSource: 'assessor' | 'polygon' | null;
  useCode: string | null;
  useLabel: string | null;
  zoning: string | null;
  yearBuilt: number | null;
  /** Gross building area — what the ADU law's "half the floor area" is measured against. */
  grossArea: number | null;
  livingArea: number | null;
  units: number | null;
  lastSale: { date: string; price: number } | null;
  /** Land's share of the assessed total, 0–1. Null for a condo, whose "land" is the complex's. */
  landShare: number | null;
  /** True when the record was chosen by its unit number, not just its street address. */
  unitMatched: boolean;
}

/** A record, and whether its unit number is what chose it. */
export interface ParcelMatch {
  record: ParcelAttributes;
  unitMatched: boolean;
}

/* -------------------------------------------------------------------------- */
/* Reading a record                                                            */
/* -------------------------------------------------------------------------- */

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const positive = (v: unknown): number | null => {
  const n = num(v);
  return n !== null && n > 0 ? n : null;
};
const text = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : null;
  return s ? s : null;
};

const SQFT_PER_ACRE = 43_560;
const SQFT_PER_SQ_METRE = 10.763_910_4;

/**
 * The lot in square feet, and where that number came from.
 *
 * LOT_SIZE is "the deed area, in square feet or acres but not both", and
 * LOT_UNITS says which — 'Acres' in Newton, 'Sq. Ft.' elsewhere. When a town
 * left it blank the parcel's mapped area is used instead: the layer is in
 * Massachusetts State Plane metres (EPSG:26986), so Shape__Area is real square
 * metres, and the page says the figure was measured from the map.
 */
export const lotSquareFeet = (
  a: Pick<ParcelAttributes, 'LOT_SIZE' | 'LOT_UNITS' | 'Shape__Area'>
): { sqft: number; source: 'assessor' | 'polygon' } | null => {
  const size = positive(a.LOT_SIZE);
  const units = (text(a.LOT_UNITS) ?? '').toUpperCase();
  if (size !== null) {
    if (units.startsWith('AC')) return { sqft: Math.round(size * SQFT_PER_ACRE), source: 'assessor' };
    if (units.includes('SQ') || units.includes('SF') || units.includes('FT')) {
      return { sqft: Math.round(size), source: 'assessor' };
    }
    // No unit recorded: a "lot" under 100 is acres in every town that does it.
    return { sqft: Math.round(size < 100 ? size * SQFT_PER_ACRE : size), source: 'assessor' };
  }
  const area = positive(a.Shape__Area);
  return area !== null ? { sqft: Math.round(area * SQFT_PER_SQ_METRE), source: 'polygon' } : null;
};

/**
 * The Department of Revenue's property classes that matter here. A code the
 * table does not know is shown as its number, never guessed at.
 * Source: MA DOR Property Type Classification Codes.
 */
const USE_LABELS: Record<string, string> = {
  '101': 'Single-family',
  '102': 'Condominium',
  '103': 'Mobile home',
  '104': 'Two-family',
  '105': 'Three-family',
  '109': 'Several houses on one parcel',
  '111': 'Apartments, 4–8 units',
  '112': 'Apartments, more than 8 units',
  '121': 'Rooming house',
  '130': 'Developable residential land',
  '131': 'Potentially developable residential land',
  '132': 'Undevelopable residential land',
};

/** "1010" and "101" are the same class; towns write one or the other. */
export const propertyClass = (code: unknown): string | null => {
  const digits = (text(code) ?? '').replace(/\D/g, '');
  return digits.length >= 3 ? digits.slice(0, 3) : null;
};

export const parseParcel = (a: ParcelAttributes, unitMatched = false): Parcel => {
  const land = positive(a.LAND_VAL);
  const building = num(a.BLDG_VAL);
  const total = positive(a.TOTAL_VAL);
  const lot = lotSquareFeet(a);
  const cls = propertyClass(a.USE_CODE);
  const condo = cls === '102';
  const saleDate = text(a.LS_DATE);
  const salePrice = positive(a.LS_PRICE);
  return {
    locId: text(a.LOC_ID),
    address: text(a.SITE_ADDR) ?? '',
    land,
    building: building !== null && building >= 0 ? building : null,
    total,
    fy: positive(a.FY),
    lotSqft: condo ? null : lot?.sqft ?? null,
    lotSource: condo ? null : lot?.source ?? null,
    useCode: cls,
    useLabel: cls ? USE_LABELS[cls] ?? `Use code ${cls}` : null,
    zoning: text(a.ZONING),
    yearBuilt: positive(a.YEAR_BUILT),
    grossArea: positive(a.BLD_AREA),
    livingArea: positive(a.RES_AREA),
    units: positive(a.UNITS),
    // A deed recorded for $1 or $100 is a transfer, not a sale, and 19000101 is
    // the layer's "unknown". Neither is shown as a price somebody paid.
    lastSale:
      saleDate && /^\d{8}$/.test(saleDate) && !saleDate.startsWith('1900') && salePrice !== null && salePrice >= 1000
        ? {
            date: `${saleDate.slice(0, 4)}-${saleDate.slice(4, 6)}-${saleDate.slice(6, 8)}`,
            price: salePrice,
          }
        : null,
    landShare: !condo && land !== null && total !== null && total > 0 ? Math.min(1, land / total) : null,
    unitMatched,
  };
};

/* -------------------------------------------------------------------------- */
/* Addresses                                                                   */
/* -------------------------------------------------------------------------- */

/** Uppercase, punctuation dropped, single spaces. */
const squash = (s: string) =>
  s
    .toUpperCase()
    .replace(/[.,'’#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const DIRECTIONS: Record<string, string> = { NORTH: 'N', SOUTH: 'S', EAST: 'E', WEST: 'W' };
const ORDINALS: Record<string, string> = {
  FIRST: '1ST', SECOND: '2ND', THIRD: '3RD', FOURTH: '4TH', FIFTH: '5TH',
  SIXTH: '6TH', SEVENTH: '7TH', EIGHTH: '8TH', NINTH: '9TH', TENTH: '10TH',
};

/** Every canonical suffix, uppercase: "ST", "AVE", "RD"… */
const SUFFIX_FORMS = new Set(Object.values(USPS_SUFFIXES).map((v) => v.toUpperCase()));

/**
 * A street in one canonical form: "Elinor Road" and "ELINOR RD" both become
 * "ELINOR RD", "Mystic Av" and "Mystic Avenue" both "MYSTIC AVE", "South River
 * St" and "S RIVER ST" both "S RIVER ST", "Fellsway West" "FELLSWAY W",
 * "Saint Claire St" "ST CLAIRE ST" and "Second Street" "2ND ST".
 *
 * Only the LAST word is a suffix — "Court St" must not become "CT ST" — except
 * that a trailing "EXT" is kept and the suffix before it normalised, so "Mystic
 * St Ext" matches "MYSTIC STREET EXT". A note in brackets ("Fayette Street
 * (Rear)") is dropped. Both sides of a match go through this, so a rewrite
 * that is odd on its own ("WEST ST" -> "W ST") is harmless: it is odd the same
 * way on both.
 */
export const canonicalStreet = (street: string): string => {
  const words = squash(street.replace(/\([^)]*\)/g, ' '))
    .split(' ')
    .filter(Boolean)
    .map((w, i) => (i === 0 && w === 'SAINT' ? 'ST' : DIRECTIONS[w] ?? ORDINALS[w] ?? w));
  const fix = (i: number) => {
    const w = words[i];
    if (i > 0 && USPS_SUFFIXES[w]) words[i] = USPS_SUFFIXES[w].toUpperCase();
  };
  const last = words.length - 1;
  if (last >= 0 && (words[last] === 'EXT' || words[last] === 'EXTENSION')) {
    words[last] = 'EXT';
    fix(last - 1);
  } else {
    fix(last);
  }
  return words.join(' ');
};

/** Whether a canonical street ends in a suffix. "MORLEY" does not; the agent left it off. */
const hasSuffix = (canonical: string) => {
  const words = canonical.split(' ');
  const last = words[words.length - 1] === 'EXT' ? words[words.length - 2] : words[words.length - 1];
  return words.length > 1 && SUFFIX_FORMS.has(last ?? '');
};

/**
 * One house number in one form: "90 -96" (how Waltham files it), "84 86",
 * "819 & 825" and "82-84" all become "90-96", "84-86", "819-825", "82-84".
 */
export const normalNumber = (raw: string | null): string =>
  squash(raw ?? '')
    .replace(/\s*(?:-|&|\bAND\b)\s*/g, '-')
    .replace(/^(\d+[A-Z]?) (\d+[A-Z]?)$/, '$1-$2');

/**
 * The house number in every form a town might have filed it under: "82-84"
 * is "82-84", "82" or "84"; "70A" is "70A" or "70". Anything that is not a
 * number ("Lot 3", "0") gives nothing, and the listing simply goes unmatched.
 */
export const numberVariants = (raw: string | null): string[] => {
  const s = normalNumber(raw);
  if (!/^\d/.test(s) || /^0+$/.test(s)) return [];
  const out = new Set<string>([s]);
  for (const part of s.split('-')) {
    const m = part.match(/^(\d+)([A-Z])?$/);
    if (!m || /^0+$/.test(m[1])) continue;
    out.add(part);
    out.add(m[1]);
  }
  return [...out];
};

/**
 * What to put in the query's ADDR_NUM IN (…): every variant, plus a range
 * spelled the ways towns spell one ("90 -96", "90 - 96"), since the layer
 * compares strings exactly.
 */
const numberQueryForms = (variants: string[]): string[] => {
  const out = new Set(variants);
  for (const v of variants) {
    if (!v.includes('-')) continue;
    out.add(v.replace('-', ' -'));
    out.add(v.replace('-', ' - '));
    out.add(v.replace('-', '- '));
  }
  return [...out];
};

export interface AddressParts {
  /** The number as written, normalised. */
  number: string;
  numbers: string[];
  /** Canonical, as canonicalStreet gives it. */
  street: string;
  /** The unit, as a bare token ("308", "2B"), or null. */
  unit: string | null;
}

/**
 * A listing's address in matchable parts, from the feed's separate street
 * columns when it has them and from the address line when it does not.
 */
export const addressParts = (l: {
  street_no?: string | null;
  street_name?: string | null;
  unit_no?: string | null;
  address?: string | null;
}): AddressParts | null => {
  let no = l.street_no ?? null;
  let name = l.street_name ?? null;
  if (!no || !name) {
    // "52 Elinor Rd Unit 3" -> "52", "Elinor Rd"
    const line = (l.address ?? '').replace(/\s+(unit|apt|apartment|suite|ste|#)\b.*$/i, '').trim();
    const m = line.match(/^(\d[\w-]*)\s+(.+)$/);
    if (!m) return null;
    no = no ?? m[1];
    name = name ?? m[2];
  }
  const numbers = numberVariants(no);
  const street = canonicalStreet(name);
  if (!numbers.length || !street) return null;
  const unit = squash(l.unit_no ?? '').replace(/^(UNIT|APT|APARTMENT|SUITE|STE)\s+/, '').trim() || null;
  return { number: normalNumber(no), numbers, street, unit };
};

/**
 * What FULL_STR must start with. Loose on purpose: a direction or "Saint" is
 * matched on its first letter, because the town may have spelled it out; an
 * ordinal both ways.
 */
const streetPrefixes = (street: string): string[] => {
  const first = street.split(' ')[0];
  if (first.length === 1 || first === 'ST') return [first[0]];
  const spelled = Object.entries(ORDINALS).find(([, short]) => short === first)?.[0];
  return spelled ? [first, spelled] : [first];
};

/** Single quotes doubled, so an O'Brien Rd cannot break out of the string. */
const sqlString = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** The layer's CITY for a feed town: "Newton" -> "NEWTON". */
export const parcelCity = (town: string) => squash(town);

/**
 * The `where` clause for one batch of addresses in one town.
 *
 * Loose on purpose — the house number and the FIRST street word — because the
 * rest of a street is where the towns disagree. matchParcel then keeps only
 * the record whose whole street, in canonical form, is the listing's.
 */
export const parcelWhere = (town: string, parts: AddressParts[]): string => {
  const clauses = parts.map((p) => {
    const like = streetPrefixes(p.street)
      .map((prefix) => `FULL_STR LIKE ${sqlString(`${prefix}%`)}`)
      .join(' OR ');
    return `(ADDR_NUM IN (${numberQueryForms(p.numbers).map(sqlString).join(',')}) AND (${like}))`;
  });
  return `CITY = ${sqlString(parcelCity(town))} AND (${clauses.join(' OR ')})`;
};

/** How many addresses one request carries. The where clause stays well under any limit. */
export const PARCEL_BATCH = 50;

export const batches = <T>(items: T[], size = PARCEL_BATCH): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/**
 * Of several records for one address, the one that is the house.
 *
 * A parcel can be "stacked" — a condominium, or several buildings on one lot.
 * The unit's own record wins when the unit is known. A listing with a unit
 * whose unit is NOT among several records gets none: one condo's value beside
 * another condo's listing is the neighbour's-land-value mistake again. Without
 * a unit, the residential record with land on it wins, then the most valuable.
 */
export const pickRecord = (candidates: ParcelAttributes[], unit: string | null): ParcelMatch | null => {
  if (!candidates.length) return null;
  if (unit) {
    const u = squash(unit);
    const byUnit = candidates.find((c) => {
      const loc = squash(String(c.LOCATION ?? '')).replace(/^(UNIT|APT)\s+/, '');
      return loc === u || loc.endsWith(` ${u}`);
    });
    if (byUnit) return { record: byUnit, unitMatched: true };
    if (candidates.length > 1) return null;
  }
  const score = (c: ParcelAttributes) =>
    ((propertyClass(c.USE_CODE) ?? '').startsWith('1') ? 2 : 0) + ((positive(c.LAND_VAL) ?? 0) > 0 ? 1 : 0);
  const best = [...candidates].sort(
    (a, b) => score(b) - score(a) || (positive(b.TOTAL_VAL) ?? 0) - (positive(a.TOTAL_VAL) ?? 0)
  )[0];
  return { record: best, unitMatched: false };
};

/**
 * Whether a parcel may be shown beside a listing of this type. A condo's
 * figures must be its OWN unit's — a condominium record chosen by its unit
 * number. The building's record, or a parking space's, is not the condo.
 */
export const parcelFits = (propType: string | null, parcel: Parcel | null | undefined): Parcel | null => {
  if (!parcel) return null;
  if (propType === 'CC') return parcel.useCode === '102' && parcel.unitMatched ? parcel : null;
  return parcel;
};

/**
 * The listing's own record among a street's candidates, or null.
 *
 * The number must be the same once normalised — or, failing that, share a
 * part with it ("131" and "129-131") — and the street must be the same in
 * canonical form. A listing whose agent left the suffix off ("9 Morley")
 * matches a "MORLEY RD" when that is the ONLY street it could be; with a
 * "PEARL ST" and a "PEARL AVE" both carrying the number it matches neither,
 * because a guess between two houses is how the wrong land value ends up
 * beside a listing.
 */
export const matchParcel = (parts: AddressParts, candidates: ParcelAttributes[]): ParcelMatch | null => {
  const streetOf = (c: ParcelAttributes) => canonicalStreet(String(c.FULL_STR ?? ''));
  const sameStreet = (c: ParcelAttributes) => {
    const s = streetOf(c);
    if (s === parts.street) return true;
    if (hasSuffix(parts.street) || !s.startsWith(`${parts.street} `)) return false;
    return SUFFIX_FORMS.has(s.slice(parts.street.length + 1));
  };
  const sameNumber = (c: ParcelAttributes) => normalNumber(String(c.ADDR_NUM ?? '')) === parts.number;
  const wanted = new Set(parts.numbers);
  const sharesPart = (c: ParcelAttributes) =>
    numberVariants(String(c.ADDR_NUM ?? '')).some((n) => wanted.has(n));

  for (const sameHouse of [sameNumber, sharesPart]) {
    const hits = candidates.filter((c) => sameHouse(c) && sameStreet(c));
    if (!hits.length) continue;
    // No suffix, and two real streets carry the number: only an exact street could decide.
    if (new Set(hits.map(streetOf)).size > 1) return null;
    return pickRecord(hits, parts.unit);
  }
  return null;
};

/* -------------------------------------------------------------------------- */
/* The lots around it                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The typical single-family lot in a zoning district — what "big" means for
 * THIS lot. Computed by the layer itself (a median per lot unit), so it is one
 * small request however many parcels the district has: Newton's SR3 is 5,695
 * single-family parcels, median 0.1835 acres (2026-10-20).
 *
 * Zoning is null in some towns' records (all of Wellesley's), and then the
 * comparison is with every single-family lot in town, and says so.
 */
export interface LotContext {
  scope: 'district' | 'town';
  zoning: string | null;
  n: number;
  medianSqft: number;
}

export const lotStatsWhere = (town: string, zoning: string | null): string =>
  `CITY = ${sqlString(parcelCity(town))}${zoning ? ` AND ZONING = ${sqlString(zoning)}` : ''} AND USE_CODE LIKE '101%' AND LOT_SIZE > 0`;

export const LOT_STATS = JSON.stringify([
  { statisticType: 'count', onStatisticField: 'LOT_SIZE', outStatisticFieldName: 'n' },
  {
    statisticType: 'PERCENTILE_CONT',
    onStatisticField: 'LOT_SIZE',
    statisticParameters: { value: 0.5 },
    outStatisticFieldName: 'median',
  },
]);

/**
 * The layer answers one row per LOT_UNITS ("Acres", "Sq. Ft."); the unit most
 * of the district's parcels use is the one read. Too few parcels to call a
 * median a median gives null.
 */
export const parseLotStats = (
  rows: { attributes: Record<string, unknown> }[],
  scope: LotContext['scope'],
  zoning: string | null
): LotContext | null => {
  const groups = rows
    .map((r) => {
      const a = r.attributes;
      const n = Number(a.N ?? a.n);
      const med = Number(a.MEDIAN ?? a.median);
      const lot = lotSquareFeet({ LOT_SIZE: med, LOT_UNITS: (a.LOT_UNITS as string) ?? null });
      return { n, sqft: lot?.sqft ?? null };
    })
    .filter((g): g is { n: number; sqft: number } => Number.isFinite(g.n) && g.n > 0 && g.sqft !== null)
    .sort((a, b) => b.n - a.n);
  const top = groups[0];
  if (!top || top.n < 20) return null;
  return { scope, zoning, n: groups.reduce((s, g) => s + g.n, 0), medianSqft: top.sqft };
};
