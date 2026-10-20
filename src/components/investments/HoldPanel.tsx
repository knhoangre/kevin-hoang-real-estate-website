import { useState } from 'react';
import { LABEL, MoneyField, NumberField, PercentField, Row, money, pct } from '@/components/calculator/fields';
import { SourceHint, Stat } from '@/components/investments/ui';
import { holdAnalysis } from '@/lib/investment';
import { ASSUMPTIONS, investorRate } from '@/lib/investmentAssumptions';
import type { IdxListing } from '@/lib/idxSearch';
import { formatPrice } from '@/lib/listings';
import { estimateInsurance } from '@/lib/mortgage';
import { describeRent, type ListingRent } from '@/lib/rentComps';
import { SITE } from '@/lib/siteConfig';

/**
 * Buy and hold: the operating statement of one home as a rental, and what it
 * does with a mortgage on it.
 *
 * Seeded once, when the page has the listing and the leases: the price, tax bill
 * and condo fee from the listing, the rent from leased rents, everything else
 * from the dated assumptions. From then on every number is the investor's —
 * nothing below re-seeds over something they typed.
 *
 * The statement is longer than the listing page's calculator on purpose: a
 * capital reserve, the owner's utilities and the leasing broker are real costs
 * of owning a rental in Massachusetts, and leaving them out is how a thin deal
 * looks like a good one. With all three at zero it is that calculator exactly
 * (investment-check.ts asserts it).
 */

export interface HoldSeed {
  listing: IdxListing;
  rent: ListingRent;
  /** Already cleaned: null when the listing's bill is missing or nonsense. */
  taxes: number | null;
  town: string;
}

