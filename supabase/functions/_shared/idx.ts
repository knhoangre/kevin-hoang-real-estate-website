/**
 * Parser for the MLS PIN IDX download feeds.
 *
 * PORTED from the working implementation in the real-estate-marketing project
 * (src/lib/idx.ts), whose format notes were confirmed against real active and
 * sold feeds for all four property types. Nothing here was inferred from a
 * sample — guessing at a positional layout silently mis-assigns columns, and a
 * feed that parses without throwing but puts the price in the bedroom field is
 * far worse than one that fails loudly.
 *
 * Format:
 *   - Pipe (`|`) delimited, CRLF line endings, one record per physical line.
 *   - First line is a header row of unquoted column names.
 *   - Text fields are double-quoted, with an embedded quote escaped by doubling
 *     it (`""`). A quoted field MAY contain a literal `|`, so the split has to
 *     be quote-aware. Numeric and empty fields are bare.
 *   - Column ORDER differs between files, so columns are resolved by header
 *     NAME. Names are stable except beds/baths, which are NO_BEDROOMS /
 *     NO_FULL_BATHS / NO_HALF_BATHS everywhere except multi-family, which uses
 *     TOTAL_BRS / TOTAL_FULL_BATHS / TOTAL_HALF_BATHS.
 *
 * Differences from the port, and why:
 *   - Full and half baths are kept SEPARATE rather than combined into "2.5".
 *     This site renders MLS convention ("2.1" = two full and one half) through
 *     formatBaths() in src/lib/listings.ts, and the sold listings already use
 *     it — one bath convention per site or the IDX results and the sold pages
 *     disagree on the same page.
 *   - Town, state and ZIP are kept as separate columns instead of a single
 *     "City, State ZIP" string, because /search filters by town.
 */

import { IDX_TOWNS } from './idx-towns.ts';

export interface IdxListing {
  mlsNumber: string;
  status: string | null;
  propType: string | null;
  address: string | null;
  town: string | null;
  state: string | null;
  zip: string | null;
  listPrice: number | null;
  salePrice: number | null;
  bedrooms: number | null;
  fullBaths: number | null;
  halfBaths: number | null;
  livingArea: number | null;
  /** Attribution. MLS PIN requires the listing office be shown on every listing. */
  listOfficeId: string | null;
  listAgentId: string | null;
  settledDate: string | null;
  /**
   * How many photos media.mlspin.com holds for this listing.
   *
   * The feed states it outright, which means photo URLs can be built straight
   * from the count. The other implementation of this discovered the count by
   * HEAD-probing indices until the response matched the byte size of the
   * "no photo available" placeholder — clever, and unnecessary here: that is up
   * to 60 requests per listing across thousands of listings, against a host we
   * do not own.
   */
  photoCount: number | null;
  /** Public marketing remarks — the only listing prose IDX permits displaying. */
  remarks: string | null;
  yearBuilt: number | null;
  style: string | null;

  /*
   * Detail fields, added so /search/<mls> can say more than beds and baths.
   *
   * ONLY fields that are numeric, boolean, or free text are modelled. Most of
   * the feed's descriptive columns are CODED — HEATING is "B,N", APPLIANCES is
   * "A,C,F,I,K,L", STYLE is "A" — and the lookup tables for those codes are in
   * the Field Reference behind the MLS PIN login. Rendering "Heating: B,N"
   * tells a reader nothing, and guessing at expansions would be inventing
   * details about another firm's listing. They are deliberately not stored
   * until the codebook is available; a re-sync takes an hour to backfill them.
   */
  totalRooms: number | null;
  lotSize: number | null;
  acres: number | null;
  garageSpaces: number | null;
  parkingSpaces: number | null;
  basement: boolean | null;
  taxes: number | null;
  taxYear: number | null;
  neighborhood: string | null;
  color: string | null;
  waterfront: boolean | null;
  adultCommunity: boolean | null;
  hoa: boolean | null;
  hoaFee: number | null;
  numUnits: number | null;
  unitLevel: number | null;
  dateAvailable: string | null;
  sqftAboveGrade: number | null;
  sqftBelowGrade: number | null;

