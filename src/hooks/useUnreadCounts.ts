import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadCounts() {
  const { isAdmin } = useAuth();

  const { data: unreadCounts, isLoading } = useQuery({
    queryKey: ['unread-counts'],
    queryFn: async () => {
      if (!isAdmin) {
        return { messages: 0, openHouses: 0 };
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

      return {
        messages: messagesCount || 0,
        openHouses: openHousesCount || 0,
        total: (messagesCount || 0) + (openHousesCount || 0),
      };
    },
    enabled: !!isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    unreadCounts: unreadCounts || { messages: 0, openHouses: 0, total: 0 },
    isLoading,
  };
}
