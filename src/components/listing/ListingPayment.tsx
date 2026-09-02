import { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { formatPrice } from '@/lib/listings';
import {
  INSURANCE,
  PMI_LTV_THRESHOLD,
  canBeInvestment,
  estimateInsurance,
  investmentReturns,
  loanSummary,
  monthlyPayment,
  type PaymentInputs,
} from '@/lib/mortgage';
import { SITE } from '@/lib/siteConfig';
import { headlinePrice, medianAskingRent, type IdxListing } from '@/lib/idxSearch';

/**
 * "What would this cost me a month", answered with THIS listing's numbers —
 * and, for anyone buying it to rent out, what it would return.
 *
 * A FULL-WIDTH SECTION, not a sidebar card. It began as one, sharing the aside
 * with the call and text buttons, and the constraint that made it wrong was
 * physical: 320px fits a total and a column of inputs and nothing else. The
 * loan summary, the split, the down-payment scenarios and the whole investment
 * panel had nowhere to go. The sidebar is for the two things that are the same
 * on every listing (call, text); this is the part that is about this house.
 *
 * Deliberately NOT <RealEstateCalculators> embedded. That is a page-width,
 * three-tab, slider-driven component whose sub-calculators are module-private,
 * take no props and open at $500,000 / 20% / 5.5% regardless of what the reader
 * is looking at. The arithmetic is shared instead (@/lib/mortgage); only the UI
 * is new. Its rental tab is where the investment maths came from — and where
 * the cap rate was missing, because that tab reports cash-on-cash without it.
 *
 * WHAT IS AND IS NOT KNOWN, because the distinction is the whole reason this is
 * safe to show about another brokerage's listing:
 *
 *   From the feed  - price, annual taxes (with their tax year), HOA fee.
 *   Derived, cited - insurance (Massachusetts averages, see @/lib/mortgage),
 *                    starting rent (median asking rent for comparable units in
 *                    the same town, from the rental feed).
 *   Assumed        - rate, PMI rate, down payment, term, vacancy, maintenance,
 *                    management. Every one is an editable input carrying a
 *                    visible note, and the defaults are dated in siteConfig.
 *   Not modelled   - escrow, closing costs, depreciation, appreciation, and any
 *                    rate the reader would actually be quoted.
 */

/** A dollar input that shows thousands separators without fighting the caret. */
const MoneyField = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: React.ReactNode;
  value: number;
  onChange: (n: number) => void;
}) => (
  <label className="block">
    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
      {label}
    </span>
    <span className="mt-1 flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-champagne-ink">
      <span className="pl-3 text-sm text-gray-500">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value.toLocaleString()}
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
 * A percentage input.
 *
 * Holds the raw text alongside the number so a half-typed "6." survives the
 * keystroke instead of snapping back to "6" and stranding the caret.
 */
const PercentField = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: React.ReactNode;
  value: number;
  onChange: (n: number) => void;
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
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </span>
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
        <span className="pr-3 text-sm text-gray-500">%</span>
      </span>
      {hint && <span className="mt-1 block text-xs leading-relaxed text-gray-500">{hint}</span>}
    </label>
  );
};

/**
 * The parts of the monthly figure, as one bar.
 *
 * A tonal ramp rather than five hues. The design system allows champagne as a
 * NON-TEXT MARK on a light surface — which a chart segment is — but it has no
 * third or fourth accent, and inventing them here would start a third palette
 * on a site that was unified out of two. The ramp also encodes the thing worth
 * seeing at a glance: principal and interest is the dark mass, and everything
 * else is a sliver beside it.
 */
const SEGMENTS = [
  { key: 'principalAndInterest', label: 'Principal & interest', className: 'bg-ink-deep' },
  { key: 'taxes', label: 'Taxes', className: 'bg-champagne' },
  { key: 'insurance', label: 'Insurance', className: 'bg-champagne-ink' },
  { key: 'hoa', label: 'HOA', className: 'bg-gray-300' },
  { key: 'pmi', label: 'Mortgage insurance', className: 'bg-gray-500' },
] as const;

