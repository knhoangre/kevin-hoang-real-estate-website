import type { ReactNode } from 'react';
import { PercentField, Row, money, pct } from '@/components/calculator/fields';
import type { SetScenario } from '@/components/investments/HoldPanel';
import { FinanceFields, PurchaseFields, Toggle } from '@/components/investments/ProjectFields';
import RehabScope from '@/components/investments/RehabScope';
import { SourceHint, Stat } from '@/components/investments/ui';
import { brrrr } from '@/lib/investment';
import { ASSUMPTIONS } from '@/lib/investmentAssumptions';
import { formatPrice } from '@/lib/listings';
import type { CostItem } from '@/lib/rehabCosts';
import { flipInputs, operatingFrom, type Scenario } from '@/lib/scenario';

/**
 * Buy, Renovate, Rent, Refinance, Repeat — the "repeat" being whatever cash
 * the refinance hands back.
 *
 * The refinance is where BRRRR plans go wrong, so it follows Fannie Mae's
 * rules rather than a flat percentage: six months on title for a cash-out, a
 * purchase loan twelve months old before it can be cashed out, delayed
 * financing for a cash buyer, and the 70% ceiling on two to four units. Which
 * one applies is stated in words beside the number. A DSCR loan — a rental
 * loan qualified on the rent — is offered for the lender-by-lender case.
 *
 * The rent and the operating costs after the refinance are the rental tab's
 * (operatingFrom, in scenario.ts), so the two tabs cannot disagree about the
 * same building.
 */
