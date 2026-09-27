import { useEffect, useState, type ReactNode } from 'react';
import { formatPrice } from '@/lib/listings';
import {
  INSURANCE,
  PMI_LTV_THRESHOLD,
  estimateInsurance,
  investmentReturns,
  loanSummary,
  monthlyPayment,
  type PaymentInputs,
} from '@/lib/mortgage';
import { sellerProceeds } from '@/lib/sellerProceeds';
import { medianAskingRent } from '@/lib/idxSearch';
import { SITE } from '@/lib/siteConfig';
import {
  CALCULATOR_COPY,
  type CalcContext,
  type CalcLang,
  type CalcView,
} from '@/components/calculator/copy';

/**
 * THE calculator: what a home costs to live in, what it returns rented out, and
 * what a seller walks away with.
 *
 * ONE COMPONENT IN THREE PLACES — every listing page, /calculator and
 * /vi/cong-cu-tinh-toan. Until 2026-09-27 there were two: this design lived only
 * in ListingPayment, and /calculator ran RealEstateCalculators, a three-tab card
 * layout of sliders with its own arithmetic, its own defaults and 147 i18n keys.
 * The listing page had no seller view and /calculator had no loan summary, no
 * PMI and no cap rate. Kevin asked for the calculator to look like the one on
 * the listings and for the listings to gain seller proceeds, which is the same
 * request stated from both ends: one calculator.
 *
 * WHAT IS AND IS NOT KNOWN is carried by the seed, because the difference is
 * the whole reason this is safe to show about someone else's listing:
 *
 *   From the feed  - price, annual taxes (with their tax year), HOA fee.
 *   Derived, cited - insurance (Massachusetts averages, see @/lib/mortgage),
 *                    starting rent (median asking rent for comparable units),
 *                    the deed excise (statutory, see @/lib/sellerProceeds).
 *   Assumed        - rate, PMI rate, down payment, term, vacancy, maintenance,
 *                    management, commission. Every one is an editable input
 *                    carrying a visible note, and the defaults are dated in
 *                    siteConfig.
 *   Example        - on /calculator only: the opening price, tax bill, rent.
 *                    The intro says so before any number does.
 */

export interface CalculatorSeed {
  price: number;
  annualTaxes: number;
  taxSource: { from: 'listing'; year: number | null } | { from: 'missing' } | { from: 'example' };
  monthlyHoa: number;
  /** Where the HOA figure came from; null hides the field entirely. */
  hoaSource: 'listing' | 'listing-no-amount' | 'example' | null;
  /** Decides the insurance estimate and its label. */
  propType: string | null;
  /** Seeds the rent from comparable rentals; null on /calculator. */
  rentLookup: { town: string | null; bedrooms: number | null } | null;
  /** The opening rent when there is nothing to look up. */
  exampleRent: number;
  views: CalcView[];
}

interface Props {
  lang: CalcLang;
  context: CalcContext;
  seed: CalculatorSeed;
}

/* -------------------------------------------------------------------------- */
/* Fields                                                                      */
/* -------------------------------------------------------------------------- */

const LABEL = 'text-xs font-semibold uppercase tracking-[0.12em] text-gray-500';

/** A dollar input that shows thousands separators without fighting the caret. */
const MoneyField = ({
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
  hint?: ReactNode;
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
        <span className="pr-3 text-sm text-gray-500">%</span>
      </span>
      {hint && <span className="mt-1 block text-xs leading-relaxed text-gray-500">{hint}</span>}
    </label>
  );
};

/** A dollar figure with a real minus sign, for a cash flow or proceeds below zero. */
const money = (n: number) =>
  `${n < 0 ? '−' : ''}${formatPrice(Math.round(Math.abs(n)))}`;

/** One line of a breakdown. Hidden at zero, so a single-family has no HOA row. */
const Row = ({
  label,
  value,
  minus = false,
  strong = false,
}: {
  label: string;
  value: number;
  minus?: boolean;
  strong?: boolean;
}) =>
  value <= 0 && !strong ? null : (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className={strong ? 'font-semibold text-ink' : 'text-gray-600'}>{label}</dt>
      <dd className={`numeral ${strong ? 'font-semibold' : 'font-medium'} text-ink`}>
        {minus ? '−' : ''}
        {money(value)}
      </dd>
    </div>
  );