  /*
   * Coded fields, stored as the feed's RAW codes ("B,N", "A,C,F,I,K,L").
   *
   * Decoded in the browser by src/lib/idx-codes.ts rather than here, for two
   * reasons. Storing the expansions would add roughly 400 bytes a row across
   * 124,000 rows for text the codebook can reconstruct; and a codebook
   * correction would then require a full re-sync to take effect, instead of
   * shipping with the next deploy.
   *
   * The codes are meaningless without the property type — HEATING "C" is "Gas"
   * on a rental and "Hot Water Baseboard" on a condo — so anything that renders
   * these must pass propType alongside.
   *
   * FOUNDATION, AMENITIES and LEAD_PAINT are absent on purpose: they are in the
   * MLS but not in the IDX export, which carries only the fields Attachment C
   * permits. Measured at 0% fill before being removed rather than assumed.
   */
  heating: string | null;
  cooling: string | null;
  water: string | null;
  sewer: string | null;
  hotWater: string | null;
  appliances: string | null;
  flooring: string | null;
  interiorFeatures: string | null;
  exteriorFeatures: string | null;
  exterior: string | null;
  construction: string | null;
  roofMaterial: string | null;
  basementFeature: string | null;
  garageParking: string | null;
  parkingFeature: string | null;
  lotDescription: string | null;
  electricFeature: string | null;
  energyFeatures: string | null;
  roadType: string | null;
  laundryFeatures: string | null;
  petsAllowed: string | null;
  poolDescription: string | null;
  unitPlacement: string | null;
  waterfrontDesc: string | null;
  waterviewFeatures: string | null;
  yearBuiltDescrp: string | null;
  /** SF_TYPE / CC_TYPE / MF_TYPE / RN_TYPE — one field per property type. */
  propSubtype: string | null;
}

