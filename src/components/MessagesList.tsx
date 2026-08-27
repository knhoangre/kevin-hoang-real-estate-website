import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Calendar, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { errorMessage } from '@/lib/utils';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button onClick={fetchMessages} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No messages yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {unreadCount} {unreadCount === 1 ? 'unread message' : 'unread messages'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {messages.map((message) => (
        <Card
          key={message.id}
          className={!message.is_read ? 'border-blue-300 bg-blue-50' : ''}
        >
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {message.first_name} {message.last_name}
                  {!message.is_read && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      NEW
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  {message.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a
                        href={`mailto:${message.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {message.email}
                      </a>
                    </div>
                  )}
                  {message.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${message.phone.replace(/\D/g, '')}`}
                          className="text-blue-600 hover:underline"
                        >
                          {message.phone}
                        </a>
                        <span className="text-gray-400">|</span>
                        <a
                          href={`sms:${message.phone.replace(/\D/g, '')}`}
                          className="text-blue-600 hover:underline"
                        >
                          Text
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                  {message.source && (
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>Source:</strong> {message.source}
                    </div>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 md:ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsRead(message.id, !message.is_read)}
                >
                  {message.is_read ? 'Mark as Unread' : 'Mark as Read'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMessage(message.id)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 border">
              <p className="whitespace-pre-wrap">{message.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MessagesList;

