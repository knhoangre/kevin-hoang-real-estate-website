/**
 * "Around the home" — asking the four services what is near a house.
 *
 * Everything that decides anything is in around.ts, which is pure and checked;
 * this file only asks. Each service is free, needs no key and may be read from
 * this site's pages:
 *
 *   MassGIS   the address (where the house is), schools, parks, highway exits.
 *             The same server the invite form's address suggestions come from.
 *   MBTA      stations. Twenty requests a minute without a key; this makes one.
 *   Photon    komoot's search over OpenStreetMap: restaurants, cafés, groceries.
 *
 * EACH LIST IS ASKED FOR SEPARATELY AND MAY FAIL SEPARATELY. A booklet with
 * schools, parks and highways and no restaurants is still worth having, so one
 * service being down costs one list — which is reported by name, so Kevin knows
 * to try again or type it in — and not the whole page.
 *
 * MASSACHUSETTS ONLY. Three of the four sources are the Commonwealth's. The
 * feed carries a few New Hampshire and Rhode Island listings; for those the
 * address is not found and the page says so.
 */
import {
  highwaysFrom,
  parksFrom,
  placesFromPhoton,
  schoolsFrom,
  transitFrom,
  type ArcFeature,
  type LatLon,
  type MbtaStop,
  type PhotonFeature,
  type Place,
  type PlaceGroup,
} from '@/lib/around';
import { LOCATOR } from '@/lib/massgis';

const STATE = 'https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL';
const SCHOOLS = `${STATE}/Massachusetts_PK_to_12_Schools/FeatureServer/0`;
const OPEN_SPACE = `${STATE}/openspace/FeatureServer/0`;
const INTERCHANGES = `${STATE}/LimitedAccessHighwayExits_and_Interchanges/FeatureServer/0`;
const MBTA = 'https://api-v3.mbta.com/stops';
const PHOTON = 'https://photon.komoot.io/reverse';

const METRES_PER_MILE = 1609.344;
/** Long enough for a slow reply, short enough that the button is not a spinner for a minute. */
const TIMEOUT_MS = 15_000;

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${new URL(url).host} answered ${response.status}`);
  return (await response.json()) as T;
};

/**
 * Where an address is, or null when the Commonwealth's locator does not know it.
 *
 * The unit is dropped first — "421 High St Unit 203B" is a point on the same
 * building as "421 High St", and the locator matches the latter more surely. A
 * weak match is refused: a pin on the wrong street puts every distance on the
 * page out, and "address not found" is the honest answer to a typo.
 */
export const locate = async (street: string, cityLine: string): Promise<LatLon | null> => {
  const line = street.replace(/[,\s]+(unit|apt|apartment|suite|ste|#)\b.*$/i, '').trim();
  if (!line || !cityLine.trim()) return null;
  const params = new URLSearchParams({
    SingleLine: `${line}, ${cityLine.trim()}`,
    outSR: '4326',
    maxLocations: '1',
    f: 'json',
  });
  const data = await getJson<{
    candidates?: { score?: number; location?: { x?: number; y?: number } }[];
  }>(`${LOCATOR}/findAddressCandidates?${params}`);
  const best = data.candidates?.[0];
  const x = best?.location?.x;
  const y = best?.location?.y;
  if (!best || (best.score ?? 0) < 85 || typeof x !== 'number' || typeof y !== 'number') return null;
  return { lat: y, lon: x };
};

/** Everything in a state layer within `miles` of the house. */
const within = async (
  layer: string,
  home: LatLon,
  miles: number,
  fields: string,
  where = '1=1'
): Promise<ArcFeature[]> => {
  const params = new URLSearchParams({
    geometry: `${home.lon},${home.lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    distance: String(Math.round(miles * METRES_PER_MILE)),
    units: 'esriSRUnit_Meter',
    where,
    outFields: fields,
    returnGeometry: 'true',
    outSR: '4326',
    // Park outlines to about twenty metres: plenty for "how far is its edge",
    // and a fifth of the bytes.
    geometryPrecision: '5',
    maxAllowableOffset: '0.0002',
    f: 'json',
  });
  const data = await getJson<{ features?: ArcFeature[]; error?: { message?: string } }>(
    `${layer}/query?${params}`
  );
  if (data.error) throw new Error(data.error.message ?? 'The map service refused the request.');
  return data.features ?? [];
};

const photon = async (home: LatLon, tag: string, km: number, limit: number): Promise<PhotonFeature[]> => {
  const params = new URLSearchParams({
    lat: String(home.lat),
    lon: String(home.lon),
    radius: String(km),
    limit: String(limit),
    osm_tag: tag,
  });
  const data = await getJson<{ features?: PhotonFeature[] }>(`${PHOTON}?${params}`);
  return data.features ?? [];
};

const mbta = async (home: LatLon): Promise<MbtaStop[]> => {
  const params = new URLSearchParams({
    'filter[latitude]': String(home.lat),
    'filter[longitude]': String(home.lon),
    // Degrees, which is how this API measures: about two and a half miles.
    'filter[radius]': '0.04',
    // Light rail, subway, commuter rail. Not buses.
    'filter[route_type]': '0,1,2',
    'page[limit]': '60',
  });
  const data = await getJson<{ data?: MbtaStop[] }>(`${MBTA}?${params}`);
  return data.data ?? [];
};

export interface Nearby {
  places: Place[];
  /** The lists that could not be fetched this time. */
  failed: PlaceGroup[];
}

/** Every list, each from its own source, each allowed to fail by itself. */
export const findNearby = async (home: LatLon): Promise<Nearby> => {
  const asks: [PlaceGroup, Promise<Place[]>][] = [
    [
      'schools',
      within(SCHOOLS, home, 2.5, 'NAME,GRADES,TYPE_DESC').then((f) => schoolsFrom(f, home)),
    ],
    [
      'parks',
      within(
        OPEN_SPACE,
        home,
        1.25,
        'SITE_NAME,GIS_ACRES',
        // Open to the public, and held for recreation, conservation or both.
        "PUB_ACCESS = 'Y' AND PRIM_PURP IN ('R','C','B')"
      ).then((f) => parksFrom(f, home)),
    ],
    [
      'dining',
      Promise.all([
        photon(home, 'amenity:restaurant', 2.5, 40),
        photon(home, 'amenity:cafe', 2.5, 20),
      ]).then(([restaurants, cafes]) => placesFromPhoton([...restaurants, ...cafes], 'dining', home)),
    ],
    [
      'groceries',
      photon(home, 'shop:supermarket', 5, 20).then((f) => placesFromPhoton(f, 'groceries', home)),
    ],
    ['transit', mbta(home).then((stops) => transitFrom(stops, home))],
    [
      'highways',
      within(INTERCHANGES, home, 8, 'CORRIDOR,EXIT_NUM,JUNCTION').then((f) => highwaysFrom(f, home)),
    ],
  ];

  const settled = await Promise.allSettled(asks.map(([, ask]) => ask));
  const places: Place[] = [];
  const failed: PlaceGroup[] = [];
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') places.push(...result.value);
    else {
      failed.push(asks[i][0]);
      console.warn(`Could not load ${asks[i][0]}:`, result.reason);
    }
  });
  return { places, failed };
};
