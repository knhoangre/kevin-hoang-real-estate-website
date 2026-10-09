/**
 * /admin/activity — what signed-in clients have saved and looked at.
 *
 * The reason a client's saved homes live on this site rather than on Zillow:
 * Kevin can see that somebody saved three colonials in Needham under $1.2M and
 * opened one of them six times, and call about that one.
 *
 * READ ONLY. This page shows; it changes nothing. A client's list is theirs —
 * the admin's policy on `listing_favorites` is SELECT, and there is deliberately
 * no control here that would need more.
 *
 * Disclosed to the people it is about, on /saved and in the privacy policy.
 *
 * `?user=<uuid>` opens one client, like `?id=` on the other admin tools: a
 * dynamic segment could not be prerendered and would need a rewrite of its own.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Eye, Heart, Loader2 } from 'lucide-react';
import AdminShell, { AdminCard, adminActionClass } from '@/components/AdminShell';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/listings';
import { describeProfile, tasteProfile } from '@/lib/recommendations';
import {
  clientActivity,
  clientDetail,
  signalsFrom,
  type ClientActivity,
  type FavoriteRow,
  type ViewRow,
} from '@/lib/favorites';
import { listingPath } from '@/lib/listingUrl';

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';

const where = (row: { address: string | null; town: string | null; mls_number: string }) =>
  [row.address, row.town].filter(Boolean).join(', ') || `MLS ${row.mls_number}`;

/** The home's page on this site. A new tab, so the list is still there afterwards. */
const ListingLink = ({
  row,
}: {
  row: { mls_number: string; address: string | null; town: string | null };
}) => (
  <a
    href={listingPath(row)}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-xs font-medium text-champagne-ink hover:underline"
  >
    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    View
  </a>
);

const price = (row: { list_price: number | null; prop_type: string | null }) =>
  row.list_price === null
    ? '—'
    : `${formatPrice(row.list_price)}${row.prop_type === 'RN' ? '/mo' : ''}`;

export default function AdminActivity() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const openUser = params.get('user');

  const [clients, setClients] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ favorites: FavoriteRow[]; views: ViewRow[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    clientActivity()
      .then((rows) => {
        if (!cancelled) setClients(rows);
      })
      .catch((err) => {
        console.error('Could not load client activity:', err);
        toast({ variant: 'destructive', title: 'Could not load', description: 'Refresh the page to try again.' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    setDetail(null);
    if (!openUser) return undefined;
    let cancelled = false;
    clientDetail(openUser)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        console.error('Could not load that client:', err);
        toast({ variant: 'destructive', title: 'Could not load that client' });
      });
    return () => {
      cancelled = true;
    };
  }, [openUser, toast]);

  const client = useMemo(
    () => clients.find((c) => c.userId === openUser) ?? null,
    [clients, openUser]
  );

  /* ---- One client ---------------------------------------------------- */
  if (openUser) {
    // The same profile the client's own "Recommended for you" is built from,
    // so what Kevin reads here is what the site is showing them.
    const profile = detail ? tasteProfile(signalsFrom(detail.favorites, detail.views)) : null;

    return (
      <AdminShell
        title={client?.name || client?.email || 'Client'}
        description={client?.name ? client.email ?? undefined : undefined}
        actions={
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            className={adminActionClass('ghost')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            All clients
          </button>
        }
      >
        {!detail ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
          </div>
        ) : (
          <div className="space-y-8">
            {profile && (
              <AdminCard>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Looking in
                  </p>
                  <p className="numeral mt-2 text-base text-ink">
                    {describeProfile(profile, formatPrice)}
                    {profile.bedrooms !== null && ` · around ${profile.bedrooms} bedrooms`}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Worked out from the homes below, saved ones counting most. It is what their
                    recommendations on the site are built from.
                  </p>
                </div>
              </AdminCard>
            )}

            <section>
              <h2 className="numeral mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                <Heart className="h-4 w-4" aria-hidden />
                Saved ({detail.favorites.length})
              </h2>
              <AdminCard>
                {detail.favorites.length === 0 ? (
                  <p className="p-6 text-sm text-gray-600">Nothing saved.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Home</th>
                        <th className="px-6 py-3 font-semibold">Price when saved</th>
                        <th className="px-6 py-3 font-semibold">Saved</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {detail.favorites.map((row) => (
                        <tr key={row.mls_number} className="border-b border-gray-100 last:border-0">
                          <td className="numeral px-6 py-4 font-medium text-ink">{where(row)}</td>
                          <td className="numeral px-6 py-4 text-gray-700">{price(row)}</td>
                          <td className="numeral px-6 py-4 text-gray-700">{when(row.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            <ListingLink row={row} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </AdminCard>
            </section>

            <section>
              <h2 className="numeral mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                <Eye className="h-4 w-4" aria-hidden />
                Viewed ({detail.views.length})
              </h2>
              <AdminCard>
                {detail.views.length === 0 ? (
                  <p className="p-6 text-sm text-gray-600">Nothing viewed while signed in.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Home</th>
                        <th className="px-6 py-3 font-semibold">Price</th>
                        <th className="px-6 py-3 font-semibold">Times opened</th>
                        <th className="px-6 py-3 font-semibold">Last opened</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {detail.views.map((row) => (
                        <tr key={row.mls_number} className="border-b border-gray-100 last:border-0">
                          <td className="numeral px-6 py-4 font-medium text-ink">{where(row)}</td>
                          <td className="numeral px-6 py-4 text-gray-700">{price(row)}</td>
                          <td className="numeral px-6 py-4 text-gray-700">{row.view_count}</td>
                          <td className="numeral px-6 py-4 text-gray-700">{when(row.last_viewed_at)}</td>
                          <td className="px-6 py-4 text-right">
                            <ListingLink row={row} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </AdminCard>
            </section>
          </div>
        )}
      </AdminShell>
    );
  }

  /* ---- Everyone ------------------------------------------------------ */
  return (
    <AdminShell
      title="Client activity"
      description="Who has saved homes on the site, and what they have been looking at."
    >
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
        </div>
      ) : clients.length === 0 ? (
        <AdminCard>
          <p className="p-6 text-sm leading-relaxed text-gray-600">
            Nobody yet. A client shows up here once they sign in and save a home or open a listing.
            Your own browsing is never recorded.
          </p>
        </AdminCard>
      ) : (
        <AdminCard>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Client</th>
                <th className="px-6 py-3 font-semibold">Saved</th>
                <th className="px-6 py-3 font-semibold">Viewed</th>
                <th className="px-6 py-3 font-semibold">Last active</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.userId}
                  onClick={() => setParams({ user: c.userId })}
                  className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-bone"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-ink">{c.name || c.email || 'Unnamed account'}</span>
                    {c.name && <span className="block text-xs text-gray-500">{c.email}</span>}
                  </td>
                  <td className="numeral px-6 py-4 text-gray-700">{c.savedCount}</td>
                  <td className="numeral px-6 py-4 text-gray-700">{c.viewedCount}</td>
                  <td className="numeral px-6 py-4 text-gray-700">{when(c.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}
    </AdminShell>
  );
}
