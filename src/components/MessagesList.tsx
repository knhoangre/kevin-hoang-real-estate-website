import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

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
      const transformedData: ContactMessage[] = (data || []).map((item: any) => {
        // Check if data is from view (flattened) or table (nested)
        const firstName = item.first_name || 
                         (item.contact_first_names?.first_name) ||
                         (Array.isArray(item.contact_first_names) && item.contact_first_names[0]?.first_name) ||
                         null;
        const lastName = item.last_name || 
                        (item.contact_last_names?.last_name) ||
                        (Array.isArray(item.contact_last_names) && item.contact_last_names[0]?.last_name) ||
                        null;
        const email = item.email || 
                     (item.contact_emails?.email) ||
                     (Array.isArray(item.contact_emails) && item.contact_emails[0]?.email) ||
                     null;
        const phone = item.phone || 
                     (item.contact_phones?.phone) ||
                     (Array.isArray(item.contact_phones) && item.contact_phones[0]?.phone) ||
                     null;
        const source = item.source ||
                      (item.contact_sources?.source) ||
                      (Array.isArray(item.contact_sources) && item.contact_sources[0]?.source) ||
                      null;

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
    } catch (err: any) {
      console.error('❌ Error fetching messages:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(err.message || 'Failed to load messages');
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
    } catch (err: any) {
      console.error('Error updating read status:', err);
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
            <div className="flex items-start justify-between">
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAsRead(message.id, !message.is_read)}
              >
                {message.is_read ? 'Mark as Unread' : 'Mark as Read'}
              </Button>
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

