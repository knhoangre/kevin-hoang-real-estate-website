import type { ReactNode } from 'react';
import { LABEL, MoneyField, NumberField, PercentField } from '@/components/calculator/fields';
import { SourceHint } from '@/components/investments/ui';
import type { SetScenario } from '@/components/investments/HoldPanel';
import { ASSUMPTIONS } from '@/lib/investmentAssumptions';
import { formatPrice } from '@/lib/listings';
import { monthlyCarry, type Scenario } from '@/lib/scenario';

/**
 * The inputs a flip and a BRRRR share: what is paid, what it will be worth, how
 * long the work takes, and how the purchase and the work are paid for.
 */

const Toggle = <T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) => (
  <fieldset>
    <legend className={LABEL}>{label}</legend>
    <div className="mt-2 flex gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            value === o.id ? 'bg-ink-deep text-white' : 'border border-gray-300 text-gray-700 hover:border-champagne-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  </fieldset>
);

export { Toggle };

export const PurchaseFields = ({
  s,
  set,
  askingPrice,
  arvNote,
  monthsLabel,
  monthsKey,
}: {
  s: Scenario;
  set: SetScenario;
  askingPrice: number;
  arvNote: ReactNode;
  monthsLabel: string;
  monthsKey: 'flipMonths' | 'refiMonths';
}) => {
  const setProject = (patch: Partial<Scenario['project']>) => set((cur) => ({ project: { ...cur.project, ...patch } }));
  return (
    <fieldset className="space-y-5">
      <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Purchase and timing</legend>
      <MoneyField
        label="Purchase price"
        value={s.price}
        onChange={(n) => set({ price: n })}
        hint={s.price === askingPrice ? 'The asking price. Try your offer.' : `Asking is ${formatPrice(askingPrice)}.`}
      />
      <MoneyField label="Closing costs" value={s.closingCosts} onChange={(n) => set({ closingCosts: n })} hint={<SourceHint a={ASSUMPTIONS.buyerClosingPct} />} />
      <MoneyField label="After-repair value" value={s.arv} onChange={(n) => set({ arv: n })} hint={arvNote} />
      <NumberField
        label="Renovation takes"
        value={s.project.rehabMonths}
        onChange={(n) => setProject({ rehabMonths: n })}
        unit="months"
        hint={<SourceHint a={ASSUMPTIONS.rehabMonths} />}
      />
      <NumberField
        label={monthsLabel}
        value={s.project[monthsKey]}
        onChange={(n) => setProject({ [monthsKey]: n } as Partial<Scenario['project']>)}
        unit="months"
        hint={
          monthsKey === 'flipMonths' ? (
            <SourceHint a={ASSUMPTIONS.saleMonths}>From the purchase: the renovation plus selling.</SourceHint>
          ) : (
            <SourceHint a={ASSUMPTIONS.refiTitleMonths}>From the purchase to the new loan.</SourceHint>
          )
        }
      />
      <MoneyField
        label="Utilities while empty, per month"
        value={s.project.monthlyUtilities}
        onChange={(n) => setProject({ monthlyUtilities: n })}
        hint={
          <SourceHint a={ASSUMPTIONS.rehabUtilitiesMonthly}>
            With the taxes, insurance and any condo fee from the rental tab, holding costs {formatPrice(Math.round(monthlyCarry(s)))} a month.
          </SourceHint>
        }
      />
    </fieldset>
  );
};

export const FinanceFields = ({ s, set }: { s: Scenario; set: SetScenario }) => {
  const setProject = (patch: Partial<Scenario['project']>) => set((cur) => ({ project: { ...cur.project, ...patch } }));
  const setHm = (patch: Partial<Scenario['project']['hm']>) =>
    set((cur) => ({ project: { ...cur.project, hm: { ...cur.project.hm, ...patch } } }));
  const hm = s.project.hm;
  return (
    <fieldset className="space-y-5 border-t border-gray-200 pt-6">
      <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Paying for it</legend>
      <Toggle
        label="Purchase and renovation"
        value={s.project.finance}
        onChange={(v) => setProject({ finance: v })}
        options={[
          { id: 'hardMoney', label: 'Hard money' },
          { id: 'cash', label: 'Cash' },
        ]}
      />
      {s.project.finance === 'hardMoney' && (
        <>
          <PercentField label="Interest rate" value={hm.ratePct} onChange={(n) => setHm({ ratePct: n })} hint={<SourceHint a={ASSUMPTIONS.hardMoneyRatePct} />} />
          <PercentField label="Points" value={hm.pointsPct} onChange={(n) => setHm({ pointsPct: n })} hint={<SourceHint a={ASSUMPTIONS.hardMoneyPointsPct} />} />
          <PercentField
            label="Lends up to"
            value={hm.ltcPct}
            onChange={(n) => setHm({ ltcPct: n })}
            unit="% of cost"
            hint={<SourceHint a={ASSUMPTIONS.hardMoneyLtcPct} />}
          />
          <PercentField
            label="But no more than"
            value={hm.maxArvPct}
            onChange={(n) => setHm({ maxArvPct: n })}
            unit="% of ARV"
            hint={<SourceHint a={ASSUMPTIONS.hardMoneyMaxArvPct} />}
          />
          <MoneyField label="Lender fees" value={hm.fees} onChange={(n) => setHm({ fees: n })} hint={<SourceHint a={ASSUMPTIONS.hardMoneyFees} />} />
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={hm.dutchInterest}
              onChange={(e) => setHm({ dutchInterest: e.target.checked })}
              className="mt-1 h-4 w-4 accent-champagne-ink"
            />
            <span>
              Interest on the whole loan from day one{' '}
              <span className="text-xs text-gray-500">
                (&ldquo;Dutch&rdquo; interest — some lenders charge it on renovation money not yet drawn)
              </span>
            </span>
          </label>
        </>
      )}
    </fieldset>
  );
};
