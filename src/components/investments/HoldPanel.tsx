import { LABEL, MoneyField, NumberField, PercentField, Row, money, pct } from '@/components/calculator/fields';
import { SourceHint, Stat } from '@/components/investments/ui';
import { holdAnalysis } from '@/lib/investment';
import { ASSUMPTIONS, investorRate } from '@/lib/investmentAssumptions';
import type { IdxListing } from '@/lib/idxSearch';
import { formatPrice } from '@/lib/listings';
import { describeRent, type ListingRent } from '@/lib/rentComps';
import type { Scenario } from '@/lib/scenario';
import { SITE } from '@/lib/siteConfig';
import { pill } from '@/lib/pill';

/**
 * Buy and hold: the operating statement of one home as a rental, and what it
 * does with a mortgage on it.
 *
 * A view of the shared Scenario (scenario.ts): the deal view seeds it once —
 * the price, tax bill and condo fee from the listing, the rent from leased
 * rents, everything else from the dated assumptions — and every tab reads and
 * writes the same document, so a price typed here is the flip's price too.
 *
 * The statement is longer than the listing page's calculator on purpose: a
 * capital reserve, the owner's utilities and the leasing broker are real costs
 * of owning a rental in Massachusetts, and leaving them out is how a thin deal
 * looks like a good one. With all three at zero it is that calculator exactly
 * (investment-check.ts asserts it).
 */

export interface HoldContext {
  listing: IdxListing;
  rent: ListingRent;
  /** The listing's own tax bill, cleaned; null when it had none worth using. */
  listedTaxes: number | null;
  town: string;
}

export type SetScenario = (patch: Partial<Scenario> | ((s: Scenario) => Partial<Scenario>)) => void;

