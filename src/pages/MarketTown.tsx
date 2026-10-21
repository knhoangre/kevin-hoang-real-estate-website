import { Link } from 'react-router-dom';
import PageShell, { ShellSection } from '@/components/PageShell';
import AuthorCard from '@/components/AuthorCard';
import MarketAnalysis from '@/components/market/MarketAnalysis';
import { LINK } from '@/components/market/MarketParts';
import type { MarketIndexTown, MarketReport } from '@/lib/market';
import { dateLong, monthName, townDescription, townTitle } from '@/lib/marketText';
import marketIndex from '@/data/market/index.json';

/**
 * /market/<slug> — one town's market, from its newest monthly report.
 *
 * Owns the PLACE-AND-NUMBERS axis: /neighborhoods/<slug> is what a town is
 * like, this is what its homes sell for. Every heading interpolates the town,
 * so sixteen of these never share an <h2> (the topical-distinctness rule).
 *
 * Renders entirely from the report it is handed — no fetch and no loading
 * branch, like PropertyDetail — so the prerendered HTML is the whole page.
 */
const MarketTown = ({ report: r, entry }: { report: MarketReport; entry: MarketIndexTown }) => {
  const town = r.town;
  const path = `/market/${r.slug}`;
  const others = marketIndex.towns.filter((t) => t.slug !== r.slug);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Market Reports', path: '/market' },
    { name: town, path },
  ];

  return (
    <PageShell
      path={path}
      crumbs={crumbs}
      seo={{ title: townTitle(r), description: townDescription(r) }}
      eyebrow={`Market report · ${monthName(r.month)}`}
      h1={`${town}, MA Housing Market`}
      lede={`Sales over the last 12, 6 and 3 months, what is for sale now, and what rents — from MLS data through ${dateLong(r.windows[0].to)}. Updated on the 3rd of every month.`}
      width="wide"
      cta={{
        heading: `Buying or selling in ${town}?`,
        body: 'These numbers describe a whole town. What they mean for one home, one street or one budget is a conversation, and the first one costs nothing.',
      }}
    >
      <ShellSection width="wide" className="py-16 md:py-20 bg-white">
        <MarketAnalysis report={r} posts={[...entry.posts].reverse()} />

        <aside className="mt-16 rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ink">More on {town}</h2>
          <ul className="mt-3 space-y-2 text-gray-700">
            <li>
              <Link to={`/neighborhoods/${r.slug}`} className={LINK}>
                The {town} town guide
              </Link>{' '}
              — what living there is like.
            </li>
            <li>
              <Link to="/home-valuation" className={LINK}>
                A written valuation of your home
              </Link>{' '}
              — what these numbers mean for one house.
            </li>
          </ul>
          <h2 className="mt-8 text-lg font-semibold text-ink">Market reports for other towns</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {others.map((t) => (
              <li key={t.slug}>
                <Link to={`/market/${t.slug}`} className={LINK}>
                  {t.town}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <AuthorCard className="mt-12" />
      </ShellSection>
    </PageShell>
  );
};

export default MarketTown;
