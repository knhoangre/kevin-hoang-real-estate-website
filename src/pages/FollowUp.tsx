import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import OpenHousesList from '@/components/OpenHousesList';
import MessagesList from '@/components/MessagesList';
import EventsList from '@/components/EventsList';

const FollowUp = () => {
  const { isAdmin, loading } = useAuth();
  const { unreadCounts } = useUnreadCounts();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine tab from URL
  const getTabFromPath = (path: string) => {
    if (path === '/admin/follow-up/messages') return 'messages';
    if (path === '/admin/follow-up/open-house') return 'open-houses';
    if (path === '/admin/follow-up/events') return 'events';
    return 'open-houses'; // default
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  // Handle admin check and initial redirect
  useEffect(() => {
    if (loading) return;
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    // Redirect /admin/follow-up to /admin/follow-up/open-house
    if (location.pathname === '/admin/follow-up') {
      navigate('/admin/follow-up/open-house', { replace: true });
    }
  }, [isAdmin, loading, navigate, location.pathname]);

  // Sync tab state with URL changes (e.g., back button)
  useEffect(() => {
    const tabFromPath = getTabFromPath(location.pathname);
    if (tabFromPath !== activeTab) {
      setActiveTab(tabFromPath);
    }
  }, [location.pathname]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'messages') {
      navigate('/admin/follow-up/messages');
    } else if (value === 'events') {
      navigate('/admin/follow-up/events');
    } else {
      navigate('/admin/follow-up/open-house');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl font-bold mb-6">Follow Up</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="open-houses" className="flex items-center gap-2">
              <span>Open Houses</span>
              {unreadCounts.openHouses > 0 && (
                <Badge variant="destructive">
                  {unreadCounts.openHouses}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <span>Events</span>
              {unreadCounts.events > 0 && (
                <Badge variant="destructive">
                  {unreadCounts.events}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <span>Messages</span>
              {unreadCounts.messages > 0 && (
                <Badge variant="destructive">
                  {unreadCounts.messages}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="open-houses" className="mt-6">
            <OpenHousesList />
          </TabsContent>
          
          <TabsContent value="events" className="mt-6">
            <EventsList />
          </TabsContent>
          
          <TabsContent value="messages" className="mt-6">
            <MessagesList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FollowUp;