/**
 * A stacked bar with its legend.
 *
 * A tonal ramp rather than five hues. The design system allows champagne as a
 * NON-TEXT MARK on a light surface — which a chart segment is — but it has no
 * third or fourth accent, and inventing them here would start a third palette
 * on a site that was unified out of two.
 */
const SplitBar = ({
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

/* -------------------------------------------------------------------------- */

const HomeCalculator = ({ lang, context, seed }: Props) => {
  const c = CALCULATOR_COPY[lang];
  const views = seed.views;
  const [view, setView] = useState<CalcView>(views[0] ?? 'live');

  /*
   * THE PRICE IS AN INPUT, and ONE input across all three views. Anyone
   * weighing an offer is asking what it costs at their number, not at the
   * seller's; and a reader switching from "live here" to "sell" is asking about
   * the same house at the same price, so switching must not reset it.
   */
  const [price, setPrice] = useState(seed.price);

  /*
   * DOWN PAYMENT: ONE VALUE, TWO WAYS OF SAYING IT. Held in dollars, because
   * that is what the arithmetic needs and what a lender asks for; the
   * percentage is derived on the way out and converted on the way in, so the
   * two can never disagree.
   */
  const [downMode, setDownMode] = useState<'percent' | 'amount'>('percent');
  const [downPayment, setDownPayment] = useState(() => Math.round(seed.price * 0.2));
  const [rate, setRate] = useState(SITE.assumedMortgageRate);
  const [termYears, setTermYears] = useState(30);
  const [pmiRate, setPmiRate] = useState(SITE.assumedPmiRate);
  const [annualTaxes, setAnnualTaxes] = useState(seed.annualTaxes);
  const [annualInsurance, setAnnualInsurance] = useState(() =>
    estimateInsurance(seed.price, seed.propType)
  );
  /*
   * HOA IS TREATED AS MONTHLY, AND THE LABEL SAYS SO. MLS PIN publishes the
   * association fee as a monthly figure and the live data agrees, but the export
   * carries no period beside the number; naming it on the input is what makes a
   * yearly fee recoverable by the reader.
   */
  const [monthlyHoa, setMonthlyHoa] = useState(seed.monthlyHoa);

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

  // Computed through the same function as the headline, so a scenario can never
  // disagree with the number above it.
  const scenarios = [5, 10, 20].map((percent) => ({
    percent,
    down: Math.round((price * percent) / 100),
    total: monthlyPayment({ ...inputs, downPayment: (price * percent) / 100 }).total,
  }));

  // ---- Renting it out -------------------------------------------------------

  const [monthlyRent, setMonthlyRent] = useState(seed.rentLookup ? 0 : seed.exampleRent);
  const [rentSource, setRentSource] = useState<{ rent: number; sampleSize: number } | null>(null);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [managementRate, setManagementRate] = useState(10);
  // 1% of price a year: the conventional planning figure, flagged as one. What
  // matters is that it is not zero — a cash flow with no maintenance line is the
  // classic way a bad deal looks like a good one.
  const [annualMaintenance, setAnnualMaintenance] = useState(() => Math.round(seed.price * 0.01));

  const lookupTown = seed.rentLookup?.town ?? null;
  const lookupBeds = seed.rentLookup?.bedrooms ?? null;
  const canLookUpRent = seed.rentLookup !== null && views.includes('invest');
  useEffect(() => {
    if (!canLookUpRent) return;
    let cancelled = false;
    medianAskingRent(lookupTown, lookupBeds).then((found) => {
      if (cancelled || !found) return;
      setRentSource(found);
      // Seeds only while untouched, so a reader's own figure is never
      // overwritten by a query that resolved after they started typing.
      setMonthlyRent((current) => (current === 0 ? found.rent : current));
    });
    return () => {
      cancelled = true;
    };
  }, [canLookUpRent, lookupTown, lookupBeds]);

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

  // ---- Selling --------------------------------------------------------------

  const [mortgagePayoff, setMortgagePayoff] = useState(0);
  const [commissionRate, setCommissionRate] = useState(SITE.assumedSellerCommissionRate);
  const [otherClosingCosts, setOtherClosingCosts] = useState(1500);
  const [sellerCredits, setSellerCredits] = useState(0);
  const proceeds = sellerProceeds({
    salePrice: price,
    mortgagePayoff,
    commissionRate,
    otherClosingCosts,
    sellerCredits,
  });

  const pct = (n: number | null) => (n === null ? '—' : `${n.toFixed(1)}%`);
  const taxYear = seed.taxSource.from === 'listing' ? seed.taxSource.year : null;

  // ---- Hints that depend on where a number came from -------------------------

  const priceHint =
    view === 'sell'
      ? context === 'listing'
        ? c.priceHint.sellListing
        : c.priceHint.sellExample
      : context === 'listing'
        ? price !== seed.price
          ? c.priceHint.changed(formatPrice(seed.price))
          : c.priceHint.asking
        : c.priceHint.example;

  const taxesHint =
    seed.taxSource.from === 'example'
      ? c.taxesHint.example
      : seed.taxSource.from === 'missing'
        ? c.taxesHint.missing
        : seed.taxSource.year
          ? c.taxesHint.listingYear(seed.taxSource.year)
          : c.taxesHint.listing;

  const rentHint = seed.rentLookup
    ? rentSource
      ? c.rentHint.median(rentSource.sampleSize, seed.rentLookup.town ?? '')
      : c.rentHint.none
    : c.rentHint.example;

  return (
    <div>
      {views.length > 1 && (
        <div
          className="inline-flex flex-wrap rounded-full border border-gray-300 p-1"
          role="tablist"
          aria-label={c.tablist}
        >
          {views.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                view === key ? 'bg-ink-deep text-white' : 'text-gray-700 hover:text-champagne-ink'
              }`}
            >
              {c.tabs[context][key]}
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 max-w-2xl text-gray-600">
        {context === 'listing'
          ? c.intro.listing({
              taxes: seed.taxSource.from === 'listing',
              hoa: seed.hoaSource === 'listing',
            })
          : c.intro.general}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* ---------------- INPUTS ---------------- */}
        <div className="space-y-5 self-start rounded-2xl border border-gray-200 bg-bone p-7">
          <MoneyField
            label={view === 'sell' ? c.salePrice : c.purchasePrice}
            hint={priceHint}
            value={price}
            onChange={(next) => {
              setPrice(next);
              // The down payment follows the price in PERCENT mode and holds
              // still in AMOUNT mode — which is exactly what each mode means.
              if (downMode === 'percent') setDownPayment(Math.round((next * downPercent) / 100));
            }}
          />

          {view === 'sell' ? (
            <>
              <MoneyField
                label={c.payoff}
                hint={c.payoffHint}
                value={mortgagePayoff}
                onChange={setMortgagePayoff}
              />
              <PercentField
                label={c.commission}
                hint={c.commissionHint}
                value={commissionRate}
                onChange={setCommissionRate}
              />
              <MoneyField
                label={c.otherCosts}
                hint={c.otherCostsHint}
                value={otherClosingCosts}
                onChange={setOtherClosingCosts}
              />
              <MoneyField
                label={c.credits}
                hint={c.creditsHint}
                value={sellerCredits}
                onChange={setSellerCredits}
              />
            </>
          ) : (
            <>
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={LABEL}>{c.downPayment}</span>
                  <span
                    className="inline-flex overflow-hidden rounded-full border border-gray-300 text-xs"
                    role="group"
                    aria-label={c.downAs}
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
                          downMode === mode ? 'bg-ink-deep text-white' : 'text-gray-600 hover:text-champagne-ink'
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
                      hint={c.downOf(formatPrice(downPayment), formatPrice(price))}
                    />
                  ) : (
                    <MoneyField
                      label=""
                      value={downPayment}
                      onChange={setDownPayment}
                      hint={c.percentOf(roundedDownPercent, formatPrice(price))}
                    />
                  )}
                </div>
              </div>

              <PercentField
                label={c.rate}
                value={rate}
                onChange={setRate}
                hint={c.rateHint(SITE.assumedMortgageRateAsOf)}
              />

              <fieldset>
                <legend className={LABEL}>{c.term}</legend>
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
                      {c.years(years)}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Only where it applies: the input appearing is itself the
                  notification that PMI has started. */}
              {downPercent < PMI_LTV_THRESHOLD * 100 && (
                <PercentField
                  label={c.pmi}
                  value={pmiRate}
                  onChange={setPmiRate}
                  hint={c.pmiHint(PMI_LTV_THRESHOLD * 100)}
                />
              )}

              <MoneyField label={c.taxes} hint={taxesHint} value={annualTaxes} onChange={setAnnualTaxes} />

              <MoneyField
                label={seed.propType === 'CC' ? c.insuranceCondo : c.insuranceHome}
                hint={
                  seed.propType === 'CC'
                    ? c.insuranceCondoHint(formatPrice(INSURANCE.condoAnnual))
                    : c.insuranceHomeHint((INSURANCE.houseRateOfPrice * 100).toFixed(2))
                }
                value={annualInsurance}
                onChange={setAnnualInsurance}
              />

              {seed.hoaSource !== null && (
                <MoneyField
                  label={c.hoa}
                  hint={
                    seed.hoaSource === 'listing'
                      ? c.hoaHint.listing
                      : seed.hoaSource === 'listing-no-amount'
                        ? c.hoaHint.listingNoAmount
                        : c.hoaHint.example
                  }
                  value={monthlyHoa}
                  onChange={setMonthlyHoa}
                />
              )}

              {view === 'invest' && (
                <div className="space-y-5 border-t border-gray-200 pt-5">
                  <MoneyField label={c.rent} hint={rentHint} value={monthlyRent} onChange={setMonthlyRent} />
                  <PercentField
                    label={c.vacancy}
                    value={vacancyRate}
                    onChange={setVacancyRate}
                    hint={c.vacancyHint}
                  />
                  <MoneyField
                    label={c.maintenance}
                    hint={c.maintenanceHint}
                    value={annualMaintenance}
                    onChange={setAnnualMaintenance}
                  />
                  <PercentField
                    label={c.management}
                    value={managementRate}
                    onChange={setManagementRate}
                    hint={c.managementHint}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* ---------------- RESULTS ---------------- */}
        {/*
          THE ANSWER TRAVELS WITH THE SCROLL. Sticky, so editing the seventh
          input still shows the number those inputs exist to move; `self-start`
          is what lets a grid item stick at all. The max-height keeps the panel
          reachable on a short display — at 6rem it fits a 900px screen exactly.
        */}
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto print:static print:max-h-none print:overflow-visible">
          {view === 'live' && (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">{c.monthlyCost}</p>
              <p className="numeral mt-2 text-4xl font-semibold text-ink sm:text-5xl">
                {formatPrice(Math.round(b.total))}
                <span className="text-xl font-medium text-gray-500">{c.perMonth}</span>
              </p>

              <SplitBar
                parts={[
                  { key: 'pi', label: c.segments.principalAndInterest, value: b.principalAndInterest, className: 'bg-ink-deep' },
                  { key: 'taxes', label: c.segments.taxes, value: b.taxes, className: 'bg-champagne' },
                  { key: 'ins', label: c.segments.insurance, value: b.insurance, className: 'bg-champagne-ink' },
                  { key: 'hoa', label: c.segments.hoa, value: b.hoa, className: 'bg-gray-300' },
                  { key: 'pmi', label: c.segments.pmi, value: b.pmi, className: 'bg-gray-500' },
                ]}
              />

              <dl className="mt-6 divide-y divide-gray-100 border-y border-gray-200">
                <Row label={c.segments.principalAndInterest} value={b.principalAndInterest} />
                <Row label={c.taxesRow(taxYear)} value={b.taxes} />
                <Row label={c.segments.insurance} value={b.insurance} />
                <Row label={c.segments.hoa} value={b.hoa} />
                <Row label={c.pmiRow} value={b.pmi} />
              </dl>

              {loan.loanAmount > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">
                    {c.overTerm(termYears)}
                  </h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: c.loanAmount, value: loan.loanAmount },
                      { label: c.interestPaid, value: loan.totalInterest },
                      { label: c.totalRepaid, value: loan.totalPaid },
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
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">{c.overTermNote(termYears)}</p>
                </div>
              )}

              {price > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500">
                    {c.ifYouPutDown}
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
                          <span className="text-sm font-medium text-gray-500">{c.perMo}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">{c.scenarioNote(pmiRate)}</p>
                </div>
              )}
            </>
          )}

          {view === 'invest' && (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">{c.cashFlow}</p>
              <p
                className={`numeral mt-2 text-4xl font-semibold sm:text-5xl ${
                  returns.monthlyCashFlow < 0 ? 'text-red-700' : 'text-ink'
                }`}
              >
                {money(returns.monthlyCashFlow)}
                <span className="text-xl font-medium text-gray-500">{c.perMonth}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {c.perYear(formatPrice(Math.round(Math.abs(returns.annualCashFlow))), returns.monthlyCashFlow < 0)}
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{c.capRate}</dt>
                  <dd className="numeral mt-1 text-2xl font-semibold text-ink">{pct(returns.capRate)}</dd>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{c.capRateNote}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{c.cashOnCash}</dt>
                  <dd className="numeral mt-1 text-2xl font-semibold text-ink">{pct(returns.cashOnCash)}</dd>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {c.cashOnCashNote(formatPrice(downPayment))}
                  </p>
                </div>
              </dl>

              <dl className="mt-6 divide-y divide-gray-100 border-y border-gray-200">
                <Row label={c.effectiveRent} value={returns.effectiveRent} />
                <Row label={c.operatingExpenses} value={returns.operatingExpenses} />
                <Row label={c.noi} value={returns.noi} />
                <Row label={c.mortgagePi} value={b.principalAndInterest} />
                {/* Disappears at 20% down and above, on its own. */}
                <Row label={c.pmiRow} value={b.pmi} />
              </dl>

              <p className="mt-6 text-xs leading-relaxed text-gray-500">
                {seed.rentLookup && rentSource
                  ? c.rentNote.listing(seed.rentLookup.town ?? '')
                  : c.rentNote.general}
              </p>
            </>
          )}

          {view === 'sell' && (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">{c.netProceeds}</p>
              <p
                className={`numeral mt-2 text-4xl font-semibold sm:text-5xl ${
                  proceeds.net < 0 ? 'text-red-700' : 'text-ink'
                }`}
              >
                {money(proceeds.net)}
              </p>
              {proceeds.net < 0 && <p className="mt-2 max-w-xl text-sm text-red-700">{c.underwater}</p>}

              <SplitBar
                parts={[
                  { key: 'net', label: c.sellSegments.net, value: proceeds.net, className: 'bg-champagne' },
                  { key: 'payoff', label: c.sellSegments.mortgagePayoff, value: proceeds.mortgagePayoff, className: 'bg-ink-deep' },
                  { key: 'commission', label: c.sellSegments.commission, value: proceeds.commission, className: 'bg-champagne-ink' },
                  { key: 'deed', label: c.sellSegments.deedExcise, value: proceeds.deedExcise, className: 'bg-gray-500' },
                  {
                    key: 'other',
                    label: c.sellSegments.otherAndCredits,
                    value: proceeds.otherClosingCosts + proceeds.sellerCredits,
                    className: 'bg-gray-300',
                  },
                ]}
              />

              <dl className="mt-6 divide-y divide-gray-100 border-y border-gray-200">
                <Row label={c.saleRow} value={price} />
                <Row label={c.commissionRow(commissionRate)} value={proceeds.commission} minus />
                <Row label={c.deedRow} value={proceeds.deedExcise} minus />
                <Row label={c.otherRow} value={proceeds.otherClosingCosts} minus />
                <Row label={c.creditsRow} value={proceeds.sellerCredits} minus />
                {/* The subtotal only means something when a payoff follows it;
                    with none it would print the answer twice. */}
                {proceeds.mortgagePayoff > 0 && (
                  <Row label={c.beforePayoffRow} value={proceeds.beforePayoff} strong />
                )}
                <Row label={c.payoffRow} value={proceeds.mortgagePayoff} minus />
                <Row label={c.netRow} value={proceeds.net} strong />
              </dl>

              <p className="mt-6 text-xs leading-relaxed text-gray-500">{c.deedNote}</p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">{c.sellNotModelled}</p>
            </>
          )}

          <p className="mt-8 text-xs leading-relaxed text-gray-500">
            {view === 'sell' ? c.disclaimerSell : c.disclaimerBuy}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeCalculator;
