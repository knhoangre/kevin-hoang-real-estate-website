/**
 * Massachusetts address lookup, from MassGIS's statewide address points.
 *
 * Type "151 wash" and get "151 Washington St, Cambridge, MA 02139" — with the
 * town and ZIP filled in, which is the part people most often do not know.
 *
 * WHY MASSGIS. It is the Commonwealth's own Master Address Data: every address
 * point in the state, maintained with the municipalities, free, keyless, and
 * served from a GeocodeServer with a `suggest` operation built for exactly this.
 * Its CORS policy allows kevinhoang.co directly (verified 2026-09-26), so this
 * runs in the browser with no proxy and no key to leak. Google's Places API is
 * better known but needs a billed key; Nominatim's usage policy forbids
 * autocomplete outright; the US Census geocoder has no suggest operation at all.
 *
 * ONE CANONICAL SPELLING IS THE POINT, not just speed. Free text is how
 * "12 Elm St" and "12 Elm Street" became two properties no list could group —
 * the reason AdminApplications offered only a reuse picker. Picking from the
 * state's own address list gives every address one spelling, normalised below
 * to USPS suffix abbreviations.
 *
 * TWO QUERIES, ONE LOCAL AND ONE STATEWIDE. The locator's `location` bias barely
 * moves its ranking — "151 wash" biased to Needham still led with Fairhaven —
 * and it ignores a town typed after the street. A `searchExtent` box DOES
 * restrict it, so a query boxed to Greater Boston and MetroWest runs beside an
 * unboxed one: local matches first, the rest of the state after, deduplicated.
 * Anything outside the box is still reachable, one scroll further down.
 *
 * FAILURE IS SILENT AND HARMLESS. A timeout or an outage returns no
 * suggestions, and the field stays a plain text input. Nothing here may block
 * an admin from typing an address by hand.
 */

export const LOCATOR =
  'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/ONLYPOINTS_SUGGEST_PRO/GeocodeServer';

/**
 * Greater Boston and MetroWest, generously: Concord to Braintree, Framingham
 * to the harbour. Covers all seventeen towns in SITE.areaServed with margin.
 * WGS84, which the locator accepts with an explicit spatialReference.
 */
const LOCAL_EXTENT = {
  xmin: -71.6,
  ymin: 42.15,
  xmax: -70.95,
  ymax: 42.55,
  spatialReference: { wkid: 4326 },
};

