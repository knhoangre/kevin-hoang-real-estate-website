import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadCounts() {
  const { isAdmin } = useAuth();

  const { data: unreadCounts, isLoading } = useQuery({
    queryKey: ['unread-counts'],
    queryFn: async () => {
      if (!isAdmin) {
        return { messages: 0, openHouses: 0, events: 0 };
      }

      // Get unread messages count
      const { count: messagesCount, error: messagesError } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_read', false);

      if (messagesError) {
        console.error('Error fetching unread messages count:', messagesError);
      }

      // Get unread open houses count
      const { count: openHousesCount, error: openHousesError } = await supabase
        .from('open_house_sign_ins')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_read', false);

      if (openHousesError) {
        console.error('Error fetching unread open houses count:', openHousesError);
      }

      // Get unread events count
      const { count: eventsCount, error: eventsError } = await supabase
        .from('event_sign_ins')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_read', false);

      if (eventsError) {
        console.error('Error fetching unread events count:', eventsError);
      }

      const messages = messagesCount || 0;
      const openHouses = openHousesCount || 0;
      const events = eventsCount || 0;

      return {
        messages,
        openHouses,
        events,
        total: messages + openHouses + events,
      };
    },
    enabled: !!isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    unreadCounts: unreadCounts || { messages: 0, openHouses: 0, events: 0, total: 0 },
    isLoading,
  };
}
