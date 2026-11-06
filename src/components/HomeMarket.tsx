import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SITE } from '@/lib/siteConfig';
import { pill } from '@/lib/pill';
import { money, monthName, months1, ratioPct } from '@/lib/marketText';
import type { Headline, MarketIndex } from '@/lib/market';
import MarketEmailSignup from '@/components/market/MarketEmailSignup';
import summaryJson from '@/data/market/summary.json';
import indexJson from '@/data/market/index.json';

const summary = summaryJson as Headline[];
const index = indexJson as MarketIndex;

/**
 * The homepage's window onto /market. Until 2026-11-06 the homepage body linked
 * to none of the market reports, which are the most original thing on the site
 * (an outside review said as much), so the front door said nothing a thousand
 * other agent sites do not.
 *
 * Read from the committed summary.json, like /market itself: prerendered with
 * no fetch, and it changes when the monthly reports do. Single-family only, the
 * figure buyers and sellers ask about first; /market carries condos.
 */
const TOWNS = ['Newton', 'Needham', 'Wellesley', 'Brookline'];

const postPath = (h: Headline) => {
  const town = index.towns.find((t) => t.slug === h.slug);
  return town?.posts.some((p) => p.month === h.month) ? `/market/${h.slug}/${h.month}` : `/market/${h.slug}`;
};

const HomeMarket = () => {
  const { t, i18n } = useTranslation();
  const rows = TOWNS.map((name) => summary.find((h) => h.town === name))
    .filter((h): h is Headline => Boolean(h))
    .map((h) => ({ h, sf: h.types.find((x) => x.type === 'SF') }))
    .filter((r): r is { h: Headline; sf: Headline['types'][number] } => Boolean(r.sf));
  if (rows.length === 0) return null;

  const month = rows[0].h.month;
  const [y, m] = month.split('-').map(Number);
  const monthLabel = i18n.language === 'vi' ? `tháng ${m} năm ${y}` : monthName(month);

  return (
    <section className="bg-bone py-20" aria-labelledby="home-market">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <span className="mx-auto mb-5 block h-px w-10 bg-champagne" aria-hidden />
          <h2 id="home-market" className="mb-4 font-sans text-3xl font-semibold tracking-widest text-ink md:text-4xl">
            {t('homeMarket.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600">{t('homeMarket.subtitle', { month: monthLabel })}</p>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map(({ h, sf }) => (
            <li key={h.slug}>
              <Link
                to={postPath(h)}
                className="group flex h-full flex-col rounded-xl border border-transparent bg-white p-6 shadow-sm transition-all duration-300 hover:border-champagne hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-ink"
              >
                <span className="text-xl font-semibold text-ink">{h.town}</span>
                <dl className="numeral mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">{t('homeMarket.median')}</dt>
                    <dd className="text-2xl font-bold text-ink">{money(sf.median)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-gray-100 pt-3">
                    <dt className="text-gray-500">{t('homeMarket.ratio', { n: sf.window ?? 12 })}</dt>
                    <dd className="font-semibold text-ink">{ratioPct(sf.ratio)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">{t('homeMarket.supply')}</dt>
                    <dd className="font-semibold text-ink">{months1(sf.monthsSupply)}</dd>
                  </div>
                </dl>
                {sf.edge && (
                  <p className="mt-4 text-sm font-medium text-champagne-ink">{t(`homeMarket.edge.${sf.edge}`)}</p>
                )}
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-ink">
                  {t('homeMarket.read', { town: h.town })}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Link to="/market" className={pill('ink', 'md', 'group')}>
            {t('homeMarket.all', { n: summary.length })}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        <MarketEmailSignup className="mx-auto mt-12 max-w-3xl" />

        {/* The short form of MarketSources' attribution, which names MLS PIN
            and says who did the arithmetic, on every page that shows a figure. */}
        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-gray-500">
          {t('homeMarket.source', { agent: SITE.agentName, brokerage: SITE.brokerage })}
        </p>
      </div>
    </section>
  );
};

export default HomeMarket;
