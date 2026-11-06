import { Link } from 'react-router-dom';
import PageShell, { ShellSection } from '@/components/PageShell';
import AuthorCard from '@/components/AuthorCard';
import MarketEmailSignup from '@/components/market/MarketEmailSignup';
import { H2, LINK } from '@/components/market/MarketParts';
import MarketGlance, { type GlanceWords } from '@/components/market/MarketGlance';
import { MIN_MONTH_SALES, TYPE_NAMES, type Headline, type MarketIndex, type SaleType } from '@/lib/market';
import { EDGE_LABEL, EDGE_RULE_TEXT, dateLong, monthName } from '@/lib/marketText';
import { itemList } from '@/lib/schema';
import { SITE, telHref } from '@/lib/siteConfig';
import summaryJson from '@/data/market/summary.json';
import indexJson from '@/data/market/index.json';

const summary = summaryJson as Headline[];
const index = indexJson as MarketIndex;

/**
 * Towns Kevin works in that have no report: Dover (Kevin's choice, 2026-10-20).
 * Without this the page said "Towns covered 17" in its strip and "16 towns at a
 * glance" under it, and said nothing about the difference.
 */
const unreported = SITE.areaServed.filter((t) => !SITE.marketTowns.includes(t.name));

const listOf = (names: string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/**
 * /market — every town's report side by side, and every monthly post.
 *
 * Reads summary.json, the headline figures the sync writes beside the reports,
 * rather than sixteen full reports: this page compares towns, and a comparison
 * needs a line per town, not a page.
 */
/** The English words for the table /vi/thi-truong and /zh/shichang share. */
const GLANCE: GlanceWords = {
  head: ['Town', 'Median price, 12 months', 'Sale-to-asking', 'Sold over asking', 'For sale now', 'Months of supply', 'Who has the edge'],
  edge: EDGE_LABEL,
  caption: 'Markets by town',
};

const TypeTable = ({ type }: { type: SaleType }) => (
  <MarketGlance
    type={type}
    heading={TYPE_NAMES[type].short}
    words={{ ...GLANCE, caption: `${TYPE_NAMES[type].short} markets by town` }}
    town={(h) => (
      <Link key={h.slug} to={`/market/${h.slug}`} className={LINK}>
        {h.town}
      </Link>
    )}
  />
);

const Market = () => {
  const latest = summary.reduce((m, h) => (h.month > m ? h.month : m), '');
  const asOf = summary.reduce((m, h) => (h.asOf > m ? h.asOf : m), '');
  const months = [...new Set(index.towns.flatMap((t) => t.posts.map((p) => p.month)))].sort().reverse();
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Market Reports', path: '/market' },
  ];

  return (
    <PageShell
      path="/market"
      crumbs={crumbs}
      seo={{
        title: 'Greater Boston Housing Market Reports by Town',
        description: `Home prices, sale-to-asking, inventory and rents for ${summary.length} towns around Newton, from MLS data, updated on the 3rd of every month.`,
      }}
      jsonLd={itemList(summary.map((h) => ({ name: `${h.town}, MA housing market`, url: `/market/${h.slug}` })))}
      eyebrow="Market reports"
      h1="Greater Boston Housing Market Reports"
      lede={`What homes sold for, against what they asked, and how much is for sale — town by town, from MLS data. Updated on the 3rd of every month${latest ? `; the latest covers ${monthName(latest)}` : ''}.`}
      width="wide"
      cta={{
        heading: 'Want these numbers for your street?',
        body: 'A town-wide median is a starting point. For one home, the comparable sales are what matter, and they are what a written valuation is built on.',
        button: 'Ask about your home',
        contact: { to: '/home-valuation#request', phone: SITE.phone, tel: telHref, email: SITE.email },
      }}
    >
      <ShellSection width="wide" className="py-16 md:py-20 bg-white">
        <section aria-labelledby="glance" className="space-y-6">
          <H2 id="glance">{summary.length} towns at a glance</H2>
          <p className="max-w-3xl leading-relaxed text-gray-700">
            Sale-to-asking and the share sold over asking are over the last three months where those hold at least
            ten sales, and over six or twelve months where they do not. Homes for sale are as of {dateLong(asOf)}.
          </p>
          {unreported.length > 0 && (
            <p className="max-w-3xl leading-relaxed text-gray-700">
              Kevin works in {SITE.areaServed.length} towns. {listOf(unreported.map((t) => t.name))}{' '}
              {unreported.length === 1 ? 'has' : 'have'} too few closings in a month for a report to say much, so{' '}
              {unreported.length === 1 ? 'it is' : 'they are'} left out here; see the{' '}
              {unreported.map((t, i) => (
                <span key={t.slug}>
                  {i > 0 && ', '}
                  <Link to={`/neighborhoods/${t.slug}`} className={LINK}>
                    {t.name} town guide
                  </Link>
                </span>
              ))}{' '}
              instead.
            </p>
          )}
          <TypeTable type="SF" />
          <TypeTable type="CC" />
          <p className="max-w-3xl text-xs leading-relaxed text-gray-500">{EDGE_RULE_TEXT}</p>
        </section>

        <MarketEmailSignup className="mt-16 max-w-3xl" />

        {months.length > 0 && (
          <section aria-labelledby="posts" className="mt-20 space-y-8">
            <H2 id="posts">Monthly market reports by town</H2>
            <p className="max-w-3xl leading-relaxed text-gray-700">
              One post per town per month, for every month with at least {MIN_MONTH_SALES} closings. Each is
              published once and not revised, so it reads as a record of that month.
            </p>
            {months.map((m) => (
              <div key={m}>
                <h3 className="mb-3 text-lg font-semibold text-ink">{monthName(m)}</h3>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                  {index.towns
                    .filter((t) => t.posts.some((p) => p.month === m))
                    .map((t) => (
                      <li key={t.slug}>
                        <Link to={`/market/${t.slug}/${m}`} className={LINK}>
                          {t.town}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        <section aria-labelledby="how" className="mt-20 max-w-3xl space-y-4 leading-relaxed text-gray-700">
          <H2 id="how">How these market reports are made</H2>
          <p>
            Every figure is calculated from MLS Property Information Network (MLS PIN) data: closed sales, homes under
            agreement, homes for sale and signed leases. Sales are counted in whole calendar months, single-family
            homes, condos and multi-families are kept apart, and a median is shown only where at least five sales stand
            behind it. Each town&rsquo;s page explains every measure under &ldquo;How the numbers are
            calculated&rdquo;.
          </p>
          <p>
            The reports describe towns, not houses. For what one home would sell for, the comparable sales are what
            matter —{' '}
            <Link to="/home-valuation" className={LINK}>
              ask for a written valuation
            </Link>
            .
          </p>
        </section>

        <AuthorCard className="mt-12" />
      </ShellSection>
    </PageShell>
  );
};

export default Market;
