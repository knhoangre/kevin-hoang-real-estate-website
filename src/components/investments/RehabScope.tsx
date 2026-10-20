import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MoneyField, PercentField, money } from '@/components/calculator/fields';
import { LINK } from '@/components/investments/ui';
import { formatPrice } from '@/lib/listings';
import { lineCost, scopeTotal, type CostItem, type Scope, type ScopeLine, type Tier } from '@/lib/rehabCosts';

/**
 * The renovation, line by line, from the cost book.
 *
 * Each line is a switch, a quantity, and low / mid / high from the book's
 * range — or the investor's own figure, from a contractor's bid. Lines the
 * listing evidences arrive switched on with their reason ("Built 1950, before
 * 1978"); the rest are there, off, for what the photos and the inspection
 * show. The source of every range is one tap away, and Kevin's own prices,
 * where he has set them, are marked as his.
 */

const UNIT_WORD: Record<CostItem['unit'], string> = {
  job: '',
  each: 'each',
  sqft: 'a sq ft',
  unit: 'a unit',
  pct: '% of the work',
};

const QTY_LABEL: Partial<Record<CostItem['unit'], string>> = {
  each: 'How many',
  sqft: 'Square feet',
  unit: 'Units',
};

const TIERS: Tier[] = ['low', 'mid', 'high'];

/** "$4.50 a sq ft", not "$5": a per-square-foot price under $10 keeps its cents. */
const dollars = (n: number) =>
  n < 10 && !Number.isInteger(n)
    ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : formatPrice(n);

const rate = (item: CostItem, tier: Tier) =>
  item.unit === 'pct' ? `${item[tier]}%` : `${dollars(item[tier])}${UNIT_WORD[item.unit] ? ` ${UNIT_WORD[item.unit]}` : ''}`;

