import { useQuery } from '@tanstack/react-query';
import { listingByMls, type IdxListing } from '@/lib/idxSearch';
import { subjectCoordinate } from '@/lib/idxComps';
import { largeHomeSales, rentEvidence, screenerListings, type ScreenerListing, type ScreenerQuery } from '@/lib/investmentData';
import { lotContext, parcelForListing, parcelsForListings } from '@/lib/parcelsFetch';

/**
 * The react-query side of /investments. Keys are per town (or per listing), so
 * the screener and a deal opened from it share the same leases, and going back
 * to the list does not ask again.
 *
 * Every hook takes `enabled`: nothing is fetched until the page has hydrated
 * and somebody is signed in. A queryFn never runs during the static render.
 */

const HOUR = 60 * 60 * 1000;

export const useScreenerListings = (q: ScreenerQuery, enabled: boolean) =>
  useQuery({
    queryKey: ['inv-listings', q.town, q.state, q.type, q.min, q.max, q.order],
    queryFn: () => screenerListings(q),
    enabled: enabled && Boolean(q.town),
    // The feed syncs every six hours; five minutes is fresh enough for a list.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useRentEvidence = (town: string | null, state: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['inv-rents', town, state],
    queryFn: () => rentEvidence(town as string, state ?? 'MA'),
    enabled: enabled && Boolean(town),
    staleTime: HOUR,
    refetchOnWindowFocus: false,
  });

/**
 * Assessor parcels for every listing in the list, keyed on the set of MLS
 * numbers so a new filter asks again and a re-render does not.
 */
export const useTownParcels = (town: string | null, listings: ScreenerListing[] | undefined, enabled: boolean) => {
  const keys = (listings ?? []).map((l) => l.mls_number).sort();
  return useQuery({
    queryKey: ['inv-parcels', town, keys.join(',')],
    queryFn: () => parcelsForListings(town as string, listings ?? []),
    enabled: enabled && Boolean(town) && keys.length > 0,
    staleTime: 24 * HOUR,
    refetchOnWindowFocus: false,
  });
};

export const useDealListing = (mls: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['inv-deal', mls],
    queryFn: () => listingByMls(mls as string),
    enabled: enabled && Boolean(mls),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useDealParcel = (listing: IdxListing | null | undefined, enabled: boolean) =>
  useQuery({
    queryKey: ['inv-parcel', listing?.mls_number ?? null],
    queryFn: async () => {
      const l = listing as IdxListing;
      return parcelForListing(l, await subjectCoordinate(l));
    },
    enabled: enabled && Boolean(listing),
    staleTime: 24 * HOUR,
    refetchOnWindowFocus: false,
  });

/** Recent large single-family sales in a town, for what new houses sell for. */
export const useLargeHomeSales = (town: string | null, state: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['inv-new-builds', town, state],
    queryFn: () => largeHomeSales(town as string, state ?? 'MA'),
    enabled: enabled && Boolean(town),
    staleTime: HOUR,
    refetchOnWindowFocus: false,
  });

/** The typical single-family lot in a district (or the town). */
export const useLotContext = (town: string | null, zoning: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['inv-lots', town, zoning],
    queryFn: () => lotContext(town as string, zoning),
    enabled: enabled && Boolean(town),
    staleTime: 24 * HOUR,
    refetchOnWindowFocus: false,
  });
