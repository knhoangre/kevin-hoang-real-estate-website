import { Link } from 'react-router-dom';
import { ColumnChart, ShareLine, type ChartPoint } from '@/components/market/MarketCharts';
import {
  DataTable,
  EdgeCards,
  H2,
  InventoryTable,
  LINK,
  MarketSources,
  RentTable,
  Thin,
} from '@/components/market/MarketParts';
import {
  SALE_TYPES,
  TYPE_NAMES,
  activeTypes,
  type MarketReport,
  type SaleType,
  type Stats,
} from '@/lib/market';
import {
  buyerTakeaways,
  compactMoney,
  dateLong,
  dollars,
  mainType,
  money,
  monthName,
  monthShort,
  months1,
  pct,
  ratioPct,
  sellerTakeaways,
  townSummary,
  windowSpan,
} from '@/lib/marketText';
import { pill } from '@/lib/pill';

/**
 * One town's market, every section of it: the body of /market/<slug>, and of
 * /admin/market, which builds the same report live for any town in the feed.
 * One component so the page Kevin reads and the page a client reads cannot
 * say different things about the same numbers.
 *
 * `posts` links the town's monthly reports, where it has any; the admin view
 * of a town with none passes nothing.
 */
const cell = (s: string) => (s === '—' ? <Thin /> : s);

const windowRows = (r: MarketReport, t: SaleType) => {
  const ws = r.windows;
  const col = (f: (s: Stats) => string) => ws.map((w) => cell(f(w.byType[t])));
  return [
    ['Homes sold', ...ws.map((w) => w.byType[t].sales.toLocaleString('en-US'))],
    ['Sold per month', ...ws.map((w) => w.byType[t].perMonth.toFixed(1))],
    ['Median price', ...col((s) => money(s.median))],
    ['Middle half of prices', ...col((s) => (s.low !== null && s.high !== null ? `${compactMoney(s.low)}–${compactMoney(s.high)}` : '—'))],
    ['Median price per sq ft', ...col((s) => dollars(s.ppsf))],
    ['Median sale-to-asking', ...col((s) => ratioPct(s.ratio))],
    ['Sold over asking', ...col((s) => pct(s.over))],
    ['Sold under asking', ...col((s) => pct(s.under))],
    ['Typical amount over asking', ...col((s) => money(s.premium))],
    ['Median size (sq ft)', ...col((s) => (s.sqft !== null ? Math.round(s.sqft).toLocaleString('en-US') : '—'))],
  ];
};

const WindowHead = ({ months, span }: { months: number; span: string }) => (
  <>
    {months} months
    <span className="block font-normal normal-case tracking-normal text-gray-400">{span}</span>
  </>
);

const typeCounts = (byType: Record<SaleType, Stats>) =>
  SALE_TYPES.filter((t) => byType[t].sales > 0).map(
    (t) => `${byType[t].sales} ${byType[t].sales === 1 ? TYPE_NAMES[t].one : TYPE_NAMES[t].many}`
  );

