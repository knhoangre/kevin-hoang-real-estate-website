import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import AdminShell, { ADMIN_BUTTON } from '@/components/AdminShell';
import MarketAnalysis from '@/components/market/MarketAnalysis';
import { LINK } from '@/components/market/MarketParts';
import { supabase } from '@/integrations/supabase/client';
import { useHydrated } from '@/hooks/useHydrated';
import { townsWithListings } from '@/lib/idxSearch';
import { TRACKING_SINCE, buildReport, lastCompleteMonth, type MarketReport } from '@/lib/market';
import { fetchSalesCoverage, fetchTownRows } from '@/lib/marketFetch';
import { buyerTakeaways, dateLong, monthName, sellerTakeaways, townSummary } from '@/lib/marketText';
import { SITE, absoluteUrl } from '@/lib/siteConfig';
import marketIndex from '@/data/market/index.json';

/**
 * /admin/market — any town's market report, built live, for Kevin.
 *
 * The public reports cover sixteen towns and change once a month. This builds
 * the same report, with the same code, for ANY Massachusetts town in the feed
 * and as of today — the town a client just asked about, the morning of a
 * listing appointment. `?town=` keeps the choice in the URL, so it needs no
 * rewrite and a link to it can be saved.
 *
 * "Copy for a client" puts the short answer and the main points on the
 * clipboard as plain text, with the public page's link where the town has one —
 * something to paste into a text or an email.
 *
 * Towns outside SITE.areaServed have no sales archive, so their twelve months
 * start where MLS PIN's rolling feed does; the windows say so.
 */
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

const clientText = (r: MarketReport, published: boolean): string =>
  [
    `${r.town} housing market, through ${monthName(r.month)}`,
    '',
    townSummary(r),
    '',
    ...buyerTakeaways(r).slice(0, 2).map((t) => `• ${t}`),
    ...sellerTakeaways(r).slice(0, 2).map((t) => `• ${t}`),
    '',
    `Based on information from MLS PIN for closings through ${dateLong(r.windows[0].to)}, and listings as of ${dateLong(r.asOf)}.`,
    ...(published ? [`The full report: ${absoluteUrl(`/market/${r.slug}`)}`] : []),
    `— ${SITE.agentName}, ${SITE.brokerage}`,
  ].join('\n');

const AdminMarket = () => {
  const hydrated = useHydrated();
  const [params, setParams] = useSearchParams();
  const [towns, setTowns] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [report, setReport] = useState<MarketReport | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // The query string is read only after hydration: the prerendered shell was
  // made with none. See useHydrated.
  const town = hydrated ? params.get('town') ?? '' : '';

  useEffect(() => {
    townsWithListings()
      .then((rows) => setTowns(rows.map((r) => r.town).sort()))
      .catch(() => setTowns(SITE.areaServed.map((t) => t.name)));
  }, []);

  useEffect(() => {
    if (!town) return;
    setDraft(town);
    let cancelled = false;
    setState('loading');
    setReport(null);
    const month = lastCompleteMonth(today());
    (async () => {
      const [rows, archiveStart] = await Promise.all([fetchTownRows(supabase, town, month), fetchSalesCoverage(supabase)]);
      if (rows.sales.length === 0) throw new Error(`No sales came back for ${town}. Is it spelled as MLS spells it?`);
      const served = SITE.areaServed.find((t) => t.name === town);
      // Only the served towns are archived; anywhere else, sales start where
      // the live feed's do.
      const firstSale = rows.sales.map((s) => s.date).sort()[0];
      const firstLease = rows.leases.map((l) => l.date).sort()[0] ?? firstSale;
      const r = buildReport({
        town,
        slug: served?.slug ?? `${town.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ma`,
        state: 'MA',
        month,
        asOf: today(),
        trackingSince: TRACKING_SINCE,
        coverage: { sales: served && archiveStart ? archiveStart : firstSale, leases: firstLease },
        ...rows,
      });
      if (!cancelled) {
        setReport(r);
        setState('ready');
      }
    })().catch((err) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : String(err));
      setState('error');
    });
    return () => {
      cancelled = true;
    };
  }, [town]);

  const published = useMemo(() => marketIndex.towns.find((t) => t.town === report?.town), [report]);

  const copy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(clientText(report, Boolean(published)));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AdminShell
      title="Market reports"
      description="Any town's market as of today: sales over 12, 6 and 3 months, what is for sale, price ranges and rents."
    >
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const t = towns.find((x) => x.toLowerCase() === draft.trim().toLowerCase()) ?? draft.trim();
          if (t) setParams({ town: t });
        }}
      >
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-ink">Town</span>
          <input
            list="market-towns"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Watertown"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base"
          />
          <datalist id="market-towns">
            {towns.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <button type="submit" className={`${ADMIN_BUTTON} justify-center`}>
          Show the market
        </button>
      </form>

      <p className="mt-3 text-sm text-gray-600">
        The published reports:{' '}
        {marketIndex.towns.map((t, i) => (
          <span key={t.slug}>
            {i > 0 && ', '}
            <button type="button" className="underline decoration-champagne underline-offset-4" onClick={() => setParams({ town: t.town })}>
              {t.town}
            </button>
          </span>
        ))}
        .
      </p>

      {state === 'loading' && <p className="mt-10 text-gray-600">Reading {town}&rsquo;s sales and listings…</p>}
      {state === 'error' && <p className="mt-10 text-red-700">{error}</p>}

      {state === 'ready' && report && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-8">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
            <p className="text-sm text-gray-600">
              {report.town} as of today, through {monthName(report.month)}.{' '}
              {published ? (
                <>
                  Public page:{' '}
                  <Link to={`/market/${published.slug}`} className={LINK}>
                    /market/{published.slug}
                  </Link>
                </>
              ) : (
                'No public page for this town.'
              )}
            </p>
            <button type="button" onClick={copy} className={ADMIN_BUTTON}>
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? 'Copied' : 'Copy for a client'}
            </button>
          </div>
          <MarketAnalysis report={report} posts={published ? [...published.posts].reverse() : []} />
        </div>
      )}
    </AdminShell>
  );
};

export default AdminMarket;