const BrrrrPanel = ({
  s,
  set,
  book,
  askingPrice,
  arvNote,
  units,
}: {
  s: Scenario;
  set: SetScenario;
  book: CostItem[];
  askingPrice: number;
  arvNote: ReactNode;
  units: number;
}) => {
  const setRefi = (patch: Partial<Scenario['refi']>) => set((cur) => ({ refi: { ...cur.refi, ...patch } }));
  const project = { ...flipInputs(s, book), holdMonths: s.project.refiMonths };
  const r = brrrr(
    project,
    {
      program: s.refi.program,
      units,
      monthsOnTitle: s.project.refiMonths,
      acquisition: s.project.finance,
      ltvPct: s.refi.ltvPct,
      ratePct: s.refi.ratePct,
      termYears: s.refi.termYears,
      closingPct: s.refi.closingPct,
      rules: { titleMonths: ASSUMPTIONS.refiTitleMonths.value, noteMonths: ASSUMPTIONS.refiNoteMonths.value },
    },
    operatingFrom(s)
  );
  const noArv = s.arv <= 0;
  const allBack = r.cashLeftIn <= 0;
  const gross = s.rents.reduce((sum, x) => sum + x, 0);
  const ltvSource = units > 1 ? ASSUMPTIONS.refiLtvMultiUnitPct : ASSUMPTIONS.refiLtvOneUnitPct;

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-gray-200 bg-bone p-6 sm:p-7">
        <RehabScope scope={s.scope} book={book} onChange={(scope) => set({ scope })} groups={['Kitchen and bath', 'Rooms and finishes', 'Systems', 'Outside', 'Required by law']} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-8 self-start rounded-2xl border border-gray-200 bg-bone p-6 sm:p-7">
          <PurchaseFields s={s} set={set} askingPrice={askingPrice} arvNote={arvNote} monthsLabel="Refinanced after" monthsKey="refiMonths" />
          <FinanceFields s={s} set={set} />
          <fieldset className="space-y-5 border-t border-gray-200 pt-6">
            <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">The refinance</legend>
            <Toggle
              label="Loan"
              value={s.refi.program}
              onChange={(v) => setRefi({ program: v, ltvPct: v === 'dscr' ? 75 : ltvSource.value })}
              options={[
                { id: 'conventional', label: 'Conventional' },
                { id: 'dscr', label: 'Rental (DSCR)' },
              ]}
            />
            <PercentField
              label="Loan-to-value"
              value={s.refi.ltvPct}
              onChange={(n) => setRefi({ ltvPct: n })}
              hint={
                s.refi.program === 'conventional' ? (
                  <SourceHint a={ltvSource} />
                ) : (
                  'A DSCR lender sets its own limit, often 70–80%, qualified on the rent rather than your income.'
                )
              }
            />
            <PercentField label="Interest rate" value={s.refi.ratePct} onChange={(n) => setRefi({ ratePct: n })} hint={<SourceHint a={ASSUMPTIONS.investorRatePremium} />} />
            <PercentField label="Refinance costs" value={s.refi.closingPct} onChange={(n) => setRefi({ closingPct: n })} unit="% of the loan" hint={<SourceHint a={ASSUMPTIONS.refiClosingPct} />} />
            <p className="text-xs leading-relaxed text-gray-500">
              Rent after the work: {formatPrice(gross)} a month, with the expenses from the rental tab. Change them there.
            </p>
          </fieldset>
        </div>

        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Left in the deal after the refinance</p>
          {noArv ? (
            <p className="mt-2 max-w-md text-sm text-gray-600">
              Enter an after-repair value — what a lender&rsquo;s appraiser would put on the finished house — to see the
              refinance.
            </p>
          ) : (
            <>
              <p className="numeral mt-2 text-4xl font-semibold text-ink sm:text-5xl">
                {allBack ? 'All of it back' : money(r.cashLeftIn)}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {allBack
                  ? `The refinance returns every dollar put in${r.cashLeftIn < 0 ? `, and ${formatPrice(Math.round(-r.cashLeftIn))} more` : ''}.`
                  : `Of ${formatPrice(Math.round(r.cashIn))} put in through the renovation.`}
              </p>
              <p className="mt-4 rounded-xl border border-gray-200 bg-bone p-4 text-sm leading-relaxed text-gray-700">{r.refi.reason}</p>
            </>
          )}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Stat
              label="Cash flow after"
              value={noArv ? '—' : `${money(r.after.monthlyCashFlow)}/mo`}
              tone={r.after.monthlyCashFlow < 0 ? 'bad' : 'ink'}
              note="Rent less every expense and the new mortgage."
            />
            <Stat
              label="Cash-on-cash after"
              value={noArv ? '—' : r.cashOnCashAfter === null ? '∞' : pct(r.cashOnCashAfter)}
              note={r.cashOnCashAfter === null ? 'No cash left in, so any cash flow is return on nothing.' : 'A year of cash flow over the cash left in.'}
            />
            <Stat label="Equity after" value={noArv ? '—' : formatPrice(Math.round(r.equityAfter))} note="The after-repair value less the new loan." />
            <Stat
              label="Debt coverage"
              value={noArv || r.after.dscr === null ? '—' : r.after.dscr.toFixed(2)}
              tone={r.after.dscr !== null && r.after.dscr < 1 ? 'bad' : 'ink'}
              note="NOI over the new payment. DSCR lenders usually want 1.0–1.25."
            />
          </dl>

          {!noArv && (
            <>
              <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">The money</h3>
              <dl className="mt-2 divide-y divide-gray-100 border-y border-gray-200">
                <Row label="Your cash in, through the renovation" value={r.cashIn} strong />
                <Row label="New loan" value={r.refi.newLoan} />
                {r.flip.loan && <Row label="Pays off the purchase loan" value={r.flip.loan.loan} minus />}
                <Row label="Refinance costs" value={r.refi.closingCosts} minus />
                <Row label="Cash back to you" value={r.refi.cashToBorrower} signed />
                <Row label="Left in the deal" value={Math.max(0, r.cashLeftIn)} strong />
              </dl>
            </>
          )}
          <p className="mt-6 text-xs leading-relaxed text-gray-500">
            The new loan is sized on an appraisal of the finished house, which is the lender&rsquo;s and may not be the
            after-repair value above. Lenders also set their own rules on top of Fannie Mae&rsquo;s.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrrrrPanel;
