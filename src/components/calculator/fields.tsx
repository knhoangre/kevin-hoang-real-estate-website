import { useEffect, useState, type ReactNode } from 'react';
import { formatPrice } from '@/lib/listings';

/**
 * The calculator's inputs and result rows, shared.
 *
 * Lifted out of HomeCalculator on 2026-10-20 when /investments needed the same
 * fields: a second set of money inputs is how two pages end up formatting
 * "$1,150,000" differently, or one of them producing NaN from a pasted "$".
 * HomeCalculator renders exactly as it did; only where these live changed.
 */

export const LABEL = 'text-xs font-semibold uppercase tracking-[0.12em] text-gray-500';

/** A dollar input that shows thousands separators without fighting the caret. */
export const MoneyField = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: ReactNode;
  value: number;
  onChange: (n: number) => void;
}) => (
  <label className="block">
    {label && <span className={LABEL}>{label}</span>}
    <span className="mt-1 flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-champagne-ink">
      <span className="pl-3 text-sm text-gray-500">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value.toLocaleString('en-US')}
        onChange={(e) => {
          // Strip everything but digits, so a pasted "$1,150,000" works and a
          // stray letter cannot produce NaN in the total.
          const digits = e.target.value.replace(/[^\d]/g, '');
          onChange(digits === '' ? 0 : Number(digits));
        }}
        className="numeral w-full bg-transparent px-2 py-2 text-sm font-medium text-ink outline-none"
      />
    </span>
    {hint && <span className="mt-1 block text-xs leading-relaxed text-gray-500">{hint}</span>}
  </label>
);

/**
 * A decimal input with a unit after it — a percentage by default.
 *
 * Holds the raw text alongside the number so a half-typed "6." survives the
 * keystroke instead of snapping back to "6" and stranding the caret.
 */
export const PercentField = ({
  label,
  hint,
  value,
  onChange,
  unit = '%',
}: {
  label: string;
  hint?: ReactNode;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
}) => {
  const [text, setText] = useState(String(value));

  // Follows the value when something else sets it — the down-payment toggle
  // writing back a recomputed percentage, for instance.
  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label className="block">
      {label && <span className={LABEL}>{label}</span>}
      <span className="mt-1 flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-champagne-ink">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, '');
            if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
            setText(raw);
            onChange(raw === '' ? 0 : Number(raw));
          }}
          className="numeral w-full bg-transparent px-3 py-2 text-sm font-medium text-ink outline-none"
        />
        {unit && (
          <span className={unit === '%' ? 'pr-3 text-sm text-gray-500' : 'whitespace-nowrap pr-3 text-sm text-gray-500'}>
            {unit}
          </span>
        )}
      </span>
      {hint && <span className="mt-1 block text-xs leading-relaxed text-gray-500">{hint}</span>}
    </label>
  );
};

/** A count — months, square feet, units — with its unit after it. */
export const NumberField = (props: {
  label: string;
  hint?: ReactNode;
  value: number;
  onChange: (n: number) => void;
  unit: string;
}) => <PercentField {...props} />;

/** A dollar figure with a real minus sign, for a cash flow or proceeds below zero. */
export const money = (n: number) => `${n < 0 ? '−' : ''}${formatPrice(Math.round(Math.abs(n)))}`;

/** A percentage to one place, or a dash when there is nothing to divide. */
export const pct = (n: number | null) => (n === null ? '—' : `${n.toFixed(1)}%`);

/**
 * One line of a breakdown. Hidden at zero, so a single-family has no HOA row.
 *
 * `signed` is for a figure that can honestly be negative — NOI, a cash flow —
 * which is shown with its minus sign rather than hidden as if it were absent.
 */
export const Row = ({
  label,
  value,
  minus = false,
  strong = false,
  signed = false,
}: {
  label: ReactNode;
  value: number;
  minus?: boolean;
  strong?: boolean;
  signed?: boolean;
}) => {
  const hidden = strong ? false : signed ? value === 0 : value <= 0;
  if (hidden) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className={strong ? 'font-semibold text-ink' : 'text-gray-600'}>{label}</dt>
      <dd
        className={`numeral ${strong ? 'font-semibold' : 'font-medium'} ${
          signed && value < 0 ? 'text-red-700' : 'text-ink'
        }`}
      >
        {minus ? '−' : ''}
        {money(value)}
      </dd>
    </div>
  );
};

/**
 * A stacked bar with its legend.
 *
 * A tonal ramp rather than five hues. The design system allows champagne as a
 * NON-TEXT MARK on a light surface — which a chart segment is — but it has no
 * third or fourth accent, and inventing them here would start a third palette
 * on a site that was unified out of two.
 */
export const SplitBar = ({
  parts,
}: {
  parts: { key: string; label: string; value: number; className: string }[];
}) => {
  const shown = parts.filter((p) => p.value > 0);
  const total = shown.reduce((sum, p) => sum + p.value, 0);
  if (total <= 0) return null;
  return (
    <>
      <div
        className="mt-6 flex h-3 overflow-hidden rounded-full bg-gray-100"
        role="img"
        aria-label={shown.map((p) => `${p.label} ${Math.round((p.value / total) * 100)}%`).join(', ')}
      >
        {shown.map((p) => (
          <span key={p.key} className={p.className} style={{ width: `${(p.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {shown.map((p) => (
          <span key={p.key} className="flex items-center gap-2 text-xs text-gray-600">
            <span className={`h-2.5 w-2.5 rounded-full ${p.className}`} aria-hidden />
            {p.label}
          </span>
        ))}
      </div>
    </>
  );
};
