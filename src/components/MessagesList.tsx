import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { errorMessage } from '@/lib/utils';
import { AdminCard } from '@/components/AdminShell';
import { ListEmpty, ListError, ListLoading, UnreadBanner } from '@/components/admin/ListStates';
import { DetailLabel, LINK, RowActions } from '@/components/admin/SignInGroups';

/**
 * A row as it arrives from either source: the flattened `unified_contacts`
 * view, or the base table with its related contact_* rows nested. Supabase
 * returns the nested ones as an object or a single-element array depending on
 * the relationship, which is why each shape is a union.
 */

/**
 * Reads one field out of a Supabase relation that arrives either as an object
 * or as a single-element array, depending on how the relationship resolves.
 * Each call site used to spell this out as a three-branch `||` chain.
 */
const joined = (
  v: Record<string, unknown> | Record<string, unknown>[] | null | undefined,
  key: string,
): string | null => {
  const row = Array.isArray(v) ? v[0] : v;
  const value = row?.[key];
  return typeof value === 'string' ? value : null;
};

type JoinedContactRow = {
  [key: string]: unknown;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  [relation: `contact_${string}`]:
    | Record<string, unknown>
    | Record<string, unknown>[]
    | null
    | undefined;
};


interface ContactMessage {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  message: string;
  is_read: boolean;
  source: string | null;
  created_at: string;
}

const MessagesList = () => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching contact messages...');
      
      // First try the view, if it fails, try the table directly
      let data, fetchError;
      
      const viewResult = await supabase
        .from('contact_messages_view')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (viewResult.error) {
        console.warn('⚠️ View query failed, trying table directly:', viewResult.error);
        // Fallback to querying the table directly with joins
        const tableResult = await supabase
          .from('contact_messages')
          .select(`
            id,
            message,
            is_read,
            created_at,
            contact_first_names:first_name_id (first_name),
            contact_last_names:last_name_id (last_name),
            contact_emails:email_id (email),
            contact_phones:phone_id (phone),
            contact_sources:source_id (source)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        data = tableResult.data;
        fetchError = tableResult.error;
      } else {
        data = viewResult.data;
        fetchError = viewResult.error;
      }

      if (fetchError) {
        console.error('❌ Error fetching messages:', fetchError);
        console.error('Error code:', fetchError.code);
        console.error('Error message:', fetchError.message);
        console.error('Error details:', fetchError.details);
        console.error('Error hint:', fetchError.hint);
        throw fetchError;
      }

      console.log('📊 Contact messages data:', data?.length || 0, 'records');
      if (data && data.length > 0) {
        console.log('Sample record:', data[0]);
      }

      // Transform the data - handle both view format and direct table format
      const transformedData: ContactMessage[] = (data || []).map((item: JoinedContactRow) => {
        // Check if data is from view (flattened) or table (nested)
        const firstName = item.first_name ?? joined(item.contact_first_names, 'first_name');
        const lastName = item.last_name ?? joined(item.contact_last_names, 'last_name');
        const email = item.email ?? joined(item.contact_emails, 'email');
        const phone = item.phone ?? joined(item.contact_phones, 'phone');
        const source = item.source ?? joined(item.contact_sources, 'source');

        return {
          id: item.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          message: item.message,
          is_read: item.is_read || false,
          source: source,
          created_at: item.created_at,
        };
      });

      setMessages(transformedData);
      console.log('✅ Successfully loaded', transformedData.length, 'messages');
    } catch (err: unknown) {
      console.error('❌ Error fetching messages:', err);
      setError(errorMessage(err) || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: number, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          is_read: isRead,
          read_at: isRead ? new Date().toISOString() : null
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, is_read: isRead } : msg
        )
      );

      // Invalidate unread counts query to update badges
      queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
    } catch (err: unknown) {
      console.error('Error updating read status:', err);
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_active: false })
        .eq('id', messageId);

      if (error) throw error;

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err: unknown) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message. Please try again.');
    }
  };

  if (loading) return <ListLoading label="Loading messages" />;

  if (error) return <ListError message={error} onRetry={fetchMessages} />;

  if (messages.length === 0) {
    return (
      <ListEmpty icon={MessageSquare} heading="No messages yet." onRefresh={fetchMessages} />
    );
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-4">
      <UnreadBanner count={unreadCount} noun="message" />

      {messages.map((message) => (
        <AdminCard
          key={message.id}
          className={message.is_read ? '' : 'border-l-4 border-l-champagne'}
        >
          <div className="flex flex-col gap-4 px-6 pt-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink">
                {message.first_name} {message.last_name}
                {!message.is_read && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white">
                    New
                  </span>
                )}
              </h3>

              <div className="mt-2 space-y-1.5 text-sm text-gray-700">
                {message.email && (
                  <p className="flex flex-wrap items-center gap-2">
                    <DetailLabel>Email</DetailLabel>
                    <a href={`mailto:${message.email}`} className={LINK}>
                      {message.email}
                    </a>
                  </p>
                )}
                {message.phone && (
                  <p className="flex flex-wrap items-center gap-2">
                    <DetailLabel>Phone</DetailLabel>
                    <a href={`tel:${message.phone.replace(/\D/g, '')}`} className={LINK}>
                      {message.phone}
                    </a>
                    <span className="text-gray-300" aria-hidden>
                      |
                    </span>
                    <a href={`sms:${message.phone.replace(/\D/g, '')}`} className={LINK}>
                      Text
                    </a>
                  </p>
                )}
                {message.source && (
                  <p className="flex flex-wrap items-center gap-2">
                    <DetailLabel>Source</DetailLabel>
                    <span>{message.source}</span>
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-gray-500">
                  <Calendar className="h-3 w-3" aria-hidden />
                  {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>

            <RowActions
              isRead={message.is_read}
              onToggleRead={() => markAsRead(message.id, !message.is_read)}
              onDelete={() => deleteMessage(message.id)}
              label={`${message.first_name ?? ''} ${message.last_name ?? ''}`.trim()}
            />
          </div>

          <div className="px-6 pb-6 pt-4">
            <p className="whitespace-pre-wrap rounded-lg bg-bone p-4 text-sm leading-relaxed text-ink">
              {message.message}
            </p>
          </div>
        </AdminCard>
      ))}
    </div>
  );
};

export default MessagesList;
