import { LABEL, MoneyField, NumberField, PercentField, Row, money, pct } from '@/components/calculator/fields';
import type { SetScenario } from '@/components/investments/HoldPanel';
import { Toggle } from '@/components/investments/ProjectFields';
import { LINK, SourceHint, Stat } from '@/components/investments/ui';
import { build } from '@/lib/investment';
import { ASSUMPTIONS } from '@/lib/investmentAssumptions';
import type { TownRules } from '@/lib/investmentRules';
import { formatPrice } from '@/lib/listings';
import { newBuildExit, type SaleRow } from '@/lib/newBuild';
import type { CostItem } from '@/lib/rehabCosts';
import { buildInputs, monthlyCarry, type Scenario } from '@/lib/scenario';

/**
 * Teardown and build: buy the house for its land, take it down, build new,
 * sell. What is left after the land, the demolition, the house, the design and
 * permits, the construction loan, the months it all takes, and the cost of
 * selling.
 *
 * THE EXIT IS READ FROM NEW HOUSES THAT SOLD IN THIS TOWN, at about the size
 * planned (newBuild.ts). When the investor changes the size, the exit does not
 * move by itself — they see what new houses of the new size sold for, and
 * choose. A town's demolition delay is offered as a scenario, from its bylaw.
 */

const BuildPanel = ({
  s,
  set,
  book,
  sales,
  sizeNote,
  town,
  rules,
}: {
  s: Scenario;
  set: SetScenario;
  book: CostItem[];
  sales: SaleRow[];
  sizeNote: string;
  town: string;
  rules: TownRules | null;
}) => {
  const setBuild = (patch: Partial<Scenario['build']>) => set((cur) => ({ build: { ...cur.build, ...patch } }));
  const b = s.build;
  const r = build(buildInputs(s));
  const exit = newBuildExit(sales, b.newSqft);
  const item = (key: string) => book.find((c) => c.key === key);
  const delay = rules?.demolition;
  const noExit = b.exitPrice <= 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-8 self-start rounded-2xl border border-gray-200 bg-bone p-6 sm:p-7">
        <fieldset className="space-y-5">
          <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">The land</legend>
          <MoneyField label="Purchase price" value={s.price} onChange={(n) => set({ price: n })} hint="For a teardown, this is the price of the lot." />
          <MoneyField label="Closing costs" value={s.closingCosts} onChange={(n) => set({ closingCosts: n })} hint={<SourceHint a={ASSUMPTIONS.buyerClosingPct} />} />
          <MoneyField
            label="Demolition"
            value={b.demolition}
            onChange={(n) => setBuild({ demolition: n })}
            hint={item('demolition') ? `${item('demolition')?.source}` : undefined}
          />
          <MoneyField
            label="Asbestos, disconnects and permit"
            value={b.demoExtras}
            onChange={(n) => setBuild({ demoExtras: n })}
            hint="The asbestos survey and any abatement, cutting off the utilities, and the demolition permit — the cost book's middle figures."
          />
        </fieldset>

        <fieldset className="space-y-5 border-t border-gray-200 pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">The new house</legend>
          <NumberField label="Size" value={b.newSqft} onChange={(n) => setBuild({ newSqft: n })} unit="sq ft" hint={sizeNote} />
          <MoneyField
            label="Construction, per sq ft"
            value={b.hardPerSqft}
            onChange={(n) => setBuild({ hardPerSqft: n })}
            hint={item('new-build')?.source}
          />
          <MoneyField label="Site work" value={b.siteWork} onChange={(n) => setBuild({ siteWork: n })} hint={item('site-work')?.source} />
          <PercentField label="Design, engineering and permits" value={b.softPct} onChange={(n) => setBuild({ softPct: n })} unit="% of construction" hint={item('soft-costs')?.source} />
          <PercentField label="Contingency" value={b.contingencyPct} onChange={(n) => setBuild({ contingencyPct: n })} hint={<SourceHint a={ASSUMPTIONS.buildContingencyPct} />} />
          <MoneyField
            label="Sells for"
            value={b.exitPrice}
            onChange={(n) => setBuild({ exitPrice: n })}
            hint={
              exit ? (
                <>
                  {exit.n} new houses of {b.newSqft.toLocaleString()} sq ft ±{exit.bandPct}% sold in {town} for a median{' '}
                  {formatPrice(exit.medianPrice)} ({formatPrice(exit.medianPerSqft)} a sq ft), {exit.from?.slice(0, 7)} to{' '}
                  {exit.to?.slice(0, 7)}.{' '}
                  {Math.abs(exit.medianPrice - b.exitPrice) > 1000 && (
                    <button type="button" onClick={() => setBuild({ exitPrice: exit.medianPrice })} className={LINK}>
                      Use {formatPrice(exit.medianPrice)}
                    </button>
                  )}
                </>
              ) : (
                `Not enough new houses of about this size sold in ${town} to suggest a price. Enter your own.`
              )
            }
          />
        </fieldset>

        <fieldset className="space-y-5 border-t border-gray-200 pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Timing</legend>
          <NumberField label="Permitting" value={b.permittingMonths} onChange={(n) => setBuild({ permittingMonths: n })} unit="months" hint={<SourceHint a={ASSUMPTIONS.permittingMonths} />} />
          {delay?.months ? (
            <Toggle
              label={`${town}'s demolition delay`}
              value={b.delayMonths > 0 ? 'delay' : 'none'}
              onChange={(v) => setBuild({ delayMonths: v === 'delay' ? (delay.months as number) : 0 })}
              options={[
                { id: 'none', label: 'Not delayed' },
                { id: 'delay', label: `Delayed ${delay.months} months` },
              ]}
            />
          ) : (
            <NumberField
              label="Demolition delay"
              value={b.delayMonths}
              onChange={(n) => setBuild({ delayMonths: n })}
              unit="months"
              hint={`How long ${town} could hold up the demolition was not confirmed; see the rules below.`}
            />
          )}
          <NumberField label="Building" value={b.buildMonths} onChange={(n) => setBuild({ buildMonths: n })} unit="months" hint={<SourceHint a={ASSUMPTIONS.buildMonths} />} />
          <NumberField label="Selling" value={b.saleMonths} onChange={(n) => setBuild({ saleMonths: n })} unit="months" hint={<SourceHint a={ASSUMPTIONS.saleMonths} />} />
          <p className="text-xs leading-relaxed text-gray-500">
            Held {r.months} months in all, at {formatPrice(Math.round(monthlyCarry(s)))} a month in taxes, insurance and
            utilities (from the rental tab).
          </p>
        </fieldset>

        <fieldset className="space-y-5 border-t border-gray-200 pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">The construction loan</legend>
          <PercentField label="Lends" value={b.ltcPct} onChange={(n) => setBuild({ ltcPct: n })} unit="% of cost" hint={<SourceHint a={ASSUMPTIONS.constructionLtcPct} />} />
          <PercentField label="Interest rate" value={b.ratePct} onChange={(n) => setBuild({ ratePct: n })} hint={<SourceHint a={ASSUMPTIONS.constructionRatePct} />} />
          <PercentField label="Points" value={b.pointsPct} onChange={(n) => setBuild({ pointsPct: n })} hint={<SourceHint a={ASSUMPTIONS.constructionPointsPct} />} />
          <fieldset>
            <legend className={LABEL}>The land</legend>
            <label className="mt-2 flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={b.financeLand}
                onChange={(e) => setBuild({ financeLand: e.target.checked })}
                className="mt-1 h-4 w-4 accent-champagne-ink"
              />
              <span>Financed too, at the same share — most lenders want the land paid for.</span>
            </label>
          </fieldset>
        </fieldset>
      </div>

      <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Profit</p>
        {noExit ? (
          <p className="mt-2 max-w-md text-sm text-gray-600">Enter what the new house would sell for to see the profit.</p>
        ) : (
          <>
            <p className={`numeral mt-2 text-4xl font-semibold sm:text-5xl ${r.profit < 0 ? 'text-red-700' : 'text-ink'}`}>{money(r.profit)}</p>
            <p className="mt-2 text-sm text-gray-600">
              On {formatPrice(Math.round(r.cashIn))} of your own money over {r.months} months.
            </p>
          </>
        )}
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Stat label="Margin on cost" value={noExit ? '—' : pct(r.marginOnCostPct)} tone={(r.marginOnCostPct ?? 0) < 0 ? 'bad' : 'ink'} note="Profit over everything spent." />
          <Stat label="Return on cash" value={noExit ? '—' : pct(r.roiPct)} tone={(r.roiPct ?? 0) < 0 ? 'bad' : 'ink'} note="Profit over the money you put in." />
          <Stat label="Annualised" value={noExit ? '—' : pct(r.annualisedPct)} tone={(r.annualisedPct ?? 0) < 0 ? 'bad' : 'ink'} note={`Over ${r.months} months.`} />
          <Stat label="Construction loan" value={formatPrice(Math.round(r.loan))} note={`Interest and points ${formatPrice(Math.round(r.interest + r.points))}.`} />
        </dl>
        <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">Where the money goes</h3>
        <dl className="mt-2 divide-y divide-gray-100 border-y border-gray-200">
          <Row label="Sale price" value={b.exitPrice} strong />
          {r.costLines.map((l) => (
            <Row key={l.key} label={l.label} value={l.amount} minus />
          ))}
          <Row label="Profit" value={r.profit} strong signed />
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-gray-500">
          Whether a house this size may be built on this lot is the zoning bylaw&rsquo;s call — floor-area, setback and
          height limits differ by district and town — and is not checked here. Neither is the soil, the trees or the
          neighbours&rsquo; appeal.
        </p>
      </div>
    </div>
  );
};

export default BuildPanel;
