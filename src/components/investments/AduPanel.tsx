import type { ReactNode } from 'react';
import { MoneyField, NumberField, Row, money, pct } from '@/components/calculator/fields';
import type { SetScenario } from '@/components/investments/HoldPanel';
import { Stat } from '@/components/investments/ui';
import { adu } from '@/lib/investment';
import { formatPrice } from '@/lib/listings';
import type { LotContext } from '@/lib/parcels';
import type { CostItem } from '@/lib/rehabCosts';
import { aduOperating, type Scenario } from '@/lib/scenario';

/**
 * Add an accessory dwelling unit, and look at the lot.
 *
 * The ADU is costed from the cost book and rented at what a unit its size
 * leases for in town, as a rental of its own: what it costs, what it nets a
 * year, and how long it takes to pay for itself. It is allowed by right on a
 * single-family lot outside Boston since February 2025, up to 900 sq ft or
 * half the house — the cap is computed and shown with what it was measured on.
 *
 * THE LOT is set beside the typical single-family lot in its own zoning
 * district, from the assessor's records. Twice the typical lot is worth a
 * surveyor's look; it is never called buildable, because frontage and the
 * district's minimum decide that and neither is checked here.
 */

const AduPanel = ({
  s,
  set,
  book,
  mainGrossArea,
  gfaNote,
  rentNote,
  effectiveTaxRate,
  lotSqft,
  lotNote,
  lots,
  town,
}: {
  s: Scenario;
  set: SetScenario;
  book: CostItem[];
  /** The house's gross floor area — the assessor's where found, else the listing's living area. */
  mainGrossArea: number;
  gfaNote: string;
  rentNote: ReactNode;
  effectiveTaxRate: number | null;
  lotSqft: number | null;
  lotNote: string | null;
  lots: LotContext | null;
  town: string;
}) => {
  const setAdu = (patch: Partial<Scenario['adu']>) => set((cur) => ({ adu: { ...cur.adu, ...patch } }));
  const a = s.adu;
  const cost = a.sqft * a.perSqft + a.fixed;
  const r = adu({ mainGrossArea, sqft: a.sqft, perSqft: a.perSqft, fixed: a.fixed, op: aduOperating(s, cost, effectiveTaxRate) });
  const st = r.statement;
  const maxSqft = r.maxSqft;
  const overCap = a.sqft > maxSqft;
  const ratio = lotSqft && lots ? lotSqft / lots.medianSqft : null;
  const item = (key: string) => book.find((c) => c.key === key);
  const where = lots ? (lots.scope === 'district' ? `the ${lots.zoning} district` : town) : null;

  return (
    <div className="space-y-10">
      {/* ---------------- The lot ---------------- */}
      <div className="rounded-2xl border border-gray-200 bg-bone p-6 sm:p-7">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">The lot</h3>
        {lotSqft ? (
          <>
            <p className="numeral mt-3 text-2xl font-semibold text-ink">
              {lotSqft.toLocaleString()} sq ft
              {ratio !== null && (
                <span className="ml-3 text-base font-medium text-gray-600">
                  {ratio.toFixed(1)}× the typical single-family lot in {where}
                </span>
              )}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {lots
                ? `The median of ${lots.n.toLocaleString()} single-family lots in ${where} is ${lots.medianSqft.toLocaleString()} sq ft, from the town's assessing records. `
                : 'How it compares with its neighbours could not be read from the assessing records. '}
              {ratio !== null && ratio >= 2
                ? 'A lot twice the typical size is worth a surveyor’s look for a second house lot — but only frontage on a qualifying street and the district’s minimum lot size decide that, and neither is checked here.'
                : ratio !== null
                  ? 'At this size a second house lot is unlikely; an ADU is the way to add a unit.'
                  : ''}
            </p>
            {lotNote && <p className="mt-2 text-xs text-gray-500">{lotNote}</p>}
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-600">The lot size is not on the listing or in the assessing records found for it.</p>
        )}
      </div>

      {/* ---------------- The ADU ---------------- */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-5 self-start rounded-2xl border border-gray-200 bg-bone p-6 sm:p-7">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">An accessory dwelling unit</h3>
          <NumberField
            label="Size"
            value={a.sqft}
            onChange={(n) => setAdu({ sqft: n })}
            unit="sq ft"
            hint={
              <>
                Allowed by right up to {maxSqft.toLocaleString()} sq ft here — 900, or half the house&rsquo;s floor area if
                smaller ({gfaNote}).
                {overCap && <strong className="text-red-700"> This is over the cap.</strong>}
              </>
            }
          />
          <MoneyField label="Building it, per sq ft" value={a.perSqft} onChange={(n) => setAdu({ perSqft: n })} hint={item('adu')?.source} />
          <MoneyField label="Site costs" value={a.fixed} onChange={(n) => setAdu({ fixed: n })} hint={item('adu-site')?.source} />
          <MoneyField label="Monthly rent" value={a.rent} onChange={(n) => setAdu({ rent: n })} hint={rentNote} />
          <p className="text-xs leading-relaxed text-gray-500">
            Vacancy, management, the capital reserve and leasing are the rental tab&rsquo;s. Its tax is its cost at{' '}
            {effectiveTaxRate !== null
              ? `this house's effective rate (${(effectiveTaxRate * 1000).toFixed(2)} per $1,000: the tax bill over the assessed value)`
              : 'no rate, since the tax bill or the assessment is missing — add it if you know it'}
            ; its insurance a landlord policy on its cost; maintenance 1% of its cost a year.
          </p>
        </div>

        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Earns a year, before any loan</p>
          <p className={`numeral mt-2 text-4xl font-semibold sm:text-5xl ${st.noi < 0 ? 'text-red-700' : 'text-ink'}`}>{money(st.noi * 12)}</p>
          <p className="mt-2 text-sm text-gray-600">On {formatPrice(Math.round(cost))} to build.</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Stat label="Yield on cost" value={pct(r.yieldOnCostPct)} tone={(r.yieldOnCostPct ?? 0) < 0 ? 'bad' : 'ink'} note="A year of net income over what it cost to build." />
            <Stat label="Pays for itself in" value={r.paybackYears === null ? '—' : `${r.paybackYears.toFixed(1)} years`} note="Its cost over a year of net income, before any loan." />
          </dl>
          <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">Monthly</h3>
          <dl className="mt-2 divide-y divide-gray-100 border-y border-gray-200">
            <Row label="Rent" value={st.gross} strong />
            <Row label={`Vacancy (${s.vacancyPct}%)`} value={st.vacancyLoss} minus />
            {st.lines.map((l) => (
              <Row key={l.key} label={l.label} value={l.monthly} minus />
            ))}
            <Row label="Net operating income" value={st.noi} strong signed />
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-gray-500">
            What an ADU adds to the house&rsquo;s value when it is sold is not modelled: few have sold with one yet, and
            a lender values it its own way.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AduPanel;
