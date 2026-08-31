import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminShell from '@/components/AdminShell';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OpenHousesList from '@/components/OpenHousesList';
import MessagesList from '@/components/MessagesList';
import EventsList from '@/components/EventsList';

/** The three tabs, in the order they are shown. */
const TABS = [
  { value: 'open-houses', label: 'Open Houses' },
  { value: 'events', label: 'Events' },
  { value: 'messages', label: 'Messages' },
] as const;

const FollowUp = () => {
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

  // AdminShell owns the admin gate, and /admin is its own hub page now. This
  // effect only lands the bare /admin/follow-up on a real tab.
  useEffect(() => {
    if (location.pathname === '/admin/follow-up') {
      navigate('/admin/follow-up/open-house', { replace: true });
    }
  }, [navigate, location.pathname]);

  // Sync tab state with URL changes (e.g., back button)
  useEffect(() => {
    const tabFromPath = getTabFromPath(location.pathname);
    if (tabFromPath !== activeTab) {
      setActiveTab(tabFromPath);
    }
  }, [location.pathname, activeTab]);

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

  const counts: Record<string, number> = {
    'open-houses': unreadCounts.openHouses,
    events: unreadCounts.events,
    messages: unreadCounts.messages,
  };

  return (
    <AdminShell
      title="Follow Up"
      description="Open house and event sign-ins, and messages sent through the site."
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/*
          An underlined tab rail rather than the shadcn grey pill group, which
          is the one piece of default chrome the site's own nav treatments never
          use. Overridden here rather than in ui/tabs.tsx, because /auth and the
          calculators still render the stock component.
        */}
        <TabsList className="h-auto w-full justify-start gap-8 rounded-none border-b border-gray-200 bg-transparent p-0">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="group relative flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500 transition-colors hover:text-ink data-[state=active]:border-champagne data-[state=active]:bg-transparent data-[state=active]:text-ink data-[state=active]:shadow-none"
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[0.65rem] font-semibold tracking-normal text-white">
                  {counts[tab.value]}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </TabsTrigger>
          ))}
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
    </AdminShell>
  );
};

export default FollowUp;