const Line = ({
  line,
  item,
  amount,
  onChange,
}: {
  line: ScopeLine;
  item: CostItem;
  amount: number;
  onChange: (patch: Partial<ScopeLine>) => void;
}) => {
  const [open, setOpen] = useState(false);
  const custom = line.amount !== undefined;
  return (
    <li className={`rounded-xl border p-4 ${line.on ? 'border-champagne-ink bg-white' : 'border-gray-200 bg-white/60'}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={line.on}
          onChange={(e) => onChange({ on: e.target.checked })}
          aria-label={`Include ${item.label}`}
          className="mt-1 h-4 w-4 shrink-0 accent-champagne-ink"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-ink">{item.label}</p>
            <p className="numeral text-sm font-semibold text-ink">{line.on ? money(amount) : '—'}</p>
          </div>
          {line.reason && <p className="mt-1 text-xs text-champagne-ink">{line.reason}</p>}
          {line.on && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              {!custom && (
                <div className="inline-flex overflow-hidden rounded-full border border-gray-300 text-xs" role="group" aria-label="Range">
                  {TIERS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={line.tier === t}
                      onClick={() => onChange({ tier: t })}
                      className={`numeral px-3 py-1.5 font-semibold transition-colors ${
                        line.tier === t ? 'bg-ink-deep text-white' : 'text-gray-600 hover:text-champagne-ink'
                      }`}
                    >
                      {t === 'mid' ? 'Mid' : t === 'low' ? 'Low' : 'High'} {rate(item, t)}
                    </button>
                  ))}
                </div>
              )}
              {!custom && QTY_LABEL[item.unit] && (
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  {QTY_LABEL[item.unit]}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={line.qty}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d]/g, '');
                      onChange({ qty: digits === '' ? 0 : Number(digits) });
                    }}
                    className="numeral w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-ink focus:border-champagne-ink focus:outline-none"
                  />
                </label>
              )}
              {custom && (
                <div className="w-48">
                  <MoneyField label="Your figure" value={line.amount ?? 0} onChange={(n) => onChange({ amount: n })} />
                </div>
              )}
              <button
                type="button"
                onClick={() => onChange(custom ? { amount: undefined } : { amount: Math.round(amount) })}
                className="text-xs font-medium text-champagne-ink underline decoration-champagne underline-offset-4"
              >
                {custom ? 'Use the range instead' : 'Enter a bid'}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-champagne-ink"
          >
            {item.kind === 'contractor' ? 'Kevin’s price' : item.kind === 'assumption' ? 'Assumption' : 'Where this range comes from'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          {/* In the DOM either way, toggled with `hidden`, like every disclosure on this site. */}
          <p hidden={!open} className="mt-1 text-xs leading-relaxed text-gray-500">
            {item.source}{' '}
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                Source
              </a>
            )}{' '}
            ({item.asOf})
          </p>
        </div>
      </div>
    </li>
  );
};

const RehabScope = ({
  scope,
  book,
  onChange,
  groups,
}: {
  scope: Scope;
  book: CostItem[];
  onChange: (next: Scope) => void;
  /** Which groups of the book to offer; the building lines belong to the build tab. */
  groups?: CostItem['group'][];
}) => {
  const items = new Map(book.map((b) => [b.key, b]));
  const total = scopeTotal(scope, book);
  /*
   * Only the work switched on, until asked: twenty-odd lines of work nobody
   * has chosen made the page eight thousand pixels tall on a phone. A scope
   * with nothing on opens with everything showing, because then the list IS
   * the starting point.
   */
  const inGroups = scope.lines.filter((l) => {
    const g = items.get(l.key)?.group;
    return g && (!groups || groups.includes(g));
  });
  const offCount = inGroups.filter((l) => !l.on).length;
  const [showAll, setShowAll] = useState(() => inGroups.every((l) => !l.on));
  const base = scope.lines
    .filter((l) => items.get(l.key)?.unit !== 'pct')
    .reduce((sum, l) => sum + (items.get(l.key) ? lineCost(l, items.get(l.key) as CostItem) : 0), 0);
  const shownGroups = [...new Set(book.map((b) => b.group))].filter((g) => !groups || groups.includes(g));

  const patch = (key: string, p: Partial<ScopeLine>) =>
    onChange({
      ...scope,
      lines: scope.lines.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...p };
        if ('amount' in p && p.amount === undefined) delete next.amount;
        return next;
      }),
    });

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Renovation</h3>
        <p className="numeral text-sm text-gray-600">
          {money(total.work)} of work + {scope.contingencyPct}% contingency ={' '}
          <span className="text-base font-semibold text-ink">{money(total.total)}</span>
        </p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        Ranges, not quotes. Switched on: what the listing itself shows — its age, its septic, the words in its remarks.
        Add what the photos and the inspection show, and replace any line with a contractor&rsquo;s bid.
      </p>
      {shownGroups
        .filter((g) => showAll || inGroups.some((l) => l.on && items.get(l.key)?.group === g))
        .map((g) => (
        <section key={g} className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{g}</h4>
          <ul className="mt-2 space-y-2">
            {scope.lines
              .filter((l) => items.get(l.key)?.group === g && (showAll || l.on))
              .map((l) => {
                const item = items.get(l.key) as CostItem;
                return (
                  <Line
                    key={l.key}
                    line={l}
                    item={item}
                    amount={lineCost(l, item, item.unit === 'pct' ? base : 0)}
                    onChange={(p) => patch(l.key, p)}
                  />
                );
              })}
          </ul>
        </section>
      ))}
      {offCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-champagne-ink hover:text-champagne-ink"
        >
          {showAll ? 'Show only the work switched on' : `Add other work (${offCount} more kinds)`}
          <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      )}
      <div className="mt-5 max-w-xs">
        <PercentField
          label="Contingency"
          value={scope.contingencyPct}
          onChange={(n) => onChange({ ...scope, contingencyPct: n })}
          hint="For what opening the walls finds. 10% on a cosmetic job, 20% on an old house."
        />
      </div>
    </div>
  );
};

export default RehabScope;