/** Candidate header names per logical field, in priority order. */
const FIELD_ALIASES = {
  mlsNumber: ['LIST_NO'],
  status: ['STATUS'],
  propType: ['PROP_TYPE'],
  streetNo: ['STREET_NO'],
  streetName: ['STREET_NAME'],
  unitNo: ['UNIT_NO'],
  townNum: ['TOWN_NUM'],
  zip: ['ZIP_CODE'],
  state: ['STATE'],
  listPrice: ['LIST_PRICE'],
  salePrice: ['SALE_PRICE'],
  beds: ['NO_BEDROOMS', 'TOTAL_BRS'],
  fullBaths: ['NO_FULL_BATHS', 'TOTAL_FULL_BATHS'],
  halfBaths: ['NO_HALF_BATHS', 'TOTAL_HALF_BATHS'],
  baths: ['NO_BATHS'],
  sqft: ['SQUARE_FEET'],
  listAgentId: ['LIST_AGENT'],
  listOfficeId: ['LIST_OFFICE'],
  settledDate: ['SETTLED_DATE'],
  photoCount: ['PHOTO_COUNT'],
  remarks: ['REMARKS'],
  yearBuilt: ['YEAR_BUILT'],
  style: ['STYLE', 'SF_TYPE'],
  totalRooms: ['NO_ROOMS', 'TOTAL_RMS'],
  lotSize: ['LOT_SIZE'],
  acres: ['ACRE'],
  garageSpaces: ['GARAGE_SPACES'],
  parkingSpaces: ['TOTAL_PARKING', 'PARKING_SPACES'],
  basement: ['BASEMENT'],
  taxes: ['TAXES'],
  taxYear: ['TAX_YEAR'],
  neighborhood: ['NEIGHBORHOOD'],
  color: ['COLOR'],
  waterfront: ['WATERFRONT_FLAG'],
  adultCommunity: ['ADULT_COMMUNITY'],
  hoa: ['HOME_OWN_ASSOCIATION'],
  hoaFee: ['HOA_FEE'],
  numUnits: ['NO_UNITS'],
  unitLevel: ['UNIT_LEVEL'],
  dateAvailable: ['DATE_AVAILABLE'],
  sqftAboveGrade: ['AboveGradeFinishedArea'],
  sqftBelowGrade: ['BelowGradeFinishedArea'],
  heating: ['HEATING'],
  cooling: ['COOLING'],
  water: ['WATER'],
  sewer: ['SEWER'],
  hotWater: ['HOT_WATER'],
  appliances: ['APPLIANCES'],
  flooring: ['FLOORING'],
  interiorFeatures: ['INTERIOR_FEATURES', 'INTERIOR_BLDG_FEAT', 'IFE'],
  exteriorFeatures: ['EXTERIOR_FEATURES', 'EXTERIOR_UNIT_FEATURES'],
  exterior: ['EXTERIOR'],
  construction: ['CONSTRUCTION'],
  roofMaterial: ['ROOF_MATERIAL'],
  basementFeature: ['BASEMENT_FEATURE'],
  garageParking: ['GARAGE_PARKING'],
  parkingFeature: ['PARKING_FEATURE'],
  lotDescription: ['LOT_DESCRIPTION'],
  electricFeature: ['ELECTRIC_FEATURE'],
  energyFeatures: ['ENERGY_FEATURES'],
  roadType: ['ROAD_TYPE'],
  laundryFeatures: ['LAUNDRY_FEATURES'],
  petsAllowed: ['PETS_ALLOWED'],
  poolDescription: ['POOL_DESCRIPTION'],
  unitPlacement: ['UNIT_PLACEMENT'],
  waterfrontDesc: ['WATERFRONT'],
  waterviewFeatures: ['WATERVIEW_FEATURES'],
  yearBuiltDescrp: ['YEAR_BUILT_DESCRP'],
  // One of these exists per feed, never more than one.
  propSubtype: ['SF_TYPE', 'CC_TYPE', 'MF_TYPE', 'RN_TYPE'],
} as const;

type FieldKey = keyof typeof FIELD_ALIASES;

/**
 * Split one line into fields, honouring quote wrapping, `""` escapes, and
 * literal `|` inside a quoted field.
 */
export function splitLine(line: string): string[] {
  const fields: string[] = [];
  const n = line.length;
  let i = 0;

  while (i <= n) {
    if (i === n) {
      // Trailing empty field (the line ended on a delimiter), or an empty line.
      fields.push('');
      break;
    }

    if (line[i] === '"') {
      i++;
      let buf = '';
      while (i < n) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            buf += '"';
            i += 2;
          } else {
            i++; // closing quote
            break;
          }
        } else {
          buf += line[i];
          i++;
        }
      }
      fields.push(buf);
      if (i < n && line[i] === '|') {
        i++;
        if (i === n) fields.push('');
      } else {
        break;
      }
    } else {
      const j = line.indexOf('|', i);
      if (j === -1) {
        fields.push(line.slice(i));
        break;
      }
      fields.push(line.slice(i, j));
      i = j + 1;
      if (i === n) fields.push('');
    }
  }

  return fields;
}

const clean = (v: string | undefined): string | null => {
  if (v == null) return null;
  const t = v.trim();
  return t === '' ? null : t;
};

