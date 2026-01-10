import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, MapPin, Users, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface OpenHouseSignIn {
  id: number;
  address: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  works_with_realtor: boolean;
  realtor_name: string | null;
  realtor_company: string | null;
  is_read: boolean;
  created_at: string;
}

interface GroupedOpenHouse {
  address: string;
  signIns: OpenHouseSignIn[];
  count: number;
  unreadCount: number;
}

const OpenHousesList = () => {
  const [groupedOpenHouses, setGroupedOpenHouses] = useState<GroupedOpenHouse[]>([]);
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOpenHouses();
  }, []);

  const fetchOpenHouses = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching open house sign-ins...');
      
      // Test if we can access the table at all
      const { data: testData, error: testError } = await supabase
        .from('open_house_sign_ins')
        .select('id, address, created_at')
        .eq('is_active', true)
        .limit(5);
      
      console.log('🧪 Test query result:', { 
        count: testData?.length || 0,
        data: testData,
        error: testError 
      });
      
      if (testError) {
        console.error('❌ Test query failed - RLS might be blocking:', testError);
        setError(`Access denied: ${testError.message}. Please ensure the is_admin() function is updated and you are marked as admin.`);
        setLoading(false);
        return;
      }
      
      // Fetch open house sign-ins with all columns (only active ones)
      const { data: signInsData, error: signInsError } = await supabase
        .from('open_house_sign_ins')
        .select('id, address, first_name_id, last_name_id, email_id, phone_id, works_with_realtor, realtor_name, realtor_company, is_read, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (signInsError) {
        console.error('❌ Error fetching open house sign-ins:', signInsError);
        console.error('Error code:', signInsError.code);
        console.error('Error message:', signInsError.message);
        console.error('Error details:', signInsError.details);
        console.error('Error hint:', signInsError.hint);
        throw signInsError;
      }

      console.log('📊 Open house sign-ins data:', signInsData?.length || 0, 'records');
      if (signInsData && signInsData.length > 0) {
        console.log('Sample record:', signInsData[0]);
      }

      if (!signInsData || signInsData.length === 0) {
        setGroupedOpenHouses([]);
        return;
      }

      // Get all unique IDs
      const firstNameIds = [...new Set(signInsData.map(s => s.first_name_id).filter(Boolean))];
      const lastNameIds = [...new Set(signInsData.map(s => s.last_name_id).filter(Boolean))];
      const emailIds = [...new Set(signInsData.map(s => s.email_id).filter(Boolean))];
      const phoneIds = [...new Set(signInsData.map(s => s.phone_id).filter(Boolean))];

      console.log('📋 IDs to fetch:', {
        firstNameIds: firstNameIds.length,
        lastNameIds: lastNameIds.length,
        emailIds: emailIds.length,
        phoneIds: phoneIds.length
      });

      // Fetch all related contact data
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

      // Log any errors from contact data queries
      if (firstNames.error) console.error('❌ Error fetching first names:', firstNames.error);
      if (lastNames.error) console.error('❌ Error fetching last names:', lastNames.error);
      if (emails.error) console.error('❌ Error fetching emails:', emails.error);
      if (phones.error) console.error('❌ Error fetching phones:', phones.error);

      console.log('📊 Contact data fetched:', {
        firstNames: firstNames.data?.length || 0,
        lastNames: lastNames.data?.length || 0,
        emails: emails.data?.length || 0,
        phones: phones.data?.length || 0
      });

      // Create lookup maps
      const firstNameMap = new Map((firstNames.data || []).map(f => [f.id, f.first_name]));
      const lastNameMap = new Map((lastNames.data || []).map(l => [l.id, l.last_name]));
      const emailMap = new Map((emails.data || []).map(e => [e.id, e.email]));
      const phoneMap = new Map((phones.data || []).map(p => [p.id, p.phone]));

      console.log('🗺️ Lookup maps created:', {
        firstNameMap: firstNameMap.size,
        lastNameMap: lastNameMap.size,
        emailMap: emailMap.size,
        phoneMap: phoneMap.size
      });

      // Transform the data
      const transformedData: OpenHouseSignIn[] = signInsData.map((item: any) => {
        const firstName = item.first_name_id ? firstNameMap.get(item.first_name_id) : null;
        const lastName = item.last_name_id ? lastNameMap.get(item.last_name_id) : null;
        const email = item.email_id ? emailMap.get(item.email_id) : null;
        const phone = item.phone_id ? phoneMap.get(item.phone_id) : null;
        
        // Log if we're missing data
        if (!firstName && item.first_name_id) {
          console.warn(`⚠️ Missing first name for ID ${item.first_name_id}`);
        }
        if (!lastName && item.last_name_id) {
          console.warn(`⚠️ Missing last name for ID ${item.last_name_id}`);
        }
        if (!email && item.email_id) {
          console.warn(`⚠️ Missing email for ID ${item.email_id}`);
        }
        
        return {
          id: item.id,
          address: item.address,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          works_with_realtor: item.works_with_realtor || false,
          realtor_name: item.realtor_name || null,
          realtor_company: item.realtor_company || null,
          is_read: item.is_read || false,
          created_at: item.created_at,
        };
      });
      
      console.log('🔄 Transformed data:', transformedData.length, 'records');
      if (transformedData.length > 0) {
        console.log('📝 Sample transformed record:', transformedData[0]);
      }

      // Group by address
      const grouped = transformedData.reduce((acc, signIn) => {
        const existing = acc.find(g => g.address === signIn.address);
        if (existing) {
          existing.signIns.push(signIn);
          existing.count += 1;
          if (!signIn.is_read) {
            existing.unreadCount += 1;
          }
        } else {
          acc.push({
            address: signIn.address,
            signIns: [signIn],
            count: 1,
            unreadCount: signIn.is_read ? 0 : 1,
          });
        }
        return acc;
      }, [] as GroupedOpenHouse[]);

      // Sort by count (most sign-ins first)
      grouped.sort((a, b) => b.count - a.count);

      console.log('✅ Successfully loaded', grouped.length, 'open house groups');
      console.log('📦 Grouped data:', grouped);
      
      setGroupedOpenHouses(grouped);
    } catch (err: any) {
      console.error('❌ Error fetching open houses:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(err.message || 'Failed to load open house sign-ins');
    } finally {
      setLoading(false);
    }
  };

  const toggleAddress = (address: string) => {
    const newExpanded = new Set(expandedAddresses);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedAddresses(newExpanded);
  };

  const markAsRead = async (signInId: number, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from('open_house_sign_ins')
        .update({ 
          is_read: isRead,
          read_at: isRead ? new Date().toISOString() : null
        })
        .eq('id', signInId);

      if (error) throw error;

      // Update local state
      setGroupedOpenHouses(prev =>
        prev.map(group => {
          const updatedSignIns = group.signIns.map(signIn =>
            signIn.id === signInId ? { ...signIn, is_read: isRead } : signIn
          );
          return {
            ...group,
            signIns: updatedSignIns,
            unreadCount: updatedSignIns.filter(s => !s.is_read).length
          };
        })
      );
    } catch (err: any) {
      console.error('Error updating read status:', err);
    }
  };

  const deleteSignIn = async (signInId: number) => {
    if (!confirm('Are you sure you want to delete this open house sign-in? This action cannot be undone.')) {
      return;
    }

    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('open_house_sign_ins')
        .update({ is_active: false })
        .eq('id', signInId);

      if (error) throw error;

      // Update local state - remove the sign-in from the appropriate group
      setGroupedOpenHouses(prev => {
        return prev
          .map(group => {
            const updatedSignIns = group.signIns.filter(signIn => signIn.id !== signInId);
            if (updatedSignIns.length === 0) {
              // Return null to filter out empty groups
              return null;
            }
            return {
              ...group,
              signIns: updatedSignIns,
              count: updatedSignIns.length,
              unreadCount: updatedSignIns.filter(s => !s.is_read).length
            };
          })
          .filter((group): group is GroupedOpenHouse => group !== null);
      });
    } catch (err: any) {
      console.error('Error deleting sign-in:', err);
      alert('Failed to delete sign-in. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading open house sign-ins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <p className="font-semibold">Error Loading Data</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <div className="text-xs text-gray-500 mt-4 p-4 bg-gray-50 rounded">
              <p className="font-semibold mb-2">Troubleshooting:</p>
              <ul className="text-left space-y-1">
                <li>1. Check browser console (F12) for detailed errors</li>
                <li>2. Verify the is_admin() function is updated in Supabase</li>
                <li>3. Ensure your user has is_admin: true in app_metadata</li>
                <li>4. Check RLS policies allow admin access</li>
              </ul>
            </div>
            <Button onClick={fetchOpenHouses} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupedOpenHouses.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-semibold">No open house sign-ins yet.</p>
            <p className="text-sm mt-2">Check browser console (F12) to see if data was fetched.</p>
            <Button onClick={fetchOpenHouses} variant="outline" className="mt-4">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalUnread = groupedOpenHouses.reduce((sum, group) => sum + group.unreadCount, 0);

  return (
    <div className="space-y-4">
      {totalUnread > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {totalUnread} {totalUnread === 1 ? 'unread sign-in' : 'unread sign-ins'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {groupedOpenHouses.map((group) => {
        const isExpanded = expandedAddresses.has(group.address);
        return (
          <Card 
            key={group.address}
            className={`${group.unreadCount > 0 ? 'border-blue-300 bg-blue-50' : ''} cursor-pointer`}
            onClick={() => toggleAddress(group.address)}
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
                    <CardTitle className="text-lg">{group.address}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {group.count} {group.count === 1 ? 'sign-in' : 'sign-ins'}
                      </span>
                      {group.unreadCount > 0 && (
                        <span className="text-blue-600 font-semibold">
                          {group.unreadCount} unread
                        </span>
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
                      <div className="flex items-start justify-between">
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
                            {signIn.works_with_realtor && (
                              <div>
                                <strong>Realtor:</strong>{' '}
                                {signIn.realtor_name || 'N/A'}
                                {signIn.realtor_company && ` - ${signIn.realtor_company}`}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(signIn.created_at), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
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

export default OpenHousesList;

