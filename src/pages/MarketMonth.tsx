import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import AuthorCard from '@/components/AuthorCard';
import { ColumnChart, type ChartPoint } from '@/components/market/MarketCharts';
import { DataTable, H2, InventoryTable, LINK, MarketSources, RentTable, Thin } from '@/components/market/MarketParts';
import {
  SALE_TYPES,
  TYPE_NAMES,
  activeTypes,
  type MarketIndexTown,
  type MarketReport,
  type SaleType,
  type Stats,
} from '@/lib/market';
import {
  buyerTakeaways,
  change,
  dateLong,
  dollars,
  lastPoint,
  money,
  monthChanges,
  monthDescription,
  monthName,
  monthOnly,
  monthShort,
  monthSummary,
  monthTitle,
  months1,
  nextMonthName,
  pct,
  previousPoint,
  ratioPct,
  sellerTakeaways,
  windowSpan,
} from '@/lib/marketText';
import { agentIdentity, blogPosting, person } from '@/lib/schema';
import { SITE } from '@/lib/siteConfig';
import marketIndex from '@/data/market/index.json';

/**
 * /market/<slug>/<yyyy-mm> — one town, one month: the monthly post.
 *
 * Its subject is the MONTH, which is what keeps it from being the town page
 * again: what closed, against the month before and the twelve-month figures,
 * and what is on the market going into the next one. The full analysis — price
 * ranges, bedrooms, ZIP codes — is one link away on /market/<slug> and is not
 * repeated here.
 *
 * Published only for a month with MIN_MONTH_SALES closings (monthWorthAPost):
 * a post about four sales is the thin, templated page this site was once
 * cleaned of. The report is frozen when it is written, so this page reads the
 * same next year as it does today.
 */
const cell = (s: string) => (s === '—' ? <Thin /> : s);

const compareRows = (cols: (Stats | null)[]) => {
  const col = (f: (s: Stats) => string) => cols.map((s, i) => (s ? cell(f(s)) : <Thin key={i} />));
  return [
    ['Homes sold', ...col((s) => s.sales.toLocaleString('en-US'))],
    ['Median price', ...col((s) => money(s.median))],
    ['Median per sq ft', ...col((s) => dollars(s.ppsf))],
    ['Median sale-to-asking', ...col((s) => ratioPct(s.ratio))],
    ['Sold over asking', ...col((s) => pct(s.over))],
    ['Typical amount over asking', ...col((s) => money(s.premium))],
  ];
};