/** A number, or null. Never NaN and never 0 standing in for "unknown". */
const num = (v: string | null): number | null => {
  if (v == null) return null;
  const n = Number(v.replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : null;
};

/** "STREET_NO STREET_NAME Unit UNIT_NO", skipping whatever is missing. */
const buildAddress = (
  streetNo: string | null,
  streetName: string | null,
  unitNo: string | null
): string | null => {
  const base = [streetNo, streetName].filter(Boolean).join(' ').trim();
  if (unitNo) return base ? `${base} Unit ${unitNo}` : `Unit ${unitNo}`;
  return base || null;
};

/**
 * Full and half baths, falling back to parsing the "3f;1h" summary field when
 * the individual counts are absent.
 */
const buildBaths = (
  full: string | null,
  half: string | null,
  summary: string | null
): { fullBaths: number | null; halfBaths: number | null } => {
  const f = num(full);
  if (f !== null) return { fullBaths: f, halfBaths: num(half) ?? 0 };

  if (summary) {
    const fm = /(\d+)\s*f/i.exec(summary);
    const hm = /(\d+)\s*h/i.exec(summary);
    if (fm) {
      return { fullBaths: Number(fm[1]), halfBaths: hm ? Number(hm[1]) : 0 };
    }
  }
  return { fullBaths: null, halfBaths: null };
};

/**
 * Y / N / U -> true / false / null.
 *
 * "U" means unknown in this feed and is roughly a third of the values on some
 * columns, so it has to become null rather than false: "no HOA" and "nobody
 * said" are different claims, and only one of them is safe to print.
 */
const yesNo = (v: string | null): boolean | null => {
  if (!v) return null;
  const t = v.trim().toUpperCase();
  if (t === 'Y') return true;
  if (t === 'N') return false;
  return null;
};

/**
 * A number that is meaningful, or null.
 *
 * Zero is discarded rather than displayed. TAXES, LOT_SIZE and ASSESSMENTS are
 * all "0" on a large share of rows — that is the field being unfilled, not a
 * home with no lot and no tax bill, and "Taxes: $0" is a false statement about
 * someone else's listing.
 */
const positive = (v: string | null): number | null => {
  const n = num(v);
  return n !== null && n > 0 ? n : null;
};

/** ISO date, or null. MLS PIN dates arrive as M/D/YYYY. */
const isoDate = (raw: string | null): string | null => {
  if (!raw) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (m) {
    const [, mo, d, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const iso = raw.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
};

/**
 * Build a per-line parser from a feed's header row.
 *
 * Separated from parseIdxFeed so a feed can be consumed as a STREAM. The sold
 * single-family file is 66 MB and 45,000 rows; holding it as a string (UTF-16
 * in the runtime, so ~132 MB) plus an array of parsed records exhausted the
 * Edge Function worker outright. Nothing needs the whole file at once.
 */
export function rowParser(headerLine: string): (line: string) => IdxListing | null {
  const header = headerLine.split('|').map((h) => h.trim());
  const colOf = new Map<string, number>();
  header.forEach((name, i) => {
    if (!colOf.has(name)) colOf.set(name, i);
  });

  const index: Partial<Record<FieldKey, number>> = {};
  for (const key of Object.keys(FIELD_ALIASES) as FieldKey[]) {
    for (const alias of FIELD_ALIASES[key]) {
      if (colOf.has(alias)) {
        index[key] = colOf.get(alias);
        break;
      }
    }
  }

  return (line: string): IdxListing | null => {
    if (line.trim() === '') return null;
    const fields = splitLine(line);
    const at = (key: FieldKey) => {
      const col = index[key];
      return col == null ? null : clean(fields[col]);
    };

    const mlsNumber = at('mlsNumber');
    // A row with no numeric MLS number is not a listing — it is a footer, a
    // wrapped line, or corruption. Skip rather than store a keyless record.
    if (!mlsNumber || !/^\d+$/.test(mlsNumber)) return null;

    const townNum = at('townNum');
    const { fullBaths, halfBaths } = buildBaths(
      at('fullBaths'),
      at('halfBaths'),
      at('baths')
    );

    return {
      mlsNumber,
      status: at('status'),
      propType: at('propType'),
      address: buildAddress(at('streetNo'), at('streetName'), at('unitNo')),
      // Resolved here rather than at render time: the feed carries only a
      // numeric code, and a listing that reaches the page as "MA 02494" is
      // useless on a site whose search is organised by town.
      town: townNum ? IDX_TOWNS[townNum] ?? null : null,
      state: at('state'),
      zip: at('zip'),
      listPrice: num(at('listPrice')),
      salePrice: num(at('salePrice')),
      bedrooms: num(at('beds')),
      fullBaths,
      halfBaths,
      livingArea: num(at('sqft')),
      listOfficeId: at('listOfficeId'),
      listAgentId: at('listAgentId'),
      settledDate: isoDate(at('settledDate')),
      photoCount: num(at('photoCount')),
      remarks: at('remarks'),
      yearBuilt: num(at('yearBuilt')),
      style: at('style'),
      totalRooms: positive(at('totalRooms')),
      /*
       * LOT_SIZE is square feet, except on 861 rows across the four active
       * feeds where someone typed acres into it — values like 0.03 and 0.94.
       * A three-hundredths-of-a-square-foot lot does not exist, so anything
       * under 100 is discarded rather than rendered as "Lot: 0.03 sq ft".
       * ACRE is filled on 97% of rows and is the field the page prefers
       * anyway, so nothing useful is lost.
       */
      lotSize: (() => {
        const n = positive(at('lotSize'));
        return n !== null && n >= 100 ? n : null;
      })(),
      acres: positive(at('acres')),
      // Zero garage spaces is a real, useful fact ("no garage"), unlike a zero
      // tax bill — so these use num() rather than positive().
      garageSpaces: num(at('garageSpaces')),
      parkingSpaces: num(at('parkingSpaces')),
      basement: yesNo(at('basement')),
      taxes: positive(at('taxes')),
      taxYear: positive(at('taxYear')),
      neighborhood: at('neighborhood'),
      color: at('color'),
      waterfront: yesNo(at('waterfront')),
      adultCommunity: yesNo(at('adultCommunity')),
      hoa: yesNo(at('hoa')),
      hoaFee: positive(at('hoaFee')),
      numUnits: positive(at('numUnits')),
      unitLevel: num(at('unitLevel')),
      dateAvailable: isoDate(at('dateAvailable')),
      sqftAboveGrade: positive(at('sqftAboveGrade')),
      sqftBelowGrade: positive(at('sqftBelowGrade')),
      heating: at('heating'),
      cooling: at('cooling'),
      water: at('water'),
      sewer: at('sewer'),
      hotWater: at('hotWater'),
      appliances: at('appliances'),
      flooring: at('flooring'),
      interiorFeatures: at('interiorFeatures'),
      exteriorFeatures: at('exteriorFeatures'),
      exterior: at('exterior'),
      construction: at('construction'),
      roofMaterial: at('roofMaterial'),
      basementFeature: at('basementFeature'),
      garageParking: at('garageParking'),
      parkingFeature: at('parkingFeature'),
      lotDescription: at('lotDescription'),
      electricFeature: at('electricFeature'),
      energyFeatures: at('energyFeatures'),
      roadType: at('roadType'),
      laundryFeatures: at('laundryFeatures'),
      petsAllowed: at('petsAllowed'),
      poolDescription: at('poolDescription'),
      unitPlacement: at('unitPlacement'),
      waterfrontDesc: at('waterfrontDesc'),
      waterviewFeatures: at('waterviewFeatures'),
      yearBuiltDescrp: at('yearBuiltDescrp'),
      propSubtype: at('propSubtype'),
    };
  };
}

/**
 * Parse a whole feed held in memory. Used by local tooling against the sample
 * files; the Edge Function streams instead — see rowParser above.
 *
 * Never throws on a malformed row: that row is skipped and the rest of the file
 * still ingests. A single bad record must not cost us the feed.
 */
export function parseIdxFeed(text: string): IdxListing[] {
  const lines = text.split(/\r\n|\n|\r/);

  let headerIdx = 0;
  while (headerIdx < lines.length && lines[headerIdx].trim() === '') headerIdx++;
  if (headerIdx >= lines.length) return [];

  const parse = rowParser(lines[headerIdx]);
  const listings: IdxListing[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parse(lines[i]);
    if (row) listings.push(row);
  }
  return listings;
}