const ListingPayment = ({ listing }: { listing: IdxListing }) => {
  const listedPrice = headlinePrice(listing) ?? 0;

  /*
   * THE PRICE IS AN INPUT, seeded from the listing rather than fixed to it.
   *
   * Every other figure here is something the reader adjusts, and the price was
   * the one number they could not — which is backwards, because it is the
   * number they are most likely to want to change. Anyone weighing an offer is
   * asking what it costs at their number, not at the seller's.
   */
  const [price, setPrice] = useState(listedPrice);

  /*
   * DOWN PAYMENT: ONE VALUE, TWO WAYS OF SAYING IT.
   *
   * Held in dollars, because that is what the arithmetic needs and what a
   * lender asks for. The percentage is derived on the way out and converted on
   * the way in, so the two can never disagree — which is the failure mode of
   * keeping both in state, and the one the /calculator component has: it
   * stores `downPayment` and `downPaymentPercent` separately and has four
   * handlers whose job is to keep them in step.
   */
  const [downMode, setDownMode] = useState<'percent' | 'amount'>('percent');
  const [downPayment, setDownPayment] = useState(() => Math.round(listedPrice * 0.2));

  const [rate, setRate] = useState(SITE.assumedMortgageRate);
  const [termYears, setTermYears] = useState(30);
  const [pmiRate, setPmiRate] = useState(SITE.assumedPmiRate);
  const [annualTaxes, setAnnualTaxes] = useState(listing.taxes ?? 0);
  const [annualInsurance, setAnnualInsurance] = useState(() =>
    estimateInsurance(listedPrice, listing.prop_type)
  );

  /*
   * HOA_FEE IS TREATED AS MONTHLY, AND THE LABEL SAYS SO.
   *
   * MLS PIN publishes the condo/association fee as a monthly figure, and the
   * live data agrees — condo fees cluster between $300 and $450 — but the IDX
   * export carries no period alongside the number, so this cannot be verified
   * from the data itself. Reading an annual fee as monthly would overstate a
   * condo's carrying cost twelvefold. Naming the period on the input is what
   * makes that recoverable: a reader whose fee is billed yearly can see the
   * assumption and correct it in place.
   */
  const [monthlyHoa, setMonthlyHoa] = useState(listing.hoa_fee ?? 0);

  const inputs: PaymentInputs = {
    price,
    downPayment,
    rate,
    termYears,
    annualTaxes,
    annualInsurance,
    monthlyHoa,
    pmiRate,
  };

  const b = monthlyPayment(inputs);
  const loan = loanSummary(inputs);
  const downPercent = price > 0 ? (downPayment / price) * 100 : 0;
  const roundedDownPercent = Math.round(downPercent);

  /*
   * What a different down payment would do — the question that actually decides
   * whether someone can buy this house. Computed through the same function as
   * the headline, so a scenario can never disagree with the number above it,
   * and PMI now switches itself on inside those below 20% rather than being
   * disclaimed underneath them.
   */
  const scenarios = [5, 10, 20].map((percent) => ({
    percent,
    down: Math.round((price * percent) / 100),
    total: monthlyPayment({ ...inputs, downPayment: (price * percent) / 100 }).total,
  }));

  // ---- Investment view -----------------------------------------------------

  const [view, setView] = useState<'live' | 'invest'>('live');
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [rentSource, setRentSource] = useState<{ rent: number; sampleSize: number } | null>(
    null
  );
  const [vacancyRate, setVacancyRate] = useState(5);
  const [managementRate, setManagementRate] = useState(10);
  /*
   * Maintenance at 1% of price a year — the conventional planning figure, and
   * flagged as one. It is a reserve rather than a bill, so any specific number
   * would be false precision; what matters is that it is not zero, because a
   * cash-flow model with no maintenance line is the classic way a bad deal
   * looks like a good one.
   */
  const [annualMaintenance, setAnnualMaintenance] = useState(() =>
    Math.round(listedPrice * 0.01)
  );

  useEffect(() => {
    if (!canBeInvestment(listing.prop_type)) return;
    let cancelled = false;
    medianAskingRent(listing.town, listing.bedrooms).then((found) => {
      if (cancelled || !found) return;
      setRentSource(found);
      // Seeds only while untouched, so a reader's own figure is never
      // overwritten by a query that resolved after they started typing.
      setMonthlyRent((current) => (current === 0 ? found.rent : current));
    });
    return () => {
      cancelled = true;
    };
  }, [listing.prop_type, listing.town, listing.bedrooms]);

  const returns = investmentReturns(
    {
      price,
      monthlyRent,
      vacancyRate,
      annualTaxes,
      annualInsurance,
      monthlyHoa,
      annualMaintenance,
      managementRate,
      monthlyPrincipalAndInterest: b.principalAndInterest,
      monthlyPmi: b.pmi,
    },
    downPayment
  );

  const showInvest = canBeInvestment(listing.prop_type);

  const Row = ({ label, value }: { label: string; value: number }) =>
    value <= 0 ? null : (
      <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
        <dt className="text-gray-600">{label}</dt>
        <dd className="numeral font-medium text-ink">{formatPrice(Math.round(value))}</dd>
      </div>
    );

  const pct = (n: number | null) => (n === null ? '—' : `${n.toFixed(1)}%`);

  return (
    <section
      id="payment"
      className="mt-16 border-t border-gray-200 pt-10 print:hidden"
      aria-labelledby="payment-heading"
    >
      <h2
        id="payment-heading"
        className="flex items-start gap-3 font-display text-2xl font-semibold tracking-tight text-ink"
      >
        <Calculator className="mt-1 h-6 w-6 shrink-0 text-champagne-ink" aria-hidden />
        {/* Interpolates the address, like every other heading on this page, so
            two listings never emit the same <h2>. */}
        <span>Running the numbers on {listing.address ?? `MLS ${listing.mls_number}`}</span>
      </h2>

      {showInvest && (
        <div className="mt-5 inline-flex rounded-full border border-gray-300 p-1" role="tablist">
          {(
            [
              ['live', 'If you live here'],
              ['invest', 'If you rent it out'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                view === key
                  ? 'bg-ink-deep text-white'
                  : 'text-gray-700 hover:text-champagne-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 max-w-2xl text-gray-600">
        Started from this listing's price
        {listing.taxes !== null ? ', tax bill' : ''}
        {(listing.hoa_fee ?? 0) > 0 ? ' and association fee' : ''}. Everything
        below is editable — change it to your own numbers.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* ---------------- INPUTS ---------------- */}
        <div className="space-y-5 self-start rounded-2xl border border-gray-200 bg-bone p-7">
          <MoneyField
            label="Purchase price"
            hint={
              price !== listedPrice
                ? `Listed at ${formatPrice(listedPrice)}.`
                : 'The asking price. Change it to model an offer.'
            }
            value={price}
            onChange={(next) => {
              setPrice(next);
              // The down payment follows the price in PERCENT mode and holds
              // still in AMOUNT mode — which is exactly what each mode means.
              // Keeping a fixed dollar figure while the price moves is how
              // "20% down" silently becomes 31%.
              if (downMode === 'percent') {
                setDownPayment(Math.round((next * downPercent) / 100));
              }
            }}
          />

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                Down payment
              </span>
              <span
                className="inline-flex overflow-hidden rounded-full border border-gray-300 text-xs"
                role="group"
                aria-label="Enter down payment as"
              >
                {(
                  [
                    ['percent', '%'],
                    ['amount', '$'],
                  ] as const
                ).map(([mode, symbol]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={downMode === mode}
                    onClick={() => setDownMode(mode)}
                    className={`px-3 py-1 font-semibold transition-colors ${
                      downMode === mode
                        ? 'bg-ink-deep text-white'
                        : 'text-gray-600 hover:text-champagne-ink'
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </span>
            </div>

            <div className="mt-2">
              {downMode === 'percent' ? (
                <PercentField
                  label=""
                  value={Number(downPercent.toFixed(2))}
                  onChange={(next) => setDownPayment(Math.round((price * next) / 100))}
                  hint={`${formatPrice(downPayment)} of ${formatPrice(price)}`}
                />
              ) : (
                <MoneyField
                  label=""
                  value={downPayment}
                  onChange={setDownPayment}
                  hint={`${roundedDownPercent}% of ${formatPrice(price)}`}
                />
              )}
            </div>
          </div>

          <PercentField
            label="Interest rate"
            value={rate}
            onChange={setRate}
            hint={
              <>
                An assumption, not a quote — change it to the rate you have been
                offered. Default checked against Freddie Mac's survey on{' '}
                {SITE.assumedMortgageRateAsOf}.
              </>
            }
          />

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              Term
            </legend>
            <div className="mt-2 flex gap-2">
              {[30, 15].map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => setTermYears(years)}
                  aria-pressed={termYears === years}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    termYears === years
                      ? 'bg-ink-deep text-white'
                      : 'border border-gray-300 text-gray-700 hover:border-champagne-ink'
                  }`}
                >
                  {years} years
                </button>
              ))}
            </div>
          </fieldset>

          {/* Only where it applies. Shown as soon as the down payment drops
              below 20% and gone again above it, so the input appearing is
              itself the notification that PMI has started. */}
          {downPercent < PMI_LTV_THRESHOLD * 100 && (
            <PercentField
              label="Mortgage insurance, yearly"
              value={pmiRate}
              onChange={setPmiRate}
              hint={
                <>
                  Charged while the loan is over {PMI_LTV_THRESHOLD * 100}% of the
                  price. Conventional PMI runs about 0.46%–1.5% a year depending
                  on credit (Urban Institute Housing Finance Policy Center);
                  0.5% is the strong-credit end.
                </>
              }
            />
          )}

          <MoneyField
            label="Property taxes, yearly"
            hint={
              listing.taxes === null
                ? 'The feed carries no tax figure for this listing.'
                : listing.tax_year
                  ? `From the listing, ${listing.tax_year}.`
                  : 'From the listing.'
            }
            value={annualTaxes}
            onChange={setAnnualTaxes}
          />

          <MoneyField
            label={
              listing.prop_type === 'CC' ? "Condo insurance, yearly" : "Home insurance, yearly"
            }
            hint={
              listing.prop_type === 'CC' ? (
                <>
                  The Massachusetts HO-6 average ({formatPrice(INSURANCE.condoAnnual)}).
                  The association's master policy covers the structure, so this
                  covers your interior only.
                </>
              ) : (
                <>
                  Estimated at {(INSURANCE.houseRateOfPrice * 100).toFixed(2)}% of
                  price a year, from the Massachusetts average of $1,471 for
                  $300,000 of dwelling coverage (Insure.com / Quadrant, 2026).
                  Coverage is rebuild cost and excludes land, so this runs high
                  where land is expensive — get a real quote.
                </>
              )
            }
            value={annualInsurance}
            onChange={setAnnualInsurance}
          />

          {/* Shown only where an association actually applies, so a
              single-family is not asked about a fee it does not have. */}
          {(listing.hoa || (listing.hoa_fee ?? 0) > 0) && (
            <MoneyField
              label="HOA fee, monthly"
              hint={
                listing.hoa_fee !== null
                  ? 'From the listing. Correct it if your fee is billed yearly.'
                  : 'This listing reports an association but no fee amount.'
              }
              value={monthlyHoa}
              onChange={setMonthlyHoa}
            />
          )}

          {view === 'invest' && (
            <div className="space-y-5 border-t border-gray-200 pt-5">
              <MoneyField
                label="Expected rent, monthly"
                hint={
                  rentSource ? (
                    <>
                      Median asking rent for {rentSource.sampleSize} comparable
                      rentals in {listing.town} right now. Asking, not achieved —
                      and not a projection for this unit.
                    </>
                  ) : (
                    'No comparable rentals in the feed for this town — enter your own figure.'
                  )
                }
                value={monthlyRent}
                onChange={setMonthlyRent}
              />
              <PercentField
                label="Vacancy"
                value={vacancyRate}
                onChange={setVacancyRate}
                hint="Share of the year the unit sits empty between tenants."
              />
              <MoneyField
                label="Maintenance reserve, yearly"
                hint="Seeded at 1% of price — the conventional planning figure, not a bill."
                value={annualMaintenance}
                onChange={setAnnualMaintenance}
              />
              <PercentField
                label="Property management"
                value={managementRate}
                onChange={setManagementRate}
                hint="Of rent collected. Set it to 0 if you manage it yourself."
              />
            </div>
          )}
        </div>

        {/* ---------------- RESULTS ---------------- */}
        {/*
          THE ANSWER TRAVELS WITH THE SCROLL.

          Sticky, so that editing the seventh input still shows the number those
          inputs exist to move. Before this it sat at the top of a static column
          and scrolled away: by the time a reader reached the maintenance
          reserve, the figure it changes was two screens above them, and the
          interaction was "adjust, scroll up, look, scroll down".

          It is the RESULTS column that sticks rather than the inputs — the
          inputs are already under the cursor, and it is the answer that needs
          following. `self-start` is what makes it work at all: a grid item
          stretches to the row by default, and a full-height box has nothing to
          stick within.

          Not a pinned bar across the top of the section, which is what this was
          first: that put the purchase price and down payment permanently in the
          reader's way to show two numbers they had just typed.

          The max-height is what makes the sticky honest. The panel measures
          802px with the loan summary and the scenarios in it; pinning it with
          no bound on a shorter display would fix the total in place and put the
          bottom of its own content permanently off-screen, unreachable.

          6rem, not 7rem, and the difference is deliberate: `top-24` is 96px, so
          a 6rem cap makes the panel exactly as tall as the space beneath the
          navbar on a 900px display — 804px against the 802px it needs. At 7rem
          it fell 14px short and produced a nested scrollbar on the most common
          laptop screen there is, for fourteen pixels. `overflow-y: auto` only
          shows a scrollbar when it genuinely overflows, so anything 900px or
          taller now never sees one.
        */}
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto print:static print:max-h-none print:overflow-visible">
          {view === 'live' ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                Estimated monthly cost
              </p>
              <p className="numeral mt-2 text-4xl font-semibold text-ink sm:text-5xl">
                {formatPrice(Math.round(b.total))}
                <span className="text-xl font-medium text-gray-500"> /month</span>
              </p>

              {b.total > 0 && (
                <>
                  <div
                    className="mt-6 flex h-3 overflow-hidden rounded-full bg-gray-100"
                    role="img"
                    aria-label={SEGMENTS.filter((s) => b[s.key] > 0)
                      .map((s) => `${s.label} ${Math.round((b[s.key] / b.total) * 100)}%`)
                      .join(', ')}
                  >
                    {SEGMENTS.filter((s) => b[s.key] > 0).map((s) => (
                      <span
                        key={s.key}
                        className={s.className}
                        style={{ width: `${(b[s.key] / b.total) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                    {SEGMENTS.filter((s) => b[s.key] > 0).map((s) => (
                      <span key={s.key} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.className}`} aria-hidden />
                        {s.label}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <dl className="mt-6 divide-y divide-gray-100 border-y border-gray-200">
                <Row label="Principal & interest" value={b.principalAndInterest} />
                <Row
                  label={listing.tax_year ? `Taxes (${listing.tax_year})` : 'Taxes'}
                  value={b.taxes}
                />
                <Row label="Insurance" value={b.insurance} />
                <Row label="HOA" value={b.hoa} />
                <Row label="Mortgage insurance (PMI)" value={b.pmi} />
              </dl>

              {loan.loanAmount > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Over the full {termYears} years
                  </h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: 'Loan amount', value: loan.loanAmount },
                      { label: 'Interest paid', value: loan.totalInterest },
                      { label: 'Total repaid', value: loan.totalPaid },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-gray-200 p-4">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                          {item.label}
                        </dt>
                        <dd className="numeral mt-1 text-xl font-semibold text-ink">
                          {formatPrice(Math.round(item.value))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">
                    The mortgage only. Taxes, insurance and any association fee
                    are not projected across {termYears} years — they change, and
                    forecasting today's figures that far out would be a guess
                    dressed as arithmetic.
                  </p>
                </div>
              )}

              {price > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">
                    If you put down
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {scenarios.map((s) => (
                      <button
                        key={s.percent}
                        type="button"
                        onClick={() => setDownPayment(s.down)}
                        aria-pressed={roundedDownPercent === s.percent}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          roundedDownPercent === s.percent
                            ? 'border-champagne-ink bg-bone'
                            : 'border-gray-200 hover:border-champagne-ink'
                        }`}
                      >
                        <span className="numeral block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                          {s.percent}% · {formatPrice(s.down)}
                        </span>
                        <span className="numeral mt-1 block text-xl font-semibold text-ink">
                          {formatPrice(Math.round(s.total))}
                          <span className="text-sm font-medium text-gray-500">/mo</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">
                    The 5% and 10% options include mortgage insurance at{' '}
                    {pmiRate}% a year, which is what makes them closer to the 20%
                    figure than the loan size alone would suggest.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                Estimated monthly cash flow
              </p>
              <p
                className={`numeral mt-2 text-4xl font-semibold sm:text-5xl ${
                  returns.monthlyCashFlow < 0 ? 'text-red-700' : 'text-ink'
                }`}
              >
                {returns.monthlyCashFlow < 0 ? '−' : ''}
                {formatPrice(Math.round(Math.abs(returns.monthlyCashFlow)))}
                <span className="text-xl font-medium text-gray-500"> /month</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {formatPrice(Math.round(Math.abs(returns.annualCashFlow)))} a year
                {returns.monthlyCashFlow < 0 ? ' out of pocket' : ''}.
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Cap rate
                  </dt>
                  <dd className="numeral mt-1 text-2xl font-semibold text-ink">
                    {pct(returns.capRate)}
                  </dd>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Net operating income over price. Excludes the mortgage on
                    purpose — it describes the building, not your financing, so
                    it compares across deals.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Cash-on-cash
                  </dt>
                  <dd className="numeral mt-1 text-2xl font-semibold text-ink">
                    {pct(returns.cashOnCash)}
                  </dd>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Annual cash flow over the {formatPrice(downPayment)} down.
                    Closing costs are not counted as cash in, so a real deal
                    returns slightly less.
                  </p>
                </div>
              </dl>

              <dl className="mt-6 divide-y divide-gray-100 border-y border-gray-200">
                <Row label="Effective rent (after vacancy)" value={returns.effectiveRent} />
                <Row label="Operating expenses" value={returns.operatingExpenses} />
                <Row label="Net operating income" value={returns.noi} />
                <Row label="Mortgage (P&I)" value={b.principalAndInterest} />
                {/*
                  Disappears at 20% down and above, on its own — the same rule
                  as the owner-occupant view, and now actually subtracted from
                  the cash flow above rather than silently dropped.
                */}
                <Row label="Mortgage insurance (PMI)" value={b.pmi} />
              </dl>

              <p className="mt-6 text-xs leading-relaxed text-gray-500">
                Rent is the median <em>asking</em> rent for comparable units in{' '}
                {listing.town ?? 'this town'}, not a projection for this one, and
                not what it has achieved. Nothing here models appreciation,
                depreciation, tax treatment, capital expenditure or the cost of
                turning a unit over — a real underwrite includes all of them.
              </p>
            </>
          )}

          <p className="mt-8 text-xs leading-relaxed text-gray-500">
            An estimate, not a loan offer, a pre-approval or investment advice.
            It excludes escrow and closing costs, and your actual rate depends on
            a lender's review of your finances.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ListingPayment;