const HoldPanel = ({ seed }: { seed: HoldSeed }) => {
  const { listing, rent } = seed;
  const isMulti = listing.prop_type === 'MF';
  const unitCount = isMulti ? rent.mix?.units ?? 2 : 1;
  const askingPrice = listing.list_price ?? 0;

  const [price, setPrice] = useState(askingPrice);
  const [liveInOne, setLiveInOne] = useState(false);
  const [downPct, setDownPct] = useState(ASSUMPTIONS.investorDownPct.value);
  const [ratePct, setRatePct] = useState(investorRate());
  const [termYears, setTermYears] = useState(30);
  const [pointsPct, setPointsPct] = useState(0);
  const [closingCosts, setClosingCosts] = useState(() =>
    Math.round((askingPrice * ASSUMPTIONS.buyerClosingPct.value) / 100)
  );
  const [upfrontRepairs, setUpfrontRepairs] = useState(0);

  const [unitRents, setUnitRents] = useState<number[]>(() =>
    Array.from({ length: unitCount }, (_, i) => rent.units[i]?.rent ?? 0)
  );
  const [otherIncome, setOtherIncome] = useState(0);
  const [vacancyPct, setVacancyPct] = useState(ASSUMPTIONS.vacancyPct.value);
  const [managementPct, setManagementPct] = useState(ASSUMPTIONS.managementPct.value);
  const [annualTaxes, setAnnualTaxes] = useState(seed.taxes ?? 0);
  const [annualInsurance, setAnnualInsurance] = useState(() =>
    Math.round(estimateInsurance(askingPrice, listing.prop_type) * ASSUMPTIONS.landlordInsuranceFactor.value)
  );
  const [monthlyHoa, setMonthlyHoa] = useState(listing.hoa_fee ?? 0);
  const [annualMaintenance, setAnnualMaintenance] = useState(() =>
    Math.round((askingPrice * ASSUMPTIONS.maintenancePctOfPrice.value) / 100)
  );
  const [capexPct, setCapexPct] = useState(ASSUMPTIONS.capexPctOfRent.value);
  const [ownerUtilities, setOwnerUtilities] = useState(isMulti ? ASSUMPTIONS.ownerUtilitiesPerUnit.value * unitCount : 0);
  const [leasingFeeMonths, setLeasingFeeMonths] = useState(ASSUMPTIONS.leasingFeeMonths.value);
  const [turnovers, setTurnovers] = useState(ASSUMPTIONS.turnoversPerYear.value);

  /*
   * LIVING IN ONE UNIT. The unit the owner lives in earns nothing, and the loan
   * becomes an owner-occupied one: 5% down and the ordinary rate. Switching it
   * off restores the investor's terms. The first unit is the one assumed lived
   * in; its rent field says so.
   */
  const toggleLiveIn = (on: boolean) => {
    setLiveInOne(on);
    setDownPct(on ? ASSUMPTIONS.ownerOccupiedDownPct.value : ASSUMPTIONS.investorDownPct.value);
    setRatePct(on ? SITE.assumedMortgageRate : investorRate());
  };

  const grossRent = unitRents.reduce((s, r, i) => s + (liveInOne && i === 0 ? 0 : r), 0);

  const result = holdAnalysis(
    {
      grossMonthlyRent: grossRent,
      otherMonthlyIncome: otherIncome,
      vacancyPct,
      managementPct,
      annualTaxes,
      annualInsurance,
      monthlyHoa,
      annualMaintenance,
      capexPct,
      monthlyOwnerUtilities: ownerUtilities,
      leasingFeeMonths,
      turnoversPerYear: turnovers,
      otherAnnual: 0,
    },
    { price, downPct, ratePct, termYears, pmiRatePct: SITE.assumedPmiRate, pointsPct },
    { closingCosts, upfrontRepairs }
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
        {formatPrice(est.rent)} is the {describeRent(est, { town: seed.town, zip: listing.zip })}; the middle half
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
            onChange={setPrice}
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
            value={downPct}
            onChange={setDownPct}
            hint={
              <SourceHint a={liveInOne ? ASSUMPTIONS.ownerOccupiedDownPct : ASSUMPTIONS.investorDownPct}>
                {formatPrice(Math.round(f.downPayment))}.
              </SourceHint>
            }
          />
          <PercentField
            label="Interest rate"
            value={ratePct}
            onChange={setRatePct}
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
                  onClick={() => setTermYears(years)}
                  aria-pressed={termYears === years}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    termYears === years ? 'bg-ink-deep text-white' : 'border border-gray-300 text-gray-700 hover:border-champagne-ink'
                  }`}
                >
                  {years} years
                </button>
              ))}
            </div>
          </fieldset>
          <PercentField label="Points" value={pointsPct} onChange={setPointsPct} hint="Paid to the lender at closing, as a share of the loan." />
          <MoneyField label="Closing costs" value={closingCosts} onChange={setClosingCosts} hint={<SourceHint a={ASSUMPTIONS.buyerClosingPct} />} />
          <MoneyField
            label="Work before the first tenant"
            value={upfrontRepairs}
            onChange={setUpfrontRepairs}
            hint="Paint, repairs, deleading — money in before any rent comes back."
          />
        </fieldset>

        <fieldset className="space-y-5 border-t border-gray-200 pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Rent</legend>
          {unitRents.map((value, i) => {
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
                onChange={(n) => setUnitRents((all) => all.map((r, j) => (j === i ? n : r)))}
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
          <MoneyField label="Other monthly income" value={otherIncome} onChange={setOtherIncome} hint="Parking, laundry, storage." />
          <PercentField label="Vacancy" value={vacancyPct} onChange={setVacancyPct} hint={<SourceHint a={ASSUMPTIONS.vacancyPct} />} />
        </fieldset>

        <fieldset className="space-y-5 border-t border-gray-200 pt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Expenses</legend>
          <MoneyField
            label="Property taxes, per year"
            value={annualTaxes}
            onChange={setAnnualTaxes}
            hint={
              seed.taxes !== null
                ? `From the listing${listing.tax_year ? `, the ${listing.tax_year} bill` : ''}. The seller’s bill may include a residential exemption an investor would not get.`
                : 'The listing has no tax bill. Enter it from the town’s assessor.'
            }
          />
          <MoneyField
            label="Insurance, per year"
            value={annualInsurance}
            onChange={setAnnualInsurance}
            hint={<SourceHint a={ASSUMPTIONS.landlordInsuranceFactor} />}
          />
          {hasAssociation && (
            <MoneyField
              label="Condo / HOA fee, per month"
              value={monthlyHoa}
              onChange={setMonthlyHoa}
              hint={listing.hoa_fee !== null ? 'From the listing.' : 'The listing says there is a fee but not what it is. Ask for it.'}
            />
          )}
          <MoneyField
            label="Maintenance, per year"
            value={annualMaintenance}
            onChange={setAnnualMaintenance}
            hint={<SourceHint a={ASSUMPTIONS.maintenancePctOfPrice} />}
          />
          <PercentField label="Capital reserve" value={capexPct} onChange={setCapexPct} unit="% of rent" hint={<SourceHint a={ASSUMPTIONS.capexPctOfRent} />} />
          <PercentField label="Property management" value={managementPct} onChange={setManagementPct} unit="% of rent" hint={<SourceHint a={ASSUMPTIONS.managementPct} />} />
          <MoneyField
            label="Utilities you pay, per month"
            value={ownerUtilities}
            onChange={setOwnerUtilities}
            hint={isMulti ? <SourceHint a={ASSUMPTIONS.ownerUtilitiesPerUnit} /> : 'Usually the tenant’s in a single home. Add anything you will pay.'}
          />
          <NumberField
            label="Leasing fee"
            value={leasingFeeMonths}
            onChange={setLeasingFeeMonths}
            unit="months' rent"
            hint={<SourceHint a={ASSUMPTIONS.leasingFeeMonths} />}
          />
          <NumberField
            label="New leases"
            value={turnovers}
            onChange={setTurnovers}
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
          <Row label={`Vacancy (${vacancyPct}%)`} value={s.vacancyLoss} minus />
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
          <Row label={`Down payment (${downPct}%)`} value={f.downPayment} />
          <Row label="Closing costs" value={closingCosts} />
          <Row label="Points" value={f.points} />
          <Row label="Work before the first tenant" value={upfrontRepairs} />
          <Row label="Total" value={result.cashInvested} strong />
        </dl>
        <p className="numeral mt-3 text-xs leading-relaxed text-gray-500">
          {result.grm !== null && <>Price is {result.grm.toFixed(1)} years of gross rent. </>}
          {result.rentToPricePct !== null && <>A month&rsquo;s rent is {result.rentToPricePct.toFixed(2)}% of the price. </>}
          Loan {formatPrice(Math.round(f.loan))} over {termYears} years.
        </p>
      </div>
    </div>
  );
};

export default HoldPanel;
