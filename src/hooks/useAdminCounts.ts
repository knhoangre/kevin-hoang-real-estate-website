import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';

/** The reminders panel refreshes this when a showing is marked. */
export const TO_CONFIRM_KEY = ['showings-to-confirm'];

/**
 * Every number waiting for Kevin: what is unread in Follow Up, and the clients he
 * still has to confirm with today. A new number belongs in `total`, which is what
 * shows on his profile picture. Everyone else's are all zero and nothing is asked.
 *
 * The showing count asks the edge function, which has the rule
 * (`clientsToConfirm`) and reads his Google Calendar to answer, so this asks every
 * five minutes rather than every thirty seconds like the unread counts. Google's
 * export is itself about twenty minutes behind. Coming back to the tab asks again
 * after a minute, because he also works from his phone. A failed read shows no
 * number; the page itself says what went wrong.
 */
export function useAdminCounts() {
  const { isAdmin } = useAuth();
  const { unreadCounts } = useUnreadCounts();

  const { data } = useQuery({
    queryKey: TO_CONFIRM_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('showing-reminders', {
        body: { action: 'count' },
      });
      if (error) throw error;
      return (data as { toConfirm: number }).toConfirm;
    },
    enabled: !!isAdmin,
    retry: 1,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const unread = isAdmin ? unreadCounts.total ?? 0 : 0;
  const toConfirm = isAdmin ? data ?? 0 : 0;

  return { unread, toConfirm, total: unread + toConfirm };
}
