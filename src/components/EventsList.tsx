import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';
import { ListEmpty, ListError, ListLoading, UnreadBanner } from '@/components/admin/ListStates';
import SignInGroups from '@/components/admin/SignInGroups';

interface EventSignIn {
  id: number;
  event_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_read: boolean;
  created_at: string;
}

interface GroupedEvent {
  eventName: string;
  signIns: EventSignIn[];
  count: number;
  unreadCount: number;
}

const EventsList = () => {
  const queryClient = useQueryClient();
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: signInsData, error: signInsError } = await supabase
        .from('event_sign_ins')
        .select('id, event_name, first_name_id, last_name_id, email_id, phone_id, is_read, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (signInsError) {
        setError(signInsError.message || 'Failed to load event sign-ins.');
        setLoading(false);
        return;
      }

      if (!signInsData || signInsData.length === 0) {
        setGroupedEvents([]);
        setLoading(false);
        return;
      }

      const firstNameIds = [...new Set(signInsData.map((s) => s.first_name_id).filter(Boolean))];
      const lastNameIds = [...new Set(signInsData.map((s) => s.last_name_id).filter(Boolean))];
      const emailIds = [...new Set(signInsData.map((s) => s.email_id).filter(Boolean))];
      const phoneIds = [...new Set(signInsData.map((s) => s.phone_id).filter(Boolean))];

      const [firstNames, lastNames, emails, phones] = await Promise.all([
        firstNameIds.length > 0
          ? supabase.from('contact_first_names').select('id, first_name').in('id', firstNameIds)
          : { data: [], error: null },
        lastNameIds.length > 0
          ? supabase.from('contact_last_names').select('id, last_name').in('id', lastNameIds)
          : { data: [], error: null },
        emailIds.length > 0
          ? supabase.from('contact_emails').select('id, email').in('id', emailIds)
          : { data: [], error: null },
        phoneIds.length > 0
          ? supabase.from('contact_phones').select('id, phone').in('id', phoneIds)
          : { data: [], error: null },
      ]);

      const firstNameMap = new Map((firstNames.data || []).map((f) => [f.id, f.first_name]));
      const lastNameMap = new Map((lastNames.data || []).map((l) => [l.id, l.last_name]));
      const emailMap = new Map((emails.data || []).map((e) => [e.id, e.email]));
      const phoneMap = new Map((phones.data || []).map((p) => [p.id, p.phone]));

      const transformedData: EventSignIn[] = signInsData.map((item: { id: number; event_name: string; first_name_id: number | null; last_name_id: number | null; email_id: number | null; phone_id: number | null; is_read: boolean; created_at: string }) => ({
        id: item.id,
        event_name: item.event_name,
        first_name: item.first_name_id ? firstNameMap.get(item.first_name_id) ?? null : null,
        last_name: item.last_name_id ? lastNameMap.get(item.last_name_id) ?? null : null,
        email: item.email_id ? emailMap.get(item.email_id) ?? null : null,
        phone: item.phone_id ? phoneMap.get(item.phone_id) ?? null : null,
        is_read: item.is_read ?? false,
        created_at: item.created_at,
      }));

      const grouped = transformedData.reduce((acc, signIn) => {
        const existing = acc.find((g) => g.eventName === signIn.event_name);
        if (existing) {
          existing.signIns.push(signIn);
          existing.count += 1;
          if (!signIn.is_read) existing.unreadCount += 1;
        } else {
          acc.push({
            eventName: signIn.event_name,
            signIns: [signIn],
            count: 1,
            unreadCount: signIn.is_read ? 0 : 1,
          });
        }
        return acc;
      }, [] as GroupedEvent[]);

      grouped.sort((a, b) => b.count - a.count);
      setGroupedEvents(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event sign-ins.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventName: string) => {
    const next = new Set(expandedEvents);
    if (next.has(eventName)) next.delete(eventName);
    else next.add(eventName);
    setExpandedEvents(next);
  };

  const markAsRead = async (signInId: number, isRead: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('event_sign_ins')
        .update({
          is_read: isRead,
          read_at: isRead ? new Date().toISOString() : null,
        })
        .eq('id', signInId);

      if (updateError) throw updateError;

      setGroupedEvents((prev) =>
        prev.map((group) => {
          const updatedSignIns = group.signIns.map((s) =>
            s.id === signInId ? { ...s, is_read: isRead } : s
          );
          return {
            ...group,
            signIns: updatedSignIns,
            unreadCount: updatedSignIns.filter((s) => !s.is_read).length,
          };
        })
      );
      queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
    } catch (err) {
      console.error('Error updating read status:', err);
    }
  };

  const deleteSignIn = async (signInId: number) => {
    if (!confirm('Are you sure you want to delete this event sign-in? This cannot be undone.')) return;
    try {
      const { error: deleteError } = await supabase
        .from('event_sign_ins')
        .update({ is_active: false })
        .eq('id', signInId);

      if (deleteError) throw deleteError;

      setGroupedEvents((prev) =>
        prev
          .map((group) => {
            const updatedSignIns = group.signIns.filter((s) => s.id !== signInId);
            if (updatedSignIns.length === 0) return null;
            return {
              ...group,
              signIns: updatedSignIns,
              count: updatedSignIns.length,
              unreadCount: updatedSignIns.filter((s) => !s.is_read).length,
            };
          })
          .filter((g): g is GroupedEvent => g !== null)
      );
      queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
    } catch (err) {
      console.error('Error deleting sign-in:', err);
      alert('Failed to delete sign-in. Please try again.');
    }
  };

  if (loading) return <ListLoading label="Loading event sign-ins" />;

  if (error) return <ListError message={error} onRetry={fetchEvents} />;

  if (groupedEvents.length === 0) {
    return <ListEmpty icon={Calendar} heading="No event sign-ins yet." onRefresh={fetchEvents} />;
  }

  const totalUnread = groupedEvents.reduce((sum, g) => sum + g.unreadCount, 0);

  return (
    <div className="space-y-4">
      <UnreadBanner count={totalUnread} noun="sign-in" />

      <SignInGroups
        groups={groupedEvents.map((group) => ({ ...group, title: group.eventName }))}
        expanded={expandedEvents}
        onToggle={toggleEvent}
        onToggleRead={markAsRead}
        onDelete={deleteSignIn}
      />
    </div>
  );
};

export default EventsList;
