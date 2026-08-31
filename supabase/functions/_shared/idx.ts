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
  /** Every column verbatim, so a field we do not model yet is not lost. */
  raw: Record<string, string>;
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
 * Parse a whole feed file.
 *
 * Never throws on a malformed row — that row is skipped and the rest of the
 * file still ingests. A single bad record must not cost us the feed, the same
 * reasoning as one bad photo not costing us the whole listing snapshot.
 */
export function parseIdxFeed(text: string): IdxListing[] {
  const lines = text.split(/\r\n|\n|\r/);

  let headerIdx = 0;
  while (headerIdx < lines.length && lines[headerIdx].trim() === '') headerIdx++;
  if (headerIdx >= lines.length) return [];

  const header = lines[headerIdx].split('|').map((h) => h.trim());
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

  const listings: IdxListing[] = [];

  for (let li = headerIdx + 1; li < lines.length; li++) {
    if (lines[li].trim() === '') continue;
    const fields = splitLine(lines[li]);
    const at = (key: FieldKey) => {
      const col = index[key];
      return col == null ? null : clean(fields[col]);
    };

    const mlsNumber = at('mlsNumber');
    // A row with no numeric MLS number is not a listing — it is a footer, a
    // wrapped line, or corruption. Skip rather than store a keyless record.
    if (!mlsNumber || !/^\d+$/.test(mlsNumber)) continue;

    const townNum = at('townNum');
    const { fullBaths, halfBaths } = buildBaths(
      at('fullBaths'),
      at('halfBaths'),
      at('baths')
    );

    listings.push({
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
      raw: Object.fromEntries(header.map((name, i) => [name, fields[i] ?? ''])),
    });
  }

  return listings;
}
