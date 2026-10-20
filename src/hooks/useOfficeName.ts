import { useQuery } from '@tanstack/react-query';
import { officeNameBatched } from '@/lib/offices';

/**
 * A listing office's name for a card, or null while it loads or if unknown.
 *
 * Keyed per office, so the same brokerage on twenty cards is asked for once,
 * and batched in offices.ts, so twenty different ones are one request. Office
 * names change about never; a day's staleness is nothing.
 */
export const useOfficeName = (officeId: string | null | undefined): string | null =>
  useQuery({
    queryKey: ['idx-office', officeId ?? null],
    queryFn: () => officeNameBatched(officeId as string),
    enabled: Boolean(officeId),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  }).data ?? null;
