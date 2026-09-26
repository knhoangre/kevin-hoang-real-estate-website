import { useQuery } from '@tanstack/react-query';
import type { IdxListing } from '@/lib/idxSearch';
import { comparableCandidates, subjectCoordinate } from '@/lib/idxComps';
import { supports, valuate, type Valuation } from '@/lib/valuation';

/**
 * The comparable-sales valuation for one listing, fetched once per page.
 *
 * A hook rather than a fetch inside ListingValuation because two things on
 * /search/<mls> now read it: the one-line summary beside the asking price, and
 * the full panel further down. Before the summary existed the estimate lived
 * only in that panel, below the mortgage calculator — so it was on the page and
 * effectively invisible, which is the same outcome as not having built it.
 * react-query keys on the MLS number, so both call this and one request is made.
 *
 * Resolves to null for a refusal as well as a failure, and callers render
 * nothing either way. `comparableCandidates` already swallows its own errors:
 * an estimate is context, and it must never take the listing down with it.
 *
 * Never runs during static generation: /search/:mls is not prerendered with
 * content, and react-query does not execute a queryFn during a server render.
 */
export const useListingValuation = (listing: IdxListing | null) =>
  useQuery<Valuation | null>({
    queryKey: ['listing-valuation', listing?.mls_number ?? null],
    enabled: Boolean(listing) && supports(listing ?? { prop_type: null, prop_subtype: null }),
    // The comps behind an estimate change nightly at most. Re-fetching on every
    // tab focus would re-run a query the database finds expensive to answer.
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      if (!listing) return null;
      const coordinate = await subjectCoordinate(listing);
      const candidates = await comparableCandidates(listing, coordinate);
      const result = valuate(listing, candidates);
      return 'valuation' in result ? result.valuation : null;
    },
  });
