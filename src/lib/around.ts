/**
 * "Around the home" — the neighborhood page of a marketing booklet: what is
 * near the house, how far, and a map of it.
 *
 * Kevin asked for it on 2026-10-10: schools, parks, restaurants, highways, a
 * map — "anything that can be useful to the buyer". This module is everything
 * about that page that is arithmetic or parsing. PURE, like marketing.ts: no
 * network, no DOM, so `node scripts/marketing-check.ts` runs it against real
 * replies saved from each service. The fetching is in aroundFetch.ts.
 *
 * WHERE EACH LIST COMES FROM, and why not one source for all of it:
 *
 *   schools    MassGIS, the Commonwealth's PK-12 schools layer (from DESE).
 *   parks      MassGIS, Protected and Recreational OpenSpace.
 *   highways   MassGIS/MassDOT, limited-access highway interchanges.
 *   transit    the MBTA's own API.
 *   dining,    OpenStreetMap, through komoot's Photon. Nobody official
 *   groceries  publishes restaurants, and this is the best free list there is.
 *   the map    OpenStreetMap's tiles.
 *
 * OpenStreetMap's Overpass API could answer all six in one request and was the
 * first choice. Measured on 2026-10-10 it took 46 seconds to time out on a
 * query for one neighborhood, twice running. A button that spins for most of a
 * minute and returns nothing is not a feature; the state's servers answered
 * the same questions in half a second, with better data for the three lists
 * where being wrong is most embarrassing.
 *
 * THREE RULES THE PAGE KEEPS, each because the alternative misleads a buyer:
 *
 *   * NOTHING IS WRITTEN HERE. Every name and distance is a source's, or one
 *     Kevin typed. A list with nothing in it is left off the page.
 *   * DISTANCES ARE STRAIGHT-LINE, and the page says so in its small print. A
 *     drive time would need a routing service; a guess at one would be a
 *     number about the house that nobody measured.
 *   * A SCHOOL NEARBY IS NOT A SCHOOL ASSIGNED. The nearest elementary school
 *     is often not the one a street is zoned for, and no free source says
 *     which is. The heading says "nearby", the small print says to ask the
 *     district, and there are no ratings: an agent characterising schools is a
 *     fair-housing problem, and listing them by name and distance is not.
 */

export interface LatLon {
  lat: number;
  lon: number;
}

export type PlaceGroup = 'schools' | 'parks' | 'dining' | 'groceries' | 'transit' | 'highways';

/** The lists, in the order they are numbered on the map. `max` is how many of each the page draws. */
export const PLACE_GROUPS: { id: PlaceGroup; label: string; max: number; source: string }[] = [
  { id: 'schools', label: 'Schools nearby', max: 6, source: 'MassGIS' },
  { id: 'parks', label: 'Parks & recreation', max: 6, source: 'MassGIS' },
  { id: 'dining', label: 'Dining & coffee', max: 6, source: 'OpenStreetMap' },
  { id: 'groceries', label: 'Groceries', max: 3, source: 'OpenStreetMap' },
  { id: 'transit', label: 'Transit', max: 4, source: 'MBTA' },
  { id: 'highways', label: 'Highways', max: 4, source: 'MassDOT' },
];

export interface Place {
  /** Stable within a document, for the editor's rows. */
  id: string;
  group: PlaceGroup;
  name: string;
  /** One short fact beside the name: "K–5 · Public", "Green Line", "Exit 125 · Route 16". */
  note: string;
  /** As printed: "0.5 mi". Text, so Kevin can write "5 min walk" where he knows it. */
  distance: string;
  /** Null for a place typed by hand: it is listed, and has no pin. */
  lat: number | null;
  lon: number | null;
  /** Ticked in the editor. Only shown places are printed. */
  show: boolean;
}

