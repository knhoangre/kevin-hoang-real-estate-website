import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import AdminList from '@/components/admin/AdminList';
import { supabase } from '@/integrations/supabase/client';
import { SITE } from '@/lib/siteConfig';
import { monthName } from '@/lib/marketText';

/**
 * Who has signed up for the monthly market email, on /admin/market.
 *
 * Read straight from the tables under the admin's SELECT policy; nothing here
 * writes. A subscriber stops the email themselves from the link in it.
 */
interface Subscriber {
  id: string;
  email: string;
  towns: string[];
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

/**
 * A scoped cast, the same stopgap as CompsSchema in idxComps.ts: types.ts cannot
 * describe these two tables until 20261106100000_market_email is pushed and it
 * is regenerated. Delete this and read through `supabase` once it is.
 */
interface SubscribersSchema {
  public: {
    Tables: {
      market_subscribers: { Row: Subscriber; Insert: never; Update: never; Relationships: [] };
      market_email_sends: {
        Row: { subscriber_id: string; month: string; sent_at: string | null };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
const db = supabase as unknown as SupabaseClient<SubscribersSchema>;

const townName = (slug: string) => SITE.areaServed.find((t) => t.slug === slug)?.name ?? slug;
const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

const MarketSubscribers = () => {
  const [subs, setSubs] = useState<Subscriber[] | null>(null);
  const [lastSent, setLastSent] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data, error: e1 }, { data: sends, error: e2 }] = await Promise.all([
        db
          .from('market_subscribers')
          .select('id, email, towns, created_at, confirmed_at, unsubscribed_at')
          .order('created_at', { ascending: false }),
        db.from('market_email_sends').select('subscriber_id, month, sent_at').not('sent_at', 'is', null),
      ]);
      if (e1 || e2) throw e1 ?? e2;
      const latest = new Map<string, string>();
      for (const s of sends ?? []) if ((latest.get(s.subscriber_id) ?? '') < s.month) latest.set(s.subscriber_id, s.month);
      setLastSent(latest);
      setSubs(data ?? []);
    })().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const active = subs?.filter((s) => s.confirmed_at && !s.unsubscribed_at).length ?? 0;
  const waiting = subs?.filter((s) => !s.confirmed_at && !s.unsubscribed_at).length ?? 0;
  const stopped = subs?.filter((s) => s.unsubscribed_at).length ?? 0;

  return (
    <section className="mt-16" aria-labelledby="subscribers">
      <h2 id="subscribers" className="text-xl font-semibold text-ink">
        Monthly email subscribers
      </h2>
      {error && <p className="mt-3 text-red-700">{error}</p>}
      {subs && (
        <>
          <p className="mt-2 text-sm text-gray-600">
            {active} subscribed, {waiting} waiting to confirm, {stopped} unsubscribed.
            {active > 0 && lastSent.size === 0 &&
              ' No monthly email has gone yet: they start once a mailing address is set for the footer, which US anti-spam law requires.'}
          </p>
          {subs.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <AdminList
                label="Monthly email subscribers"
                columns={[
                  { label: 'Email', primary: true },
                  { label: 'Towns' },
                  { label: 'Status' },
                  { label: 'Last sent' },
                ]}
                grid="md:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)]"
                rows={subs.map((s) => ({
                  key: s.id,
                  cells: [
                    <span key="e" className="break-all font-medium text-ink">
                      {s.email}
                    </span>,
                    s.towns.map(townName).join(', '),
                    s.unsubscribed_at
                      ? `Unsubscribed ${day(s.unsubscribed_at)}`
                      : s.confirmed_at
                        ? `Since ${day(s.confirmed_at)}`
                        : `Not confirmed (signed up ${day(s.created_at)})`,
                    lastSent.get(s.id) ? monthName(lastSent.get(s.id) as string) : '—',
                  ],
                }))}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default MarketSubscribers;