export const MarketAnalysis = ({
  report: r,
  posts = [],
}: {
  report: MarketReport;
  posts?: { month: string }[];
}) => {
  const town = r.town;
  const path = `/market/${r.slug}`;
  const types = activeTypes(r);
  const lead = mainType(r);
  const hasYearAgo = r.yearAgo.windows.some(Boolean);

  const salesPoints: ChartPoint[] = r.series.map((p, i) => ({
    label: monthName(p.month),
    short: monthShort(p.month),
    value: p.all.sales,
    detail: typeCounts(p.byType),
    highlight: i === r.series.length - 1,
  }));

  const overPoints: ChartPoint[] | null = lead
    ? r.series.map((p, i) => ({
        label: monthName(p.month),
        short: monthShort(p.month),
        value: p.byType[lead].over,
        detail: [`${p.byType[lead].sales} ${TYPE_NAMES[lead].many} sold`],
        highlight: i === r.series.length - 1,
      }))
    : null;

  return (
    <>
      <section aria-labelledby="edge" className="space-y-6">
        <H2 id="edge">Is it a buyer&rsquo;s or a seller&rsquo;s market in {town}?</H2>
        <p className="max-w-3xl text-lg leading-relaxed text-gray-700">{townSummary(r)}</p>
        {types.length > 0 && <EdgeCards report={r} types={types} />}
        <p className="text-xs text-gray-500">
          How we call it: see <a href="#method" className={LINK}>how these numbers are calculated</a>.
        </p>
      </section>

      <section aria-labelledby="windows" className="mt-20 space-y-8">
        <div className="space-y-3">
          <H2 id="windows">{town} home prices over 12, 6 and 3 months</H2>
          <p className="max-w-3xl leading-relaxed text-gray-700">
            The same measures over three spans, each ending with {monthName(r.month)}. Read them as a set: the
            three months hold fewer sales and a single season, and the season changes which homes sell, so a gap
            between the columns is partly the calendar.
            {!hasYearAgo &&
              ' Comparisons with the same months a year earlier appear here as the sales archive behind these reports reaches back far enough.'}
          </p>
        </div>
        {types.map((t) => (
          <div key={t}>
            <h3 className="mb-3 text-lg font-semibold text-ink">{TYPE_NAMES[t].short}</h3>
            <DataTable
              caption={`${TYPE_NAMES[t].short} sales in ${town} over 12, 6 and 3 months`}
              head={['', ...r.windows.map((w) => <WindowHead key={w.months} months={w.months} span={windowSpan(w)} />)]}
              rows={windowRows(r, t)}
            />
          </div>
        ))}
        {hasYearAgo && lead && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-ink">Against the same months a year earlier</h3>
            <DataTable
              head={['', ...r.windows.map((w) => `${w.months} months`)]}
              rows={[
                [
                  `${TYPE_NAMES[lead].short}: median price`,
                  ...r.windows.map((w, i) => {
                    const ya = r.yearAgo.windows[i];
                    return ya ? `${money(w.byType[lead].median)} vs ${money(ya.byType[lead].median)}` : <Thin key={i} />;
                  }),
                ],
                [
                  `${TYPE_NAMES[lead].short}: sold over asking`,
                  ...r.windows.map((w, i) => {
                    const ya = r.yearAgo.windows[i];
                    return ya ? `${pct(w.byType[lead].over)} vs ${pct(ya.byType[lead].over)}` : <Thin key={i} />;
                  }),
                ],
                [
                  `${TYPE_NAMES[lead].short}: homes sold`,
                  ...r.windows.map((w, i) => {
                    const ya = r.yearAgo.windows[i];
                    return ya ? `${w.byType[lead].sales} vs ${ya.byType[lead].sales}` : <Thin key={i} />;
                  }),
                ],
              ]}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="monthly" className="mt-20 space-y-8">
        <H2 id="monthly">{town} sales month by month</H2>
        <div>
          <h3 className="mb-4 text-base font-semibold text-ink">Homes sold each month, all types</h3>
          <ColumnChart
            points={salesPoints}
            format={(n) => String(Math.round(n))}
            ariaLabel={`Homes sold in ${town} each month from ${monthName(r.series[0].month)} to ${monthName(r.month)}: ${r.series.map((p) => `${monthShort(p.month)} ${p.all.sales}`).join(', ')}.`}
          />
        </div>
        {overPoints && lead && (
          <div>
            <h3 className="mb-4 text-base font-semibold text-ink">Share of {TYPE_NAMES[lead].many} sold over asking</h3>
            <ShareLine
              points={overPoints}
              ariaLabel={`Share of ${TYPE_NAMES[lead].many} in ${town} sold over asking, by month: ${r.series.map((p) => `${monthShort(p.month)} ${pct(p.byType[lead].over)}`).join(', ')}.`}
            />
            <p className="mt-3 text-xs text-gray-500">A gap is a month with fewer than five sales.</p>
          </div>
        )}
        <details className="group rounded-xl border border-gray-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">The numbers behind the charts</summary>
          <div className="mt-4">
            <DataTable
              minWidth="min-w-[36rem]"
              head={[
                'Month',
                'Sold',
                ...types.flatMap((t) => [`${TYPE_NAMES[t].short} median`]),
                ...(lead ? [`${TYPE_NAMES[lead].short} over asking`] : []),
              ]}
              rows={[...r.series].reverse().map((p) => [
                monthName(p.month),
                String(p.all.sales),
                ...types.map((t) => cell(money(p.byType[t].median))),
                ...(lead ? [cell(pct(p.byType[lead].over))] : []),
              ])}
            />
          </div>
        </details>
      </section>

      <section aria-labelledby="inventory" className="mt-20 space-y-6">
        <H2 id="inventory">What is for sale in {town} now</H2>
        <p className="max-w-3xl leading-relaxed text-gray-700">
          On {dateLong(r.asOf)}, {r.inventory.all.available} homes were for sale in {town} and{' '}
          {r.inventory.all.pending} were under agreement
          {r.inventory.all.monthsSupply !== null &&
            ` — about ${months1(r.inventory.all.monthsSupply)} months of supply at the pace homes sold over the past year`}
          .
        </p>
        <InventoryTable report={r} types={types} />
        <p>
          <Link to={`/search?town=${encodeURIComponent(town)}`} className={LINK}>
            See the homes for sale in {town}
          </Link>
        </p>
      </section>

      {r.bands.length > 1 && (
        <section aria-labelledby="bands" className="mt-20 space-y-6">
          <H2 id="bands">{town} by price range</H2>
          <p className="max-w-3xl leading-relaxed text-gray-700">
            Every type of home together, by what it sold for (or asks), over the last twelve months. A buyer shops
            by budget first, and competition is rarely the same across a town&rsquo;s price ranges.
          </p>
          <DataTable
            minWidth="min-w-[40rem]"
            caption={`${town} sales and listings by price range`}
            head={['Price range', 'Sold', 'Sale-to-asking', 'Over asking', 'For sale', 'Under agreement', 'Months of supply']}
            rows={r.bands.map((b) => [
              b.label,
              String(b.sales),
              cell(ratioPct(b.ratio)),
              cell(pct(b.over)),
              String(b.available),
              String(b.pending),
              cell(months1(b.monthsSupply)),
            ])}
          />
        </section>
      )}

      {(r.beds.SF.length > 0 || r.beds.CC.length > 0) && (
        <section aria-labelledby="beds" className="mt-20 space-y-6">
          <H2 id="beds">What a home costs in {town}, by bedrooms</H2>
          <div className="grid gap-10 lg:grid-cols-2">
            {(['SF', 'CC'] as const)
              .filter((t) => r.beds[t].length > 0 && types.includes(t))
              .map((t) => (
                <div key={t} className="min-w-0">
                  <h3 className="mb-3 text-lg font-semibold text-ink">{TYPE_NAMES[t].short}, last twelve months</h3>
                  <DataTable
                    minWidth="min-w-[24rem]"
                    head={['Bedrooms', 'Sold', 'Median', 'Per sq ft', 'Size']}
                    rows={r.beds[t].map((b) => [
                      b.label,
                      String(b.sales),
                      cell(compactMoney(b.median)),
                      cell(dollars(b.ppsf)),
                      cell(b.sqft !== null ? Math.round(b.sqft).toLocaleString('en-US') : '—'),
                    ])}
                  />
                </div>
              ))}
          </div>
        </section>
      )}

      {(r.zips.SF.length > 0 || r.zips.CC.length > 0) && (
        <section aria-labelledby="zips" className="mt-20 space-y-6">
          <H2 id="zips">{town} by ZIP code</H2>
          <p className="max-w-3xl leading-relaxed text-gray-700">
            ZIP codes with at least five sales in the last twelve months.
          </p>
          <div className="grid gap-10 lg:grid-cols-2">
            {(['SF', 'CC'] as const)
              .filter((t) => r.zips[t].length > 0)
              .map((t) => (
                <div key={t} className="min-w-0">
                  <h3 className="mb-3 text-lg font-semibold text-ink">{TYPE_NAMES[t].short}</h3>
                  <DataTable
                    minWidth="min-w-[24rem]"
                    head={['ZIP', 'Sold', 'Median', 'Per sq ft', 'Sale-to-asking']}
                    rows={r.zips[t].map((z) => [
                      z.label,
                      String(z.sales),
                      cell(compactMoney(z.median)),
                      cell(dollars(z.ppsf)),
                      cell(ratioPct(z.ratio)),
                    ])}
                  />
                </div>
              ))}
          </div>
        </section>
      )}

      {r.rentals.windows[0].n >= 5 && (
        <section aria-labelledby="rents" className="mt-20 space-y-6">
          <H2 id="rents">Rents in {town}</H2>
          <p className="max-w-3xl leading-relaxed text-gray-700">
            Median monthly rent on leases signed, by bedrooms, and what rentals on the market are asking now.
          </p>
          <RentTable
            windows={[...r.rentals.windows, r.rentals.asking]}
            labels={[...r.rentals.windows.map((w) => `${w.months} months`), 'Asking now']}
          />
        </section>
      )}

      <section aria-labelledby="buying" className="mt-20 grid gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          <H2 id="buying">Buying in {town}: what the numbers say</H2>
          <ul className="space-y-4 text-gray-700 leading-relaxed marker:text-champagne list-disc pl-5">
            {buyerTakeaways(r).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <H2 id="selling">Selling in {town}: what the numbers say</H2>
          <ul className="space-y-4 text-gray-700 leading-relaxed marker:text-champagne list-disc pl-5">
            {sellerTakeaways(r).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {posts.length > 0 && (
        <section aria-labelledby="posts" className="mt-20 space-y-4">
          <H2 id="posts">{town} monthly market reports</H2>
          <ul className="flex flex-wrap gap-3">
            {posts.map((p) => (
              <li key={p.month}>
                <Link
                  to={`${path}/${p.month}`}
                  className={pill('outline')}
                >
                  {monthName(p.month)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="method" className="mt-20 space-y-4">
        <H2 id="method">How the {town} numbers are calculated</H2>
        <MarketSources report={r} />
      </section>
    </>
  );
};

export default MarketAnalysis;