export interface Around {
  /** Whether the booklet has the page at all. */
  on: boolean;
  /** Where the house is. Null until it has been looked up. */
  home: LatLon | null;
  /** The zoom level the map's tiles come from: 14 is about two and a half miles across the frame. */
  zoom: number;
  title: string;
  places: Place[];
  /** "October 2026" — when the lists were fetched, for the small print. */
  checked: string;
}

export const MIN_ZOOM = 12;
export const MAX_ZOOM_MAP = 16;

export const blankAround = (): Around => ({
  on: false,
  home: null,
  zoom: 14,
  title: 'Around the home',
  places: [],
  checked: '',
});

/* -------------------------------------------------------------------------- */
/* Reading a stored page                                                       */
/* -------------------------------------------------------------------------- */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const coord = (v: unknown, limit: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit ? v : null;

const GROUP_IDS = PLACE_GROUPS.map((g) => g.id);

const cleanHome = (v: unknown): LatLon | null => {
  if (!isObject(v)) return null;
  const lat = coord(v.lat, 90);
  const lon = coord(v.lon, 180);
  return lat === null || lon === null ? null : { lat, lon };
};

/** A stored page, made whole — field by field, the way hydrateDoc does it. Cannot throw. */
export const hydrateAround = (stored: unknown): Around => {
  const blank = blankAround();
  if (!isObject(stored)) return blank;
  const places: Place[] = [];
  if (Array.isArray(stored.places)) {
    stored.places.forEach((p, i) => {
      if (!isObject(p) || !GROUP_IDS.includes(p.group as PlaceGroup)) return;
      const lat = coord(p.lat, 90);
      const lon = coord(p.lon, 180);
      places.push({
        id: text(p.id) || `stored-${i}`,
        group: p.group as PlaceGroup,
        name: text(p.name),
        note: text(p.note),
        distance: text(p.distance),
        // Half a coordinate is not a place on a map.
        lat: lat === null || lon === null ? null : lat,
        lon: lat === null || lon === null ? null : lon,
        show: p.show !== false,
      });
    });
  }
  const zoom =
    typeof stored.zoom === 'number' && Number.isFinite(stored.zoom)
      ? Math.min(MAX_ZOOM_MAP, Math.max(MIN_ZOOM, Math.round(stored.zoom)))
      : blank.zoom;
  return {
    on: stored.on === true,
    home: cleanHome(stored.home),
    zoom,
    title: text(stored.title, blank.title),
    places,
    checked: text(stored.checked),
  };
};

/* -------------------------------------------------------------------------- */
/* Distance                                                                    */
/* -------------------------------------------------------------------------- */

const RAD = Math.PI / 180;
const EARTH_MILES = 3958.8;

/** Straight-line miles between two points (haversine). */
export const milesBetween = (a: LatLon, b: LatLon): number => {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
};

/**
 * "0.5 mi". One decimal, because the second would be a claim about which side
 * of a parking lot was measured from; and never "0.0 mi", which reads as a
 * mistake rather than as next door.
 */
export const formatMiles = (miles: number): string =>
  miles < 0.1 ? 'under 0.1 mi' : miles >= 10 ? `${Math.round(miles)} mi` : `${miles.toFixed(1)} mi`;

interface Found {
  group: PlaceGroup;
  name: string;
  note: string;
  at: LatLon;
  miles: number;
}

const byDistance = (a: Found, b: Found) => a.miles - b.miles;

/** Found things, as rows: nearest first, the first `shown` of them ticked. */
const toPlaces = (found: Found[], shown: (f: Found, i: number) => boolean): Place[] =>
  found.map((f, i) => ({
    id: `${f.group}-${i}-${f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    group: f.group,
    name: f.name,
    note: f.note,
    distance: formatMiles(f.miles),
    lat: f.at.lat,
    lon: f.at.lon,
    show: shown(f, i),
  }));

const maxOf = (group: PlaceGroup): number => PLACE_GROUPS.find((g) => g.id === group)?.max ?? 4;

/* -------------------------------------------------------------------------- */
/* Schools — MassGIS, Massachusetts PK-12 Schools                              */
/* -------------------------------------------------------------------------- */

/** An ArcGIS feature: attributes, and a point, a polygon's rings or a line's paths. */
export interface ArcFeature {
  attributes: Record<string, unknown>;
  geometry?: { x?: number; y?: number; rings?: number[][][]; paths?: number[][][] };
}

/**
 * "K,01,02,03,04,05" -> "K–5". The layer lists every grade a school teaches,
 * in order; the page wants the span.
 */
export const gradeSpan = (grades: unknown): string => {
  const list = (typeof grades === 'string' ? grades : '')
    .split(',')
    .map((g) => g.trim().toUpperCase())
    .filter(Boolean);
  if (list.length === 0) return '';
  const label = (g: string) => (/^\d+$/.test(g) ? String(Number(g)) : g);
  const first = label(list[0]);
  const last = label(list[list.length - 1]);
  if (first !== last) return `${first}–${last}`;
  return first === 'PK' ? 'Pre-K' : first === 'K' ? 'Kindergarten' : `Grade ${first}`;
};

/** "Public Elementary" -> "Public". The grades already say which level. */
const schoolKind = (typeDesc: string): string => {
  if (/voc|tech/i.test(typeDesc)) return 'Public vocational';
  if (/^public/i.test(typeDesc)) return 'Public';
  if (/charter/i.test(typeDesc)) return 'Charter';
  if (/special/i.test(typeDesc)) return 'Special education';
  if (/private/i.test(typeDesc)) return 'Private';
  return typeDesc;
};

/**
 * Schools, nearest first.
 *
 * WHICH ARE TICKED is the one judgement here. A buyer wants the public schools
 * at each level, and the six nearest schools of any kind are often five
 * elementary schools and a special-education programme. So: the two nearest
 * public elementary schools, the nearest public middle school and the two
 * nearest public high schools, then the nearest remaining public schools up to
 * the page's limit. Private, charter and special-education schools are in the
 * list, unticked, for Kevin to add.
 *
 * TWO high schools, because the nearest is often not the one anybody means. At
 * 151 Washington St in Medford the nearest public 9–12 school is Curtis-Tufts,
 * the alternative school, and Medford High is the next; in Waban it is Newton
 * North, and much of Waban goes to Newton South.
 *
 * WHAT IS OFFERED is the nearest dozen — and, however far down they come, the
 * two nearest public middle and high schools. There are 46 schools within two
 * and a half miles of that Medford address; cut to the nearest fourteen, Medford
 * High was not in the list to be ticked at all (2026-10-10).
 */
export const schoolsFrom = (features: ArcFeature[], home: LatLon): Place[] => {
  const seen = new Set<string>();
  const found: (Found & { type: string })[] = [];
  for (const f of features) {
    const name = text(f.attributes.NAME).trim();
    const x = f.geometry?.x;
    const y = f.geometry?.y;
    if (!name || typeof x !== 'number' || typeof y !== 'number' || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    const type = text(f.attributes.TYPE_DESC).trim();
    const at = { lat: y, lon: x };
    found.push({
      group: 'schools',
      name,
      note: [gradeSpan(f.attributes.GRADES), schoolKind(type)].filter(Boolean).join(' · '),
      at,
      miles: milesBetween(home, at),
      type,
    });
  }
  found.sort(byDistance);

  // A pre-K programme is a "Public Elementary" school on paper and not what the
  // list is for. Left to the layer's own category it was ticked FIRST, as the
  // nearest elementary school; the check caught that before a booklet did.
  const publicSchools = found.filter((f) => /^public/i.test(f.type) && !/^Pre-K\b/.test(f.note));
  const nearest = (pattern: RegExp, count: number) =>
    publicSchools.filter((f) => pattern.test(f.type)).slice(0, count);

  const ticked = new Set<Found>([
    ...nearest(/^public elementary/i, 2),
    ...nearest(/^public middle/i, 1),
    ...nearest(/^public secondary/i, 2),
  ]);
  for (const f of publicSchools) {
    if (ticked.size >= maxOf('schools')) break;
    ticked.add(f);
  }

  const offered = new Set<Found>([
    ...found.slice(0, 12),
    ...ticked,
    ...nearest(/^public middle/i, 2),
    ...nearest(/^public secondary/i, 2),
  ]);
  return toPlaces(
    found.filter((f) => offered.has(f)),
    (f) => ticked.has(f)
  );
};

/* -------------------------------------------------------------------------- */
/* Parks — MassGIS, Protected and Recreational OpenSpace                       */
/* -------------------------------------------------------------------------- */

/** What the layer calls open space that is not somewhere to go for a walk. */
const NOT_A_PARK = /\b(school|cemetery|aqueduct|reservoir|well ?field|pump|easement|right of way|median|traffic island)\b/i;

/**
 * Parks, nearest first, with their size.
 *
 * The layer is one polygon per PARCEL, so a park is usually several rows of the
 * same name: they are merged, their acres added, and the distance is to the
 * nearest corner of any of them — the edge of a park is where it starts, and
 * the middle of a 130-acre one can be half a mile further. School grounds are
 * in the layer as recreation land and are left out; the schools have their own
 * list. The query already asks only for land that is open to the public and
 * held for recreation or conservation.
 */
export const parksFrom = (features: ArcFeature[], home: LatLon): Place[] => {
  const parks = new Map<string, Found & { acres: number; biggest: number }>();
  for (const f of features) {
    const name = text(f.attributes.SITE_NAME).trim();
    const rings = f.geometry?.rings ?? [];
    const points = rings.flat();
    if (!name || NOT_A_PARK.test(name) || points.length === 0) continue;

    let nearest = Infinity;
    let sumLon = 0;
    let sumLat = 0;
    for (const [lon, lat] of points) {
      nearest = Math.min(nearest, milesBetween(home, { lat, lon }));
      sumLon += lon;
      sumLat += lat;
    }
    const acres = typeof f.attributes.GIS_ACRES === 'number' ? f.attributes.GIS_ACRES : 0;
    const middle = { lat: sumLat / points.length, lon: sumLon / points.length };

    const key = name.toLowerCase();
    const known = parks.get(key);
    if (!known) {
      parks.set(key, { group: 'parks', name, note: '', at: middle, miles: nearest, acres, biggest: acres });
    } else {
      known.acres += acres;
      known.miles = Math.min(known.miles, nearest);
      // The pin goes on the largest parcel, which is the park and not its strip of verge.
      if (acres > known.biggest) {
        known.biggest = acres;
        known.at = middle;
      }
    }
  }
  const found = [...parks.values()]
    // Under half an acre is a planted corner.
    .filter((p) => p.acres >= 0.5)
    .map((p) => {
      const acres = Math.round(p.acres);
      return { ...p, note: acres >= 1 ? `${acres.toLocaleString('en-US')} ${acres === 1 ? 'acre' : 'acres'}` : '' };
    })
    .sort(byDistance)
    .slice(0, 12);
  return toPlaces(found, (_, i) => i < maxOf('parks'));
};

/* -------------------------------------------------------------------------- */
/* Highways — MassDOT, limited-access highway interchanges                     */
/* -------------------------------------------------------------------------- */

/** "I90" -> "I-90 (Mass Pike)", "SR2" -> "Route 2". Anything else is printed as it came. */
export const highwayName = (corridor: string): string => {
  const m = /^(I|US|SR|RT|RTE)\s*-?\s*(\d+[A-Z]?)$/i.exec(corridor.trim());
  if (!m) return corridor.trim();
  if (m[1].toUpperCase() !== 'I') return `Route ${m[2]}`;
  return m[2] === '90' ? 'I-90 (Mass Pike)' : `I-${m[2]}`;
};

/** "Jct. RTE 16" -> "Route 16". */
const junctionName = (junction: string): string =>
  junction
    .replace(/^jct\.?\s*/i, '')
    .replace(/\bRTE\.?\s*/gi, 'Route ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The nearest exit of each highway — one line per highway, since a buyer asks
 * "how far is the Pike", not "which three exits are there". Distance is to the
 * interchange, which is where the highway can actually be got onto: the road
 * itself can pass a quarter of a mile from a house whose nearest ramp is three
 * miles off.
 */
export const highwaysFrom = (features: ArcFeature[], home: LatLon): Place[] => {
  const nearest = new Map<string, Found>();
  for (const f of features) {
    const corridor = text(f.attributes.CORRIDOR).trim();
    const x = f.geometry?.x;
    const y = f.geometry?.y;
    if (!corridor || typeof x !== 'number' || typeof y !== 'number') continue;
    const at = { lat: y, lon: x };
    const miles = milesBetween(home, at);
    const known = nearest.get(corridor);
    if (known && known.miles <= miles) continue;
    const exit = text(f.attributes.EXIT_NUM).trim();
    const junction = junctionName(text(f.attributes.JUNCTION));
    nearest.set(corridor, {
      group: 'highways',
      name: highwayName(corridor),
      note: [exit ? `Exit ${exit}` : '', junction].filter(Boolean).join(' · '),
      at,
      miles,
    });
  }
  const found = [...nearest.values()].sort(byDistance).slice(0, 6);
  return toPlaces(found, (_, i) => i < maxOf('highways'));
};

/* -------------------------------------------------------------------------- */
/* Transit — the MBTA's API                                                    */
/* -------------------------------------------------------------------------- */

export interface MbtaStop {
  attributes: {
    name?: string | null;
    description?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    vehicle_type?: number | null;
  };
}

const MODE = ['Light rail', 'Subway', 'Commuter Rail'];

/**
 * Stations, nearest first: subway, light rail and commuter rail, not bus stops
 * (there is one of those on most corners, and none of them sells a house).
 *
 * The API returns a row per PLATFORM. A station is its name; the line is the
 * middle of the platform's description ("Waban - Green Line - (D) Riverside"),
 * and a station on two lines — Porter is Red Line and Commuter Rail — says both.
 */
export const transitFrom = (stops: MbtaStop[], home: LatLon): Place[] => {
  const stations = new Map<string, Found & { lines: string[] }>();
  for (const stop of stops) {
    const a = stop.attributes;
    const name = (a.name ?? '').trim();
    if (!name || typeof a.latitude !== 'number' || typeof a.longitude !== 'number') continue;
    const line =
      (a.description ?? '').split(' - ')[1]?.trim() ||
      (typeof a.vehicle_type === 'number' ? MODE[a.vehicle_type] ?? '' : '');
    const at = { lat: a.latitude, lon: a.longitude };
    const miles = milesBetween(home, at);
    const key = name.toLowerCase();
    const known = stations.get(key);
    if (!known) {
      stations.set(key, { group: 'transit', name, note: '', at, miles, lines: line ? [line] : [] });
    } else {
      if (line && !known.lines.includes(line)) known.lines.push(line);
      if (miles < known.miles) {
        known.miles = miles;
        known.at = at;
      }
    }
  }
  const found = [...stations.values()]
    .map((s) => ({ ...s, note: s.lines.join(', ') }))
    .sort(byDistance)
    .slice(0, 8);
  return toPlaces(found, (_, i) => i < maxOf('transit'));
};

/* -------------------------------------------------------------------------- */
/* Dining and groceries — OpenStreetMap, through Photon                        */
/* -------------------------------------------------------------------------- */

export interface PhotonFeature {
  geometry?: { coordinates?: number[] };
  properties?: { name?: string | null; osm_value?: string | null };
}

const OSM_NOTE: Record<string, string> = { restaurant: 'Restaurant', cafe: 'Café' };

/**
 * Places from OpenStreetMap, nearest first.
 *
 * OpenStreetMap is edited by whoever turns up, and it shows: the same
 * restaurant is often there four times (the building, the entrance, the
 * terrace), and some entries have no name at all. Duplicates by name are
 * merged and the nameless dropped. A CHAIN is one name at several addresses,
 * so only its nearest branch survives — which is the one worth printing.
 *
 * It can also simply be out of date. Every list on the page is Kevin's to
 * untick, and this is the one to read before printing.
 */
export const placesFromPhoton = (
  features: PhotonFeature[],
  group: 'dining' | 'groceries',
  home: LatLon
): Place[] => {
  const nearest = new Map<string, Found>();
  for (const f of features) {
    const name = (f.properties?.name ?? '').trim();
    const [lon, lat] = f.geometry?.coordinates ?? [];
    if (!name || typeof lon !== 'number' || typeof lat !== 'number') continue;
    const at = { lat, lon };
    const miles = milesBetween(home, at);
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const known = nearest.get(key);
    if (known && known.miles <= miles) continue;
    nearest.set(key, {
      group,
      name,
      note: group === 'dining' ? OSM_NOTE[f.properties?.osm_value ?? ''] ?? '' : '',
      at,
      miles,
    });
  }
  const found = [...nearest.values()].sort(byDistance).slice(0, group === 'dining' ? 12 : 6);
  return toPlaces(found, (_, i) => i < maxOf(group));
};

/* -------------------------------------------------------------------------- */
/* The map                                                                     */
/* -------------------------------------------------------------------------- */

/** The map's frame on the page, in CSS pixels. One size in every design, so pins need one sum. */
export const MAP_FRAME = { w: 440, h: 320 } as const;

const TILE_PX = 256;

/**
 * How large a 256-pixel tile is drawn, in CSS pixels: three quarters of its
 * real size, which prints at 128 pixels to the inch.
 *
 * A map tile is a bitmap with the street names painted into it, so its size on
 * paper is a trade between two kinds of unreadable. At full size (96 to the
 * inch) the names are large and the whole map is as soft as a screenshot. At
 * half size it is crisp and the names are under four points. Both were printed
 * on 2026-10-10; this is the size at which a street name can still be read.
 */
export const TILE_DRAWN = 192;
const SCALE = TILE_DRAWN / TILE_PX;

/** Where a point is on the Web Mercator world, in pixels, at a zoom level. */
const worldPx = (p: LatLon, zoom: number): { x: number; y: number } => {
  const size = TILE_PX * 2 ** zoom;
  const sin = Math.sin(Math.max(-85.05, Math.min(85.05, p.lat)) * RAD);
  return {
    x: ((p.lon + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
};

export interface MapTile {
  z: number;
  x: number;
  y: number;
  left: number;
  top: number;
  size: number;
}

/**
 * The tiles that cover the frame, and where each goes in it. The house is the
 * centre; the tiles are zoom level `zoom`, drawn at TILE_DRAWN.
 */
export const mapTiles = (
  center: LatLon,
  zoom: number,
  frame: { w: number; h: number } = MAP_FRAME
): MapTile[] => {
  const z = zoom;
  const scale = SCALE;
  const c = worldPx(center, z);
  const left0 = c.x - frame.w / 2 / scale;
  const top0 = c.y - frame.h / 2 / scale;
  const count = 2 ** z;
  const tiles: MapTile[] = [];
  for (let ty = Math.floor(top0 / TILE_PX); ty * TILE_PX < top0 + frame.h / scale; ty += 1) {
    if (ty < 0 || ty >= count) continue;
    for (let tx = Math.floor(left0 / TILE_PX); tx * TILE_PX < left0 + frame.w / scale; tx += 1) {
      tiles.push({
        z,
        x: ((tx % count) + count) % count,
        y: ty,
        left: (tx * TILE_PX - left0) * scale,
        top: (ty * TILE_PX - top0) * scale,
        size: TILE_DRAWN,
      });
    }
  }
  return tiles;
};

/** How far inside the frame's edge a pin must be to be drawn whole. */
const PIN_MARGIN = 9;

/** Where a point falls in the frame, and whether a pin there would be whole. */
export const mapPoint = (
  center: LatLon,
  zoom: number,
  p: LatLon,
  frame: { w: number; h: number } = MAP_FRAME
): { left: number; top: number; inside: boolean } => {
  const z = zoom;
  const scale = SCALE;
  const c = worldPx(center, z);
  const q = worldPx(p, z);
  const left = frame.w / 2 + (q.x - c.x) * scale;
  const top = frame.h / 2 + (q.y - c.y) * scale;
  return {
    left,
    top,
    inside:
      left >= PIN_MARGIN && left <= frame.w - PIN_MARGIN && top >= PIN_MARGIN && top <= frame.h - PIN_MARGIN,
  };
};

/** How many miles the frame is across, for the editor's "about 2.5 miles across" line. */
export const mapMilesAcross = (center: LatLon, zoom: number, frame: { w: number } = MAP_FRAME): number => {
  const metresPerTilePx = (40075016.686 * Math.cos(center.lat * RAD)) / (TILE_PX * 2 ** zoom);
  return (metresPerTilePx * (frame.w / SCALE)) / 1609.344;
};

export interface ShownPlace extends Place {
  /** Its number on the map. Null when it has no pin: typed by hand, or off the map's edge. */
  n: number | null;
  left: number;
  top: number;
}

/**
 * What the page draws: per list, the ticked places up to that list's limit,
 * each with its number on the map.
 *
 * NUMBERS RUN IN ONE SEQUENCE, in the order the lists are read, and ONLY PLACES
 * ON THE MAP GET ONE. A highway exit four miles off is worth a line and is not
 * inside a two-mile frame; giving it "14" would send the reader hunting the map
 * for a pin that is not there. Unnumbered lines get a plain dot.
 */
export const shownPlaces = (around: Around): Record<PlaceGroup, ShownPlace[]> => {
  const out = Object.fromEntries(PLACE_GROUPS.map((g) => [g.id, [] as ShownPlace[]])) as Record<
    PlaceGroup,
    ShownPlace[]
  >;
  let n = 0;
  for (const group of PLACE_GROUPS) {
    const rows = around.places
      .filter((p) => p.group === group.id && p.show && p.name.trim())
      .slice(0, group.max);
    for (const place of rows) {
      const at =
        around.home && place.lat !== null && place.lon !== null
          ? mapPoint(around.home, around.zoom, { lat: place.lat, lon: place.lon })
          : null;
      const pinned = at?.inside === true;
      if (pinned) n += 1;
      out[group.id].push({ ...place, n: pinned ? n : null, left: at?.left ?? 0, top: at?.top ?? 0 });
    }
  }
  return out;
};

/** Which sources the printed lists actually drew on, for the small print. */
export const sourcesOf = (shown: Record<PlaceGroup, ShownPlace[]>, hasMap: boolean): string[] => {
  const used = new Set<string>();
  for (const group of PLACE_GROUPS) {
    if (shown[group.id].some((p) => p.lat !== null)) used.add(group.source);
  }
  if (hasMap) used.add('OpenStreetMap');
  // MassDOT's layer is published by MassGIS; one name on the page for both.
  if (used.delete('MassDOT')) used.add('MassGIS');
  return ['MassGIS', 'MBTA', 'OpenStreetMap'].filter((s) => used.has(s));
};

/** Fetched places replace fetched places; what Kevin typed by hand is kept. */
export const MANUAL_PREFIX = 'manual-';

export const mergeFound = (around: Around, home: LatLon, found: Place[], failed: PlaceGroup[], when: string): Around => ({
  ...around,
  home,
  checked: when,
  places: [
    ...found,
    // A list that could not be fetched keeps what it had, rather than emptying.
    ...around.places.filter((p) => p.id.startsWith(MANUAL_PREFIX) || failed.includes(p.group)),
  ],
});
