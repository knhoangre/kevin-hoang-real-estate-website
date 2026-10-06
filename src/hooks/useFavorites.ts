import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { rememberReturnPath } from '@/lib/authReturn';
import { listFavorites, saveListing, unsaveListing, type FavoriteRow } from '@/lib/favorites';

/**
 * The signed-in visitor's saved homes, and the one action on them.
 *
 * Every heart on a page calls this — twenty-four cards on /search do — and
 * react-query keys it on the user, so they share ONE request rather than making
 * one each. That is also what keeps them in step: saving from a card fills the
 * heart on every other card showing the same home.
 *
 * Nothing here reads the session during render beyond what AuthContext already
 * exposes, and a signed-out visitor is the same on the server as on the client,
 * so a heart is not a hydration surface.
 */

const favoritesKey = (userId: string | null) => ['favorites', userId] as const;

/** What an optimistic row looks like until the database's own copy replaces it. */
const pendingRow = (userId: string, mls: string): FavoriteRow => ({
  user_id: userId,
  mls_number: mls,
  address: null,
  town: null,
  state: null,
  zip: null,
  prop_type: null,
  list_price: null,
  bedrooms: null,
  full_baths: null,
  half_baths: null,
  living_area: null,
  photo_count: null,
  created_at: new Date().toISOString(),
});

export const useFavorites = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const userId = user?.id ?? null;
  const key = useMemo(() => favoritesKey(userId), [userId]);

  const query = useQuery({
    queryKey: key,
    queryFn: () => listFavorites(userId as string),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const saved = useMemo(
    () => new Set((query.data ?? []).map((row) => row.mls_number)),
    [query.data]
  );

  const toggle = useCallback(
    async (mls: string) => {
      // Still resolving the session: pressing now would send a signed-in
      // visitor to the sign-in page.
      if (loading) return;

      if (!userId) {
        // Come back to this listing, not to the homepage.
        rememberReturnPath();
        navigate('/auth');
        return;
      }

      const wasSaved = saved.has(mls);
      // Optimistic: a heart that fills a round trip after it is pressed reads
      // as a press that did not register, and gets pressed again.
      queryClient.setQueryData<FavoriteRow[]>(key, (rows = []) =>
        wasSaved ? rows.filter((r) => r.mls_number !== mls) : [pendingRow(userId, mls), ...rows]
      );

      try {
        if (wasSaved) await unsaveListing(userId, mls);
        else await saveListing(mls);
      } catch (err) {
        console.error('Could not update saved homes:', err);
        // The database's refusals (a listing that has gone, the 500 ceiling)
        // are raised as check_violation with a message written to be read.
        const refusal = err as { code?: string; message?: string } | null;
        toast({
          variant: 'destructive',
          title: wasSaved ? 'Could not remove it' : 'Could not save it',
          description:
            refusal?.code === '23514' && refusal.message
              ? refusal.message
              : 'Please try again in a moment.',
        });
      } finally {
        // Either way, replace the guess with what the database now holds.
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
    [loading, userId, saved, queryClient, key, navigate, toast]
  );

  return {
    /** False until the session is known. */
    ready: !loading,
    signedIn: Boolean(userId),
    userId,
    favorites: query.data ?? [],
    favoritesLoading: Boolean(userId) && query.isLoading,
    isSaved: (mls: string) => saved.has(mls),
    toggle,
  };
};
