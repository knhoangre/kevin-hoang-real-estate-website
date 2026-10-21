/**
 * The pieces both market pages are built from: a table, the edge card, the
 * inventory table, the rents table and the sources note.
 *
 * The town page and the monthly post read the SAME stored report, so the parts
 * that show the same thing are one component — a months-of-supply figure that
 * reads 3.3 on one page and 3.28 on the other would be the drift
 * component-driven-consistency exists to prevent.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  TYPE_NAMES,
  edge,
  freshestWindow,
  type MarketReport,
  type RentWindow,
  type SaleType,
} from '@/lib/market';
import {
  EDGE_LABEL,
  EDGE_RULE_TEXT,
  dateLong,
  dollars,
  money,
  months1,
  pct,
  ratioPct,
  windowPhrase,
  windowSpan,
} from '@/lib/marketText';
import { SITE } from '@/lib/siteConfig';

export const LINK =
  'font-medium text-ink underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink';

/**
 * A table that scrolls sideways inside itself on a phone, with its first
 * column pinned so a row never loses its label. Numbers are right-aligned in
 * tabular figures, so a column of prices lines up by digit.
 */
export const DataTable = ({
  head,
  rows,
  caption,
  minWidth = 'min-w-[30rem]',
}: {
  head: ReactNode[];
  rows: ReactNode[][];
  caption?: string;
  /** Below this the table scrolls rather than squeezing its numbers. */
  minWidth?: string;
}) => (
  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
    <table className={`w-full ${minWidth} border-collapse text-sm`}>
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr className="border-b border-gray-300">
          {head.map((h, i) => (
            <th
              key={i}
              scope="col"
              className={`py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                i === 0 ? 'sticky left-0 bg-white pr-3 text-left' : 'pl-3 text-right'
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="border-b border-gray-100 last:border-0">
            {row.map((cell, i) =>
              i === 0 ? (
                <th key={i} scope="row" className="sticky left-0 bg-white py-2.5 pr-3 text-left font-medium text-ink">
                  {cell}
                </th>
              ) : (
                <td key={i} className="py-2.5 pl-3 text-right tabular-nums text-gray-800">
                  {cell}
                </td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** A dash with a reason, where a figure is withheld for want of sales. */
export const Thin = () => (
  <span className="text-gray-400" title="Too few sales for a median">
    —
  </span>
);

const cell = (s: string) => (s === '—' ? <Thin /> : s);

/** One card per sale type: who has the edge, and the three numbers it rests on. */
export const EdgeCards = ({ report, types }: { report: MarketReport; types: SaleType[] }) => (
  <div className={`grid gap-4 ${types.length > 2 ? 'md:grid-cols-3' : types.length === 2 ? 'md:grid-cols-2' : ''}`}>
    {types.map((t) => {
      const w = freshestWindow(report, t);
      const s = w?.byType[t];
      const verdict = s ? edge(s) : null;
      const inv = report.inventory.byType[t];
      return (
        <div key={t} className="rounded-2xl border border-gray-200 bg-bone p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-ink">{TYPE_NAMES[t].short}</p>
          <p className="mt-2 text-xl font-semibold text-ink">{verdict ? EDGE_LABEL[verdict] : 'Too few sales to say'}</p>
          {s && w && (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Sold over asking</dt>
                <dd className="font-semibold tabular-nums text-ink">{pct(s.over)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Median sale-to-asking</dt>
                <dd className="font-semibold tabular-nums text-ink">{ratioPct(s.ratio)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">Months of supply</dt>
                <dd className="font-semibold tabular-nums text-ink">{months1(inv.monthsSupply)}</dd>
              </div>
            </dl>
          )}
          {w && (
            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              {s?.sales} sales over {windowPhrase(w.months)} ({windowSpan(w)}); supply as of {dateLong(report.asOf)}.
            </p>
          )}
        </div>
      );
    })}
  </div>
);

/** What is for sale and pending, by type. */
export const InventoryTable = ({ report, types }: { report: MarketReport; types: SaleType[] }) => (
  <DataTable
    caption={`Homes for sale in ${report.town} on ${dateLong(report.asOf)}`}
    head={['', ...types.map((t) => TYPE_NAMES[t].short)]}
    rows={[
      ['For sale', ...types.map((t) => report.inventory.byType[t].available.toLocaleString('en-US'))],
      ['Under agreement', ...types.map((t) => report.inventory.byType[t].pending.toLocaleString('en-US'))],
      ['Share with a buyer', ...types.map((t) => cell(pct(report.inventory.byType[t].pendingShare)))],
      ['Months of supply', ...types.map((t) => cell(months1(report.inventory.byType[t].monthsSupply)))],
      ['Median asking price', ...types.map((t) => cell(money(report.inventory.byType[t].askMedian)))],
      ['Asking per sq ft', ...types.map((t) => cell(dollars(report.inventory.byType[t].askPpsf)))],
      ...(report.inventory.all.fresh !== null
        ? [['Listed in the last 30 days', ...types.map((t) => String(report.inventory.byType[t].fresh ?? '—'))]]
        : []),
      [
        'Price cut in the last 30 days',
        ...types.map((t) => {
          const inv = report.inventory.byType[t];
          return inv.cutSize !== null ? `${inv.cuts} (typically ${pct(inv.cutSize)})` : String(inv.cuts);
        }),
      ],
    ]}
  />
);

/** Rents by bedroom count over the given windows. */
export const RentTable = ({ windows, labels }: { windows: RentWindow[]; labels: string[] }) => {
  const groups = [...new Set(windows.flatMap((w) => w.rows.map((r) => r.label)))];
  const order = ['Studio', '1 bedroom', '2 bedrooms', '3 bedrooms', '4 or more'];
  groups.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return (
    <DataTable
      head={['', ...labels]}
      rows={groups.map((g) => [
        g,
        ...windows.map((w) => {
          const c = w.rows.find((r) => r.label === g);
          if (!c || c.median === null) return <Thin key={w.months} />;
          return (
            <span key={w.months}>
              {dollars(c.median)}
              <span className="block text-xs text-gray-500">
                {c.n} {c.n === 1 ? 'lease' : 'leases'}
              </span>
            </span>
          );
        }),
      ])}
    />
  );
};

/**
 * Where the numbers come from and what each one means. Every definition here is
 * a decision in market.ts, stated where the reader meets its result.
 *
 * The attribution names MLS PIN and the period, which is the form MLSs commonly
 * require for published statistics. NOT YET CHECKED against MLS PIN's own rules
 * for statistics — the same open caveat IdxDisclosure carries for listings.
 */
export const MarketSources = ({ report, id }: { report: MarketReport; id?: string }) => (
  <div id={id} className="space-y-4 text-sm leading-relaxed text-gray-700">
    <p>
      Based on information from MLS Property Information Network, Inc. (MLS PIN) for closings from{' '}
      {dateLong(report.windows[0].from)} through {dateLong(report.windows[0].to)}, and listings as of{' '}
      {dateLong(report.asOf)}. The figures are calculated by {SITE.agentName}, {SITE.brokerage}, not by MLS PIN,
      and are believed accurate but not guaranteed. Sales that were never listed on MLS — some private and
      new-construction sales — are not included.
    </p>
    <dl className="grid gap-x-8 gap-y-3 md:grid-cols-2">
      <div>
        <dt className="font-semibold text-ink">Sale-to-asking</dt>
        <dd>
          The sale price divided by the <em>final</em> asking price, which is the only one MLS data carries. A home
          that cut its price and then sold at the lower figure reads as 100%.
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">Sold over asking</dt>
        <dd>The share of sales that closed above the final asking price, by any amount.</dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">Months of supply</dt>
        <dd>
          Homes for sale now, divided by the average number sold per month over the past twelve months: how long the
          current listings would last if nothing new came on. It is lower in spring and higher in winter, as
          inventory is.
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">Under agreement</dt>
        <dd>Listings with an accepted offer that has not closed, including contingent ones.</dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">Windows</dt>
        <dd>
          Whole calendar months ending with {dateLong(report.windows[0].to)}. A closing reaches MLS a few days
          after it happens, so a window ending today would undercount its own last week.
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">Medians</dt>
        <dd>
          The middle sale: half sold for more, half for less. A median needs at least five sales and is shown as a
          dash otherwise. A month&rsquo;s median moves with which homes happened to close, so the three- and
          twelve-month figures are the steadier read.
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">Listed in the last 30 days</dt>
        <dd>
          When this site first saw the listing. Tracking began on {dateLong(report.trackingSince)}; MLS data does not
          include days on market, so these pages do not report it.
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">Rents</dt>
        <dd>
          Leases recorded in MLS, by bedroom count. Parking spaces, and anything under $500 or over $30,000 a month,
          are left out.
        </dd>
      </div>
      <div className="md:col-span-2">
        <dt className="font-semibold text-ink">Who has the edge</dt>
        <dd>{EDGE_RULE_TEXT}</dd>
      </div>
    </dl>
    <p>
      These figures describe a town, not a house. For what a particular home would sell for, ask for a{' '}
      <Link to="/home-valuation" className={LINK}>
        written valuation
      </Link>
      .
    </p>
  </div>
);

/** A section heading, the size every market page uses. */
export const H2 = ({ children, id }: { children: ReactNode; id?: string }) => (
  <h2 id={id} className="scroll-mt-28 text-2xl md:text-3xl font-semibold text-ink tracking-tight">
    {children}
  </h2>
);
