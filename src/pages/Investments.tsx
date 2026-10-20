/**
 * /investments — homes for sale, run as investments. For signed-in accounts.
 *
 *   /investments            one town's listings, ranked by cash flow, by asking
 *                           price against the assessment, or by land value
 *   /investments?mls=<n>    one home: what we know about it, and the numbers
 *                           as a rental
 *
 * A QUERY PARAMETER, NOT A PATH, for the one home: /investments/<mls> would
 * need a third rewrite in vercel.json, and CLAUDE.md asks a dynamic segment to
 * earn one. The listing page links here ("Run this as an investment").
 *
 * SIGNED-IN ONLY, by Kevin's choice (2026-10-19): the listing data is the same
 * public IDX data /search shows, so this is a reason to make an account, not a
 * lock on anything private. A signed-out visitor gets a sign-in panel, and
 * authReturn brings them back here — ?mls= included — afterwards.
 *
 * THE FIRST RENDER IS CONSTANT. The page is prerendered once, with no session
 * and no query string, and that document is what the browser hydrates for every
 * /investments URL. So: the hero is fixed, the body is the spinner while auth
 * loads (which is also the prerendered HTML), and the query string is read only
 * once useHydrated() flips. Nothing is fetched before then.
 *
 * Everything that decides a number is in pure, checked modules —
 * investment.ts, rentComps.ts, parcels.ts — see scripts/investment-check.ts.
 */
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageShell, { ShellSection } from '@/components/PageShell';
import IdxDisclosure from '@/components/IdxDisclosure';
import DealView from '@/components/investments/DealView';
import InvestmentDisclaimer from '@/components/investments/InvestmentDisclaimer';
import ScreenerView from '@/components/investments/ScreenerView';
import { BUTTON, Panel, Spinner } from '@/components/investments/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useHydrated } from '@/hooks/useHydrated';
import { useViewScroll } from '@/hooks/useViewScroll';
import { rememberReturnPath } from '@/lib/authReturn';

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Investments', path: '/investments' },
];

const NO_PARAMS = new URLSearchParams();

const Investments = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = hydrated ? searchParams : NO_PARAMS;
  const mlsParam = params.get('mls');
  const mls = mlsParam && /^\d{6,}$/.test(mlsParam) ? mlsParam : null;
  const ready = hydrated && Boolean(user);

  useViewScroll(mls ?? 'screener');

  const signIn = () => {
    rememberReturnPath();
    navigate('/auth');
  };

  const body = () => {
    if (authLoading || !hydrated) return <Spinner />;

    if (!user) {
      return (
        <Panel>
          <h2 className="text-xl font-semibold uppercase tracking-wide text-ink">Sign in to run the numbers</h2>
          <p className="mt-3 max-w-2xl">
            Investment analysis is for account holders. Every home for sale, ranked by what it would earn rented out,
            by its price against the town&rsquo;s assessment, or by what its land is worth — and any one of them run
            as a rental, with rents from what similar homes in town actually leased for. An account is free.
          </p>
          <button type="button" onClick={signIn} className={`mt-6 ${BUTTON}`}>
            Sign in or create an account
          </button>
        </Panel>
      );
    }

    return (
      <>
        {mls ? (
          <DealView mls={mls} enabled={ready} />
        ) : (
          <ScreenerView params={params} setParams={setSearchParams} enabled={ready} />
        )}
        <InvestmentDisclaimer />
        <IdxDisclosure className="mt-8" />
      </>
    );
  };

  return (
    <PageShell
      path="/investments"
      seo={{
        title: 'Investment Analysis',
        description: 'Homes for sale, run as investments.',
        noindex: true,
      }}
      crumbs={CRUMBS}
      eyebrow="For investors"
      hero={{
        // The /search hero, sized the same, so it is already in cache.
        image:
          'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&w=1600&q=65',
        alt: '',
      }}
      h1="Investments"
      lede="What a home would earn rented out, what it is assessed at, and what its land is worth — from leases actually signed and the town's own records."
      heroSize="compact"
      width="wide"
      strip={false}
      actions={false}
      cta={false}
    >
      <ShellSection width="wide" inner="">
        {body()}
      </ShellSection>
    </PageShell>
  );
};

export default Investments;
