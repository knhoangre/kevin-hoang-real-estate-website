import type { ReactNode } from 'react';
import { MoneyField, PercentField, Row, money, pct } from '@/components/calculator/fields';
import type { SetScenario } from '@/components/investments/HoldPanel';
import { FinanceFields, PurchaseFields } from '@/components/investments/ProjectFields';
import RehabScope from '@/components/investments/RehabScope';
import { SourceHint, Stat } from '@/components/investments/ui';
import { flip, sensitivity, type FlipInputs } from '@/lib/investment';
import { ASSUMPTIONS } from '@/lib/investmentAssumptions';
import { formatPrice } from '@/lib/listings';
import type { CostItem } from '@/lib/rehabCosts';
import { flipInputs, type Scenario } from '@/lib/scenario';
import { SITE } from '@/lib/siteConfig';

/**
 * Fix and flip: buy, renovate, sell — what is left after every cost, the
 * hard-money lender's included, and what moves that answer most.
 *
 * The cost of selling is sellerProceeds()'s, so the Massachusetts deed excise
 * is in it. The "70% rule" is shown as what it is: a rule of thumb investors
 * use to sanity-check an offer, not a calculation of anything.
 */
const FlipPanel = ({
  s,
  set,
  book,
  askingPrice,
  arvNote,
}: {
  s: Scenario;
  set: SetScenario;
  book: CostItem[];
  askingPrice: number;
  arvNote: ReactNode;
}) => {
  const inputs = flipInputs(s, book);
  const r = flip(inputs);
  const setSale = (patch: Partial<Scenario['sale']>) => set((cur) => ({ sale: { ...cur.sale, ...patch } }));
  const tweaks = sensitivity((x: FlipInputs) => flip(x).profit, inputs, [
    { label: 'Sells for 10% less', apply: (x) => ({ ...x, arv: x.arv * 0.9 }) },
    { label: 'Renovation costs 20% more', apply: (x) => ({ ...x, rehab: x.rehab * 1.2 }) },
    { label: 'Takes three months longer', apply: (x) => ({ ...x, holdMonths: x.holdMonths + 3 }) },
  ]);
  const noArv = s.arv <= 0;

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-gray-200 bg-bone p-6 sm:p-7">
        <RehabScope scope={s.scope} book={book} onChange={(scope) => set({ scope })} groups={['Kitchen and bath', 'Rooms and finishes', 'Systems', 'Outside', 'Required by law']} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-8 self-start rounded-2xl border border-gray-200 bg-bone p-6 sm:p-7">
          <PurchaseFields s={s} set={set} askingPrice={askingPrice} arvNote={arvNote} monthsLabel="Sold after" monthsKey="flipMonths" />
          <FinanceFields s={s} set={set} />
          <fieldset className="space-y-5 border-t border-gray-200 pt-6">
            <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Selling it</legend>
            <PercentField
              label="Commission"
              value={s.sale.commissionPct}
              onChange={(n) => setSale({ commissionPct: n })}
              hint={`The site's planning figure (${SITE.assumedSellerCommissionRate}%). Commission is negotiable.`}
            />
            <MoneyField
              label="Other selling costs"
              value={s.sale.otherClosing}
              onChange={(n) => setSale({ otherClosing: n })}
              hint={<SourceHint a={ASSUMPTIONS.sellerOtherClosing} />}
            />
            <MoneyField label="Credits to the buyer" value={s.sale.sellerCredits} onChange={(n) => setSale({ sellerCredits: n })} />
          </fieldset>
        </div>

        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Profit</p>
          {noArv ? (
            <p className="mt-2 max-w-md text-sm text-gray-600">
              Enter an after-repair value — what the house would sell for once the work is done — to see the profit.
            </p>
          ) : (
            <>
              <p className={`numeral mt-2 text-4xl font-semibold sm:text-5xl ${r.profit < 0 ? 'text-red-700' : 'text-ink'}`}>{money(r.profit)}</p>
              <p className="mt-2 text-sm text-gray-600">
                On {formatPrice(Math.round(r.cashIn))} of your own money over {s.project.flipMonths} months.
              </p>
            </>
          )}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Stat label="Return on cash" value={noArv ? '—' : pct(r.roiPct)} tone={(r.roiPct ?? 0) < 0 ? 'bad' : 'ink'} note="Profit over the money you put in." />
            <Stat
              label="Annualised"
              value={noArv ? '—' : pct(r.annualisedPct)}
              tone={(r.annualisedPct ?? 0) < 0 ? 'bad' : 'ink'}
              note={`The same return as a yearly rate, over ${s.project.flipMonths} months.`}
            />
            <Stat
              label="70% rule"
              value={noArv ? '—' : formatPrice(Math.max(0, Math.round(r.mao70)))}
              tone={!noArv && s.price > r.mao70 ? 'bad' : 'ink'}
              note="A rule of thumb: 70% of the ARV less the renovation, as the most to pay. A check, not a calculation."
            />
            <Stat
              label="Profit margin"
              value={noArv || s.arv <= 0 ? '—' : `${((r.profit / s.arv) * 100).toFixed(1)}%`}
              note="Profit as a share of the sale price."
            />
          </dl>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">Where the money goes</h3>
          <dl className="mt-2 divide-y divide-gray-100 border-y border-gray-200">
            <Row label="Sale price" value={s.arv} strong />
            {r.costLines.map((l) => (
              <Row key={l.key} label={l.label} value={l.amount} minus />
            ))}
            <Row label="Profit" value={r.profit} strong signed />
          </dl>
          {r.loan && (
            <p className="numeral mt-3 text-xs leading-relaxed text-gray-500">
              Loan {formatPrice(Math.round(r.loan.loan))}: {formatPrice(Math.round(r.loan.atClose))} at closing and{' '}
              {formatPrice(Math.round(r.loan.holdback))} drawn as the work is done.
            </p>
          )}

          {!noArv && (
            <>
              <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">What moves it most</h3>
              <dl className="mt-2 divide-y divide-gray-100 border-y border-gray-200">
                {tweaks.map((t) => (
                  <div key={t.label} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                    <dt className="text-gray-600">{t.label}</dt>
                    <dd className={`numeral font-medium ${t.value < 0 ? 'text-red-700' : 'text-ink'}`}>
                      {money(t.value)} <span className="text-xs text-gray-500">({money(t.delta)})</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <p className="mt-6 text-xs leading-relaxed text-gray-500">
            Before selling, the house needs the fire department&rsquo;s smoke and carbon-monoxide certificate, and on
            septic a Title V inspection. Income tax on the profit is not modelled.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlipPanel;