const HoldPanel = ({ ctx, s: sc, set }: { ctx: HoldContext; s: Scenario; set: SetScenario }) => {
  const { listing, rent } = ctx;
  const isMulti = listing.prop_type === 'MF';
  const askingPrice = listing.list_price ?? 0;
  const { price, liveInOne, loan } = sc;

  /*
   * LIVING IN ONE UNIT. The unit the owner lives in earns nothing, and the loan
   * becomes an owner-occupied one: 5% down and the ordinary rate. Switching it
   * off restores the investor's terms. The first unit is the one assumed lived
   * in; its rent field says so.
   */
  const toggleLiveIn = (on: boolean) =>
    set({
      liveInOne: on,
      loan: {
        ...loan,
        downPct: on ? ASSUMPTIONS.ownerOccupiedDownPct.value : ASSUMPTIONS.investorDownPct.value,
        ratePct: on ? SITE.assumedMortgageRate : investorRate(),
      },
    });
  const setLoan = (patch: Partial<Scenario['loan']>) => set((cur) => ({ loan: { ...cur.loan, ...patch } }));

  const grossRent = sc.rents.reduce((sum, r, i) => sum + (liveInOne && i === 0 ? 0 : r), 0);

  const result = holdAnalysis(
    {
      grossMonthlyRent: grossRent,
      otherMonthlyIncome: sc.otherIncome,
      vacancyPct: sc.vacancyPct,
      managementPct: sc.managementPct,
      annualTaxes: sc.annualTaxes,
      annualInsurance: sc.annualInsurance,
      monthlyHoa: sc.monthlyHoa,
      annualMaintenance: sc.annualMaintenance,
      capexPct: sc.capexPct,
      monthlyOwnerUtilities: sc.ownerUtilities,
      leasingFeeMonths: sc.leasingFeeMonths,
      turnoversPerYear: sc.turnovers,
      otherAnnual: 0,
    },
    { price, downPct: loan.downPct, ratePct: loan.ratePct, termYears: loan.termYears, pmiRatePct: SITE.assumedPmiRate, pointsPct: loan.pointsPct },
    { closingCosts: sc.closingCosts, upfrontRepairs: sc.upfrontRepairs }
  );
  const s = result.statement;
  const f = result.financing;
  const hasAssociation = Boolean(listing.hoa) || (listing.hoa_fee ?? 0) > 0;

  const rentHint = (i: number) => {
    const est = rent.units[i];
    if (liveInOne && i === 0) return 'You live here, so it earns nothing in this scenario.';
    if (!est) return 'Not enough leases of this kind in town to estimate it. Enter the rent you expect.';
    return (
      <>
        {formatPrice(est.rent)} is the {describeRent(est, { town: ctx.town, zip: listing.zip })}; the middle half
        leased for {formatPrice(est.low)}–{formatPrice(est.high)}. Not adjusted for when each lease was signed.
      </>
    );
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* ---------------- INPUTS ---------------- */}
      <div className="space-y-8 self-start rounded-2xl border border-gray-200 bg-bone p-6 sm:p-7">
        <fieldset className="space-y-5">
          <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Purchase and loan</legend>
          <MoneyField
            label="Purchase price"
            value={price}
            onChange={(n) => set({ price: n })}
            hint={price === askingPrice ? 'The asking price. Try your offer.' : `Asking is ${formatPrice(askingPrice)}.`}
          />
          {isMulti && (
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={liveInOne}
                onChange={(e) => toggleLiveIn(e.target.checked)}
                className="mt-1 h-4 w-4 accent-champagne-ink"
              />
              <span>
                I&rsquo;ll live in one unit.{' '}
                <span className="text-xs text-gray-500">
                  <SourceHint a={ASSUMPTIONS.ownerOccupiedDownPct} />
                </span>
              </span>
            </label>
          )}
          <PercentField
            label="Down payment"
            value={loan.downPct}
            onChange={(n) => setLoan({ downPct: n })}
            hint={
              <SourceHint a={liveInOne ? ASSUMPTIONS.ownerOccupiedDownPct : ASSUMPTIONS.investorDownPct}>
                {formatPrice(Math.round(f.downPayment))}.
              </SourceHint>
            }
          />
          <PercentField
            label="Interest rate"
            value={loan.ratePct}
            onChange={(n) => setLoan({ ratePct: n })}
            hint={
              liveInOne ? (
                `The site's assumed owner-occupied rate, as of ${SITE.assumedMortgageRateAsOf}.`
              ) : (
                <SourceHint a={ASSUMPTIONS.investorRatePremium}>
                  {SITE.assumedMortgageRate}% (as of {SITE.assumedMortgageRateAsOf}) plus{' '}
                  {ASSUMPTIONS.investorRatePremium.value}.
                </SourceHint>
              )
            }
          />
          <fieldset>
            <legend className={LABEL}>Term</legend>
            <div className="mt-2 flex gap-2">
              {[30, 15].map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => setLoan({ termYears: years })}
                  aria-pressed={loan.termYears === years}
                  className={pill(loan.termYears === years ? 'ink' : 'outline', 'sm', 'flex-1 px-4 py-2')}
                >
                  {years} years
                </button>
              ))}
            </div>
          </fieldset>
          <PercentField label="Points" value={loan.pointsPct} onChange={(n) => setLoan({ pointsPct: n })} hint="Paid to the lender at closing, as a share of the loan." />
          <MoneyField label="Closing costs" value={sc.closingCosts} onChange={(n) => set({ closingCosts: n })} hint={<SourceHint a={ASSUMPTIONS.buyerClosingPct} />} />
          <MoneyField
            label="Work before the first tenant"
            value={sc.upfrontRepairs}
            onChange={(n) => set({ upfrontRepairs: n })}
            hint="Paint, repairs, deleading — money in before any rent comes back."
          />
        </fieldset>

        <fieldset className="space-y-5 border-t border-gray-200 pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Rent</legend>
          {sc.rents.map((value, i) => {
            const beds = rent.mix?.bedsPerUnit[i] ?? (isMulti ? null : listing.bedrooms);
            return (
              <MoneyField
                key={i}
                label={
                  isMulti
                    ? `Unit ${i + 1}${beds !== null && beds !== undefined ? ` · ${beds} bed` : ''} — monthly rent`
                    : 'Monthly rent'
                }
                value={value}
                onChange={(n) => set((cur) => ({ rents: cur.rents.map((r, j) => (j === i ? n : r)) }))}
                hint={rentHint(i)}
              />
            );
          })}
          {isMulti && rent.mix && (
            <p className="text-xs leading-relaxed text-gray-500">
              The feed gives the building&rsquo;s {listing.bedrooms ?? 'total'} bedrooms, not each unit&rsquo;s, so they are split evenly here.
              {!rent.mix.agrees && ` The listing also names ${listing.num_units} units where its type says ${rent.mix.units}; check which is right.`}{' '}
              Correct any unit from the listing&rsquo;s photos and remarks.
            </p>
          )}
          <MoneyField label="Other monthly income" value={sc.otherIncome} onChange={(n) => set({ otherIncome: n })} hint="Parking, laundry, storage." />
          <PercentField label="Vacancy" value={sc.vacancyPct} onChange={(n) => set({ vacancyPct: n })} hint={<SourceHint a={ASSUMPTIONS.vacancyPct} />} />
        </fieldset>

        <fieldset className="space-y-5 border-t border-gray-200 pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Expenses</legend>
          <MoneyField
            label="Property taxes, per year"
            value={sc.annualTaxes}
            onChange={(n) => set({ annualTaxes: n })}
            hint={
              ctx.listedTaxes !== null
                ? `From the listing${listing.tax_year ? `, the ${listing.tax_year} bill` : ''}. The seller’s bill may include a residential exemption an investor would not get.`
                : 'The listing has no tax bill. Enter it from the town’s assessor.'
            }
          />
          <MoneyField
            label="Insurance, per year"
            value={sc.annualInsurance}
            onChange={(n) => set({ annualInsurance: n })}
            hint={<SourceHint a={ASSUMPTIONS.landlordInsuranceFactor} />}
          />
          {hasAssociation && (
            <MoneyField
              label="Condo / HOA fee, per month"
              value={sc.monthlyHoa}
              onChange={(n) => set({ monthlyHoa: n })}
              hint={listing.hoa_fee !== null ? 'From the listing.' : 'The listing says there is a fee but not what it is. Ask for it.'}
            />
          )}
          <MoneyField
            label="Maintenance, per year"
            value={sc.annualMaintenance}
            onChange={(n) => set({ annualMaintenance: n })}
            hint={<SourceHint a={ASSUMPTIONS.maintenancePctOfPrice} />}
          />
          <PercentField label="Capital reserve" value={sc.capexPct} onChange={(n) => set({ capexPct: n })} unit="% of rent" hint={<SourceHint a={ASSUMPTIONS.capexPctOfRent} />} />
          <PercentField label="Property management" value={sc.managementPct} onChange={(n) => set({ managementPct: n })} unit="% of rent" hint={<SourceHint a={ASSUMPTIONS.managementPct} />} />
          <MoneyField
            label="Utilities you pay, per month"
            value={sc.ownerUtilities}
            onChange={(n) => set({ ownerUtilities: n })}
            hint={isMulti ? <SourceHint a={ASSUMPTIONS.ownerUtilitiesPerUnit} /> : 'Usually the tenant’s in a single home. Add anything you will pay.'}
          />
          <NumberField
            label="Leasing fee"
            value={sc.leasingFeeMonths}
            onChange={(n) => set({ leasingFeeMonths: n })}
            unit="months' rent"
            hint={<SourceHint a={ASSUMPTIONS.leasingFeeMonths} />}
          />
          <NumberField
            label="New leases"
            value={sc.turnovers}
            onChange={(n) => set({ turnovers: n })}
            unit="a year"
            hint={<SourceHint a={ASSUMPTIONS.turnoversPerYear} />}
          />
        </fieldset>

        {/* On a phone the results are below this whole form, so the answer
            rides along at the bottom of the screen while the inputs change. */}
        <div
          className="numeral sticky bottom-0 -mx-6 -mb-6 flex items-baseline justify-between gap-4 rounded-b-2xl border-t border-gray-200 bg-white/95 px-6 py-3 backdrop-blur sm:-mx-7 sm:-mb-7 sm:px-7 lg:hidden"
          aria-live="polite"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Cash flow</span>
          <span className={`text-lg font-semibold ${result.monthlyCashFlow < 0 ? 'text-red-700' : 'text-ink'}`}>
            {money(result.monthlyCashFlow)}/mo
            <span className="ml-2 text-xs font-medium text-gray-500">cap {pct(result.capRate)}</span>
          </span>
        </div>
      </div>

      {/* ---------------- RESULTS ---------------- */}
      <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Cash flow</p>
        <p className={`numeral mt-2 text-4xl font-semibold sm:text-5xl ${result.monthlyCashFlow < 0 ? 'text-red-700' : 'text-ink'}`}>
          {money(result.monthlyCashFlow)}
          <span className="text-xl font-medium text-gray-500"> /month</span>
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {money(result.annualCashFlow)} a year
          {result.monthlyCashFlow < 0 ? ', paid in by you on top of the mortgage.' : ', after every cost and the mortgage.'}
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Stat label="Cap rate" value={pct(result.capRate)} note="A year of NOI over the price. Describes the building, not the loan." />
          <Stat
            label="Cash-on-cash"
            value={pct(result.cashOnCash)}
            tone={(result.cashOnCash ?? 0) < 0 ? 'bad' : 'ink'}
            note={`A year of cash flow over every dollar you put in: ${formatPrice(Math.round(result.cashInvested))}.`}
          />
          <Stat
            label="Debt coverage"
            value={result.dscr === null ? '—' : result.dscr.toFixed(2)}
            tone={result.dscr !== null && result.dscr < 1 ? 'bad' : 'ink'}
            note="NOI over the mortgage payment. Under 1.00 the rent does not cover the loan; rental lenders look at this."
          />
          <Stat
            label="Break-even occupancy"
            value={result.breakEvenOccupancyPct === null ? '—' : `${Math.round(result.breakEvenOccupancyPct)}%`}
            tone={(result.breakEvenOccupancyPct ?? 0) > 100 ? 'bad' : 'ink'}
            note="The share of the rent that must come in to pay every cost. Over 100% it cannot."
          />
        </dl>

        <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">Monthly statement</h3>
        <dl className="mt-2 divide-y divide-gray-100 border-y border-gray-200">
          <Row label="Gross rent" value={s.gross} strong />
          <Row label={`Vacancy (${sc.vacancyPct}%)`} value={s.vacancyLoss} minus />
          <Row label="Collected" value={s.effective} />
          {s.lines.map((l) => (
            <Row key={l.key} label={l.label} value={l.monthly} minus />
          ))}
          <Row label="Net operating income" value={s.noi} strong signed />
          <Row label="Mortgage, principal and interest" value={f.monthlyPI} minus />
          <Row label="Mortgage insurance" value={f.monthlyPmi} minus />
          <Row label="Cash flow" value={result.monthlyCashFlow} strong signed />
        </dl>

        <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">Cash in</h3>
        <dl className="mt-2 divide-y divide-gray-100 border-y border-gray-200">
          <Row label={`Down payment (${loan.downPct}%)`} value={f.downPayment} />
          <Row label="Closing costs" value={sc.closingCosts} />
          <Row label="Points" value={f.points} />
          <Row label="Work before the first tenant" value={sc.upfrontRepairs} />
          <Row label="Total" value={result.cashInvested} strong />
        </dl>
        <p className="numeral mt-3 text-xs leading-relaxed text-gray-500">
          {result.grm !== null && <>Price is {result.grm.toFixed(1)} years of gross rent. </>}
          {result.rentToPricePct !== null && <>A month&rsquo;s rent is {result.rentToPricePct.toFixed(2)}% of the price. </>}
          Loan {formatPrice(Math.round(f.loan))} over {loan.termYears} years.
        </p>
      </div>
    </div>
  );
};

export default HoldPanel;
