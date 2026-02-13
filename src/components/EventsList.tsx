import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Calendar, Users, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading event sign-ins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="font-semibold text-red-600">{error}</p>
            <Button onClick={fetchEvents} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupedEvents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-semibold">No event sign-ins yet.</p>
            <Button onClick={fetchEvents} variant="outline" className="mt-4">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalUnread = groupedEvents.reduce((sum, g) => sum + g.unreadCount, 0);

  return (
    <div className="space-y-4">
      {totalUnread > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {totalUnread} {totalUnread === 1 ? 'unread sign-in' : 'unread sign-ins'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {groupedEvents.map((group) => {
        const isExpanded = expandedEvents.has(group.eventName);
        return (
          <Card
            key={group.eventName}
            className={`${group.unreadCount > 0 ? 'border-blue-300 bg-blue-50' : ''} cursor-pointer`}
            onClick={() => toggleEvent(group.eventName)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{group.eventName}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {group.count} {group.count === 1 ? 'sign-in' : 'sign-ins'}
                      </span>
                      {group.unreadCount > 0 && (
                        <span className="text-blue-600 font-semibold">{group.unreadCount} unread</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent onClick={(e) => e.stopPropagation()}>
                <div className="space-y-4">
                  {group.signIns.map((signIn) => (
                    <div
                      key={signIn.id}
                      className={`border-l-2 pl-4 py-2 ${
                        !signIn.is_read ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold flex items-center gap-2">
                            {signIn.first_name} {signIn.last_name}
                            {!signIn.is_read && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1 mt-1">
                            {signIn.email && (
                              <div>
                                <strong>Email:</strong>{' '}
                                <a
                                  href={`mailto:${signIn.email}`}
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {signIn.email}
                                </a>
                              </div>
                            )}
                            {signIn.phone && (
                              <div className="flex items-center gap-2">
                                <strong>Phone:</strong>
                                <a
                                  href={`tel:${signIn.phone.replace(/\D/g, '')}`}
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {signIn.phone}
                                </a>
                                <span className="text-gray-400">|</span>
                                <a
                                  href={`sms:${signIn.phone.replace(/\D/g, '')}`}
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Text
                                </a>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(signIn.created_at), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(signIn.id, !signIn.is_read);
                            }}
                          >
                            {signIn.is_read ? 'Mark as Unread' : 'Mark as Read'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSignIn(signIn.id);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default EventsList;
