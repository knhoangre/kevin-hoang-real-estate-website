/**
 * Asking MassGIS for assessor parcels. Everything that decides which record is
 * which house is in parcels.ts, which is pure and checked; this file only asks.
 *
 * POST, not GET: a town's worth of addresses is a where clause too long for a
 * URL. Fifty addresses a request, all requests at once, each allowed to fail on
 * its own — a batch that times out leaves fifty listings without assessor data
 * and says so, not the whole page. Measured 2026-10-19: Newton's 262 listings
 * were six requests and 0.8 s, and 92% of the single-family homes in the
 * seventeen served towns were found.
 */
import {
  LOT_STATS,
  PARCELS_LAYER,
  PARCEL_FIELDS,
  addressParts,
  batches,
  lotStatsWhere,
  matchParcel,
  parcelWhere,
  parseLotStats,
  parseParcel,
  type LotContext,
  type Parcel,
  type ParcelAttributes,
} from '@/lib/parcels';

const TIMEOUT_MS = 15_000;

const query = async (params: Record<string, string>): Promise<ParcelAttributes[]> => {
  const response = await fetch(`${PARCELS_LAYER}/query`, {
    method: 'POST',
    body: new URLSearchParams({
      outFields: PARCEL_FIELDS.join(','),
      returnGeometry: 'false',
      f: 'json',
      ...params,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`MassGIS answered ${response.status}`);
  const data = (await response.json()) as {
    features?: { attributes: ParcelAttributes }[];
    error?: { message?: string };
  };
  if (data.error) throw new Error(data.error.message ?? 'MassGIS query failed');
  return (data.features ?? []).map((f) => f.attributes);
};

type Addressable = {
  mls_number: string;
  address?: string | null;
  street_no?: string | null;
  street_name?: string | null;
  unit_no?: string | null;
};

/** Every listing's parcel that could be found, by MLS number. */
export const parcelsForListings = async (
  town: string,
  listings: Addressable[]
): Promise<Map<string, Parcel>> => {
  const withParts = listings
    .map((l) => ({ mls: l.mls_number, parts: addressParts(l) }))
    .filter((x): x is { mls: string; parts: NonNullable<typeof x.parts> } => x.parts !== null);

  const results = await Promise.allSettled(
    batches(withParts).map(async (batch) => {
      const candidates = await query({ where: parcelWhere(town, batch.map((b) => b.parts)) });
      return batch.map((b) => [b.mls, matchParcel(b.parts, candidates)] as const);
    })
  );

  const out = new Map<string, Parcel>();
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const [mls, hit] of r.value) if (hit) out.set(mls, parseParcel(hit.record, hit.unitMatched));
  }
  return out;
};

/**
 * One listing's parcel, or null rather than a throw: a page without assessor
 * data is still a page.
 *
 * By address first, in its town. Then, when that finds nothing, at the
 * listing's geocode — which is not filtered by town, so it also finds a house
 * whose town the layer names differently — but even there the record must
 * carry the listing's own address. A geocode can land on the house next door,
 * and the neighbour's land value printed beside a listing is exactly the
 * mistake this module exists not to make.
 */
export const parcelForListing = async (
  listing: Addressable & { town: string | null },
  point: { lat: number; lon: number } | null
): Promise<Parcel | null> => {
  const parts = addressParts(listing);
  if (!parts) return null;
  try {
    if (listing.town) {
      const byAddress = await parcelsForListings(listing.town, [listing]);
      const found = byAddress.get(listing.mls_number);
      if (found) return found;
    }
    if (!point) return null;
    const candidates = await query({
      geometry: `${point.lon},${point.lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
    });
    const hit = matchParcel(parts, candidates);
    return hit ? parseParcel(hit.record, hit.unitMatched) : null;
  } catch {
    return null;
  }
};

/** The typical single-family lot in this lot's district (or town), or null. Never throws. */
export const lotContext = async (town: string, zoning: string | null): Promise<LotContext | null> => {
  try {
    const response = await fetch(`${PARCELS_LAYER}/query`, {
      method: 'POST',
      body: new URLSearchParams({
        where: lotStatsWhere(town, zoning),
        groupByFieldsForStatistics: 'LOT_UNITS',
        outStatistics: LOT_STATS,
        f: 'json',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { features?: { attributes: Record<string, unknown> }[] };
    return parseLotStats(data.features ?? [], zoning ? 'district' : 'town', zoning);
  } catch {
    return null;
  }
};