/** A suggestion, parsed into the fields an address form actually has. */
export interface AddressSuggestion {
  /** "151 Washington St" — number and street, no unit. */
  street: string;
  /** "Cambridge" — the postal community, which can be a neighbourhood ("Hyde Park"). */
  town: string;
  state: string;
  /** Five digits, leading zero intact. */
  zip: string;
  /**
   * The building's unit range when MassGIS records one — "#1-12" — as a HINT for
   * the unit field, never a value for it. A range says the building has units,
   * not which one is being let.
   */
  unitHint: string | null;
  /** The one-line form for display in the list. */
  label: string;
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * USPS Publication 28 suffix abbreviations for the suffixes that actually occur
 * in Massachusetts addresses. MassGIS spells them inconsistently — "WASHINGTON
 * ST" and "WASHINGTON STREET" both appear in the same result list — so without
 * this the one-canonical-spelling argument above would be false.
 */
const SUFFIXES: Record<string, string> = {
  STREET: 'St', ST: 'St',
  AVENUE: 'Ave', AVE: 'Ave', AV: 'Ave',
  ROAD: 'Rd', RD: 'Rd',
  DRIVE: 'Dr', DR: 'Dr',
  LANE: 'Ln', LN: 'Ln',
  COURT: 'Ct', CT: 'Ct',
  PLACE: 'Pl', PL: 'Pl',
  CIRCLE: 'Cir', CIR: 'Cir',
  BOULEVARD: 'Blvd', BLVD: 'Blvd',
  TERRACE: 'Ter', TER: 'Ter',
  PARKWAY: 'Pkwy', PKWY: 'Pkwy',
  HIGHWAY: 'Hwy', HWY: 'Hwy',
  SQUARE: 'Sq', SQ: 'Sq',
  EXTENSION: 'Ext', EXT: 'Ext',
  TRAIL: 'Trl', TRL: 'Trl',
  PATH: 'Path',
  WAY: 'Way',
  ROW: 'Row',
  PARK: 'Park',
  HILL: 'Hill',
};

/** Directionals stay as the single capital USPS uses: "N Main St". */
const DIRECTIONALS = new Set(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW']);

/**
 * "WASHINGTON" -> "Washington", "O'BRIEN" -> "O'Brien", "1ST" -> "1st".
 * Hyphenated and apostrophe'd parts are capitalised separately.
 */
const titleWord = (w: string): string => {
  if (/^\d/.test(w)) return w.toLowerCase(); // 1ST -> 1st, 151 stays 151
  return w
    .toLowerCase()
    .replace(/(^|[-'’])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
};

/** A street line from MassGIS's uppercase, abbreviated as the USPS would. */
export const formatStreet = (raw: string): string => {
  const words = raw.trim().split(/\s+/).filter(Boolean);
  return words
    .map((w, i) => {
      const upper = w.toUpperCase();
      // Only the LAST word is a suffix. "Court St" must not become "Ct St".
      if (i === words.length - 1 && i > 0 && SUFFIXES[upper]) return SUFFIXES[upper];
      if (DIRECTIONALS.has(upper) && i > 0) return upper;
      return titleWord(w);
    })
    .join(' ');
};

/**
 * Parse one suggestion line: "151 WASHINGTON STREET (#1-12), CAMBRIDGE, MA, 02139".
 *
 * Parsed from the RIGHT, because the street is the only part that may itself
 * contain a comma, and ZIP, state and town are always the last three parts.
 * Null for anything that does not end in a two-letter state and a five-digit
 * ZIP — a malformed suggestion is dropped rather than half-filled into a form.
 */
export const parseSuggestion = (text: string): AddressSuggestion | null => {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 4) return null;

  const zip = parts[parts.length - 1];
  const state = parts[parts.length - 2].toUpperCase();
  const townRaw = parts[parts.length - 3];
  let streetRaw = parts.slice(0, parts.length - 3).join(', ');

  if (!/^\d{5}$/.test(zip) || !/^[A-Z]{2}$/.test(state) || !townRaw || !streetRaw) return null;

  const unit = /\(\s*(#[^)]*)\)/.exec(streetRaw);
  streetRaw = streetRaw.replace(/\(\s*#[^)]*\)/, '').trim();

  const street = formatStreet(streetRaw);
  const town = townRaw.split(/\s+/).map(titleWord).join(' ');
  return {
    street,
    town,
    state,
    zip,
    unitHint: unit ? unit[1].trim() : null,
    label: `${street}, ${town}, ${state} ${zip}`,
  };
};

/* -------------------------------------------------------------------------- */
/* Fetching                                                                    */
/* -------------------------------------------------------------------------- */

/** Worth asking about: some digits and at least a couple of letters of street. */
export const isWorthSuggesting = (text: string): boolean =>
  /\d/.test(text) && /[a-z]{2,}/i.test(text.replace(/\d/g, ''));

const suggest = async (
  text: string,
  extent: typeof LOCAL_EXTENT | null,
  signal: AbortSignal
): Promise<string[]> => {
  const params = new URLSearchParams({ text, maxSuggestions: '10', f: 'json' });
  if (extent) params.set('searchExtent', JSON.stringify(extent));
  const res = await fetch(`${LOCATOR}/suggest?${params.toString()}`, { signal });
  if (!res.ok) return [];
  const body = (await res.json()) as { suggestions?: { text?: string }[] };
  return (body.suggestions ?? []).map((s) => s.text ?? '').filter(Boolean);
};

/**
 * Suggestions for what has been typed, local ones first.
 *
 * `preferTowns` floats matches in those towns to the top of the local group —
 * the served towns, in practice — because a rental Kevin is letting is far
 * likelier to be in Needham than in Chelsea even when both sit inside the box.
 *
 * Deduplicated on the parsed label, since the two queries overlap and MassGIS
 * returns one line per unit-range record for the same building.
 */
export const suggestAddresses = async (
  text: string,
  signal: AbortSignal,
  preferTowns: readonly string[] = []
): Promise<AddressSuggestion[]> => {
  const q = text.trim();
  if (!isWorthSuggesting(q)) return [];

  const [local, statewide] = await Promise.all([
    suggest(q, LOCAL_EXTENT, signal).catch(() => [] as string[]),
    suggest(q, null, signal).catch(() => [] as string[]),
  ]);

  const preferred = new Set(preferTowns.map((t) => t.toLowerCase()));
  const parsedLocal = local
    .map(parseSuggestion)
    .filter((s): s is AddressSuggestion => s !== null)
    // Stable sort: preferred towns first, MassGIS's own order within each group.
    .sort(
      (a, b) =>
        Number(preferred.has(b.town.toLowerCase())) - Number(preferred.has(a.town.toLowerCase()))
    );
  const parsedRest = statewide
    .map(parseSuggestion)
    .filter((s): s is AddressSuggestion => s !== null);

  // Keyed on the label, but a later duplicate may carry the unit range the first
  // one lacked ("151 WASHINGTON ST" and "151 WASHINGTON STREET (#1-12)" are the
  // same building), so the hint is merged rather than lost with the duplicate.
  const byLabel = new Map<string, AddressSuggestion>();
  for (const s of [...parsedLocal, ...parsedRest]) {
    const key = s.label.toLowerCase();
    const existing = byLabel.get(key);
    if (!existing) byLabel.set(key, s);
    else if (!existing.unitHint && s.unitHint) byLabel.set(key, { ...existing, unitHint: s.unitHint });
  }
  return [...byLabel.values()].slice(0, 10);
};