const Tile = ({ type, now, before, beforeLabel }: { type: SaleType; now: Stats; before: Stats | null; beforeLabel: string }) => {
  const vs = change(now.median, before?.median ?? null);
  return (
    <div className="rounded-2xl border border-gray-200 bg-bone p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-ink">{TYPE_NAMES[type].short}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{now.sales} sold</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">Median price</dt>
          <dd className="text-right font-semibold tabular-nums text-ink">
            {now.median !== null ? money(now.median) : <Thin />}
            {vs && (
              <span className="block text-xs font-normal text-gray-500">
                {vs} on {beforeLabel}
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">Sale-to-asking</dt>
          <dd className="font-semibold tabular-nums text-ink">{now.ratio !== null ? ratioPct(now.ratio) : <Thin />}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-600">Over asking</dt>
          <dd className="font-semibold tabular-nums text-ink">{now.over !== null ? pct(now.over) : <Thin />}</dd>
        </div>
      </dl>
    </div>
  );
};

const MarketMonth = ({ report: r, entry }: { report: MarketReport; entry: MarketIndexTown }) => {
  const town = r.town;
  const path = `/market/${r.slug}/${r.month}`;
  const month = monthName(r.month);
  const p = lastPoint(r);
  const prev = previousPoint(r);
  const types = activeTypes(r);
  const shown = types.filter((t) => p.byType[t].sales > 0);
  const published = entry.posts.find((x) => x.month === r.month)?.published ?? r.asOf;
  const i = entry.posts.findIndex((x) => x.month === r.month);
  const older = i > 0 ? entry.posts[i - 1] : null;
  const newer = i >= 0 && i < entry.posts.length - 1 ? entry.posts[i + 1] : null;
  const sameMonth = marketIndex.towns.filter((t) => t.slug !== r.slug && t.posts.some((x) => x.month === r.month));
  const three = r.windows.find((w) => w.months === 3);
  const twelve = r.windows[0];
  const ya = r.yearAgo.month;

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Market Reports', path: '/market' },
    { name: town, path: `/market/${r.slug}` },
    { name: month, path },
  ];
  const title = monthTitle(r);
  const description = monthDescription(r);

  const points: ChartPoint[] = r.series.map((pt, n) => ({
    label: monthName(pt.month),
    short: monthShort(pt.month),
    value: pt.all.sales,
    detail: SALE_TYPES.filter((t) => pt.byType[t].sales > 0).map(
      (t) => `${pt.byType[t].sales} ${pt.byType[t].sales === 1 ? TYPE_NAMES[t].one : TYPE_NAMES[t].many}`
    ),
    highlight: n === r.series.length - 1,
  }));

  const heads = [
    '',
    month,
    prev ? monthName(prev.month) : 'Month before',
    three ? `3 months` : null,
    '12 months',
    ya ? monthName(ya.month) : null,
  ].filter((h): h is string => h !== null);

  const buying = buyerTakeaways(r).slice(0, 2);
  const selling = sellerTakeaways(r).slice(0, 2);

  return (
    <PageShell
      path={path}
      crumbs={crumbs}
      seo={{
        title,
        description,
        ogType: 'article',
        article: { publishedTime: published, author: SITE.agentName },
      }}
      jsonLd={[
        person(),
        agentIdentity(),
        blogPosting({
          title,
          slug: `${r.slug}-${r.month}`,
          path,
          description,
          datePublished: published,
          author: SITE.agentName,
        }),
      ]}
      eyebrow="Monthly market report"
      h1={title}
      lede={`What sold in ${town} in ${month}, what it sold for, and what is on the market going into ${nextMonthName(r.month)}.`}
      cta={{
        heading: `Thinking about a move in ${town}?`,
        body: 'A month of sales is a snapshot of a whole town. What it means for one home or one budget is a conversation, and the first one costs nothing.',
      }}
    >
      <ShellSection className="py-16 md:py-20 bg-white">
        <article>
          <p className="text-sm text-gray-500">
            By{' '}
            <Link to="/about" className={LINK}>
              {SITE.agentName}
            </Link>{' '}
            · Published {dateLong(published)} · Sales through {dateLong(twelve.to)}
          </p>

          <p className="mt-6 text-lg leading-relaxed text-gray-800">{monthSummary(r)}</p>

          <section aria-labelledby="numbers" className="mt-14 space-y-6">
            <H2 id="numbers">
              {town} in {month}: the numbers
            </H2>
            <div className={`grid gap-4 ${shown.length > 2 ? 'sm:grid-cols-3' : shown.length === 2 ? 'sm:grid-cols-2' : ''}`}>
              {shown.map((t) => (
                <Tile
                  key={t}
                  type={t}
                  now={p.byType[t]}
                  before={prev?.byType[t] ?? null}
                  beforeLabel={prev ? monthOnly(prev.month) : ''}
                />
              ))}
            </div>
            <div>
              <h3 className="mb-4 text-base font-semibold text-ink">Homes sold each month in {town}, all types</h3>
              <ColumnChart
                points={points}
                format={(n) => String(Math.round(n))}
                ariaLabel={`Homes sold in ${town} each month: ${r.series.map((pt) => `${monthShort(pt.month)} ${pt.all.sales}`).join(', ')}.`}
              />
            </div>
          </section>

          <section aria-labelledby="compared" className="mt-16 space-y-6">
            <H2 id="compared">
              How {monthOnly(r.month)} compared in {town}
            </H2>
            <p className="leading-relaxed text-gray-700">
              {month} beside the month before, the last three months ({three ? windowSpan(three) : ''}) and the last
              twelve ({windowSpan(twelve)})
              {ya ? `, and the same month a year earlier` : ''}. One month&rsquo;s median moves with which homes
              happened to close — a few large houses one month, smaller ones the next — so the three- and twelve-month
              columns are the steadier read.
            </p>
            {types.map((t) => (
              <div key={t}>
                <h3 className="mb-3 text-lg font-semibold text-ink">{TYPE_NAMES[t].short}</h3>
                <DataTable
                  minWidth="min-w-[34rem]"
                  head={heads}
                  rows={compareRows([
                    p.byType[t],
                    prev?.byType[t] ?? null,
                    ...(three ? [three.byType[t]] : []),
                    twelve.byType[t],
                    ...(ya ? [ya.byType[t]] : []),
                  ])}
                />
              </div>
            ))}
            {prev && monthChanges(r).length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-ink">What changed since {monthOnly(prev.month)}</h3>
                <ul className="list-disc space-y-2 pl-5 leading-relaxed text-gray-700 marker:text-champagne">
                  {monthChanges(r).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section aria-labelledby="inventory" className="mt-16 space-y-6">
            <H2 id="inventory">
              {town} going into {nextMonthName(r.month)}: homes for sale
            </H2>
            <p className="leading-relaxed text-gray-700">
              On {dateLong(r.asOf)}, {r.inventory.all.available} homes were for sale in {town} and{' '}
              {r.inventory.all.pending} were under agreement
              {r.inventory.all.monthsSupply !== null &&
                ` — about ${months1(r.inventory.all.monthsSupply)} months of supply at the past year's pace`}
              .
            </p>
            <InventoryTable report={r} types={types} />
          </section>

          {r.rentals.month.n >= 5 && (
            <section aria-labelledby="rents" className="mt-16 space-y-6">
              <H2 id="rents">
                Rents signed in {town} in {month}
              </H2>
              <p className="leading-relaxed text-gray-700">
                {r.rentals.month.n} leases were recorded in {month}. The median monthly rent by bedrooms, beside the
                last twelve months:
              </p>
              <RentTable windows={[r.rentals.month, r.rentals.windows[0]]} labels={[month, '12 months']} />
            </section>
          )}

          {buying.length + selling.length > 0 && (
            <section aria-labelledby="means" className="mt-16 space-y-6">
              <H2 id="means">
                What {monthOnly(r.month)} means for {town} buyers and sellers
              </H2>
              {[
                { heading: 'If you are buying', lines: buying },
                { heading: 'If you are selling', lines: selling },
              ]
                .filter((g) => g.lines.length > 0)
                .map((g) => (
                  <div key={g.heading}>
                    <h3 className="mb-3 text-lg font-semibold text-ink">{g.heading}</h3>
                    <ul className="list-disc space-y-3 pl-5 leading-relaxed text-gray-700 marker:text-champagne">
                      {g.lines.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </section>
          )}

          <Link
            to={`/market/${r.slug}`}
            className="group mt-14 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-bone p-6 transition-colors hover:border-champagne"
          >
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-champagne-ink">The full picture</span>
              <span className="mt-1 block text-lg font-semibold text-ink">
                The {town} housing market over 12, 6 and 3 months — by price range, bedrooms and ZIP code
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-ink transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>

          {(older || newer) && (
            <nav aria-label={`Other ${town} monthly reports`} className="mt-8 flex flex-wrap justify-between gap-4 text-sm">
              {older ? (
                <Link to={`/market/${r.slug}/${older.month}`} className={`inline-flex items-center gap-2 ${LINK}`}>
                  <ArrowLeft className="h-4 w-4" aria-hidden /> {town}, {monthName(older.month)}
                </Link>
              ) : (
                <span />
              )}
              {newer && (
                <Link to={`/market/${r.slug}/${newer.month}`} className={`inline-flex items-center gap-2 ${LINK}`}>
                  {town}, {monthName(newer.month)} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </nav>
          )}

          {sameMonth.length > 0 && (
            <section aria-labelledby="elsewhere" className="mt-14 space-y-3">
              <h2 id="elsewhere" className="text-lg font-semibold text-ink">
                {month} in other towns
              </h2>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {sameMonth.map((t) => (
                  <li key={t.slug}>
                    <Link to={`/market/${t.slug}/${r.month}`} className={LINK}>
                      {t.town}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="sources" className="mt-14 space-y-4">
            <h2 id="sources" className="text-lg font-semibold text-ink">
              Sources for the {town} {month} report
            </h2>
            <MarketSources report={r} />
          </section>

          <AuthorCard className="mt-12" />
        </article>
      </ShellSection>
    </PageShell>
  );
};

export default MarketMonth;
