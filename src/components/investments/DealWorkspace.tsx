import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Trash2 } from 'lucide-react';
import AduPanel from '@/components/investments/AduPanel';
import BrrrrPanel from '@/components/investments/BrrrrPanel';
import BuildPanel from '@/components/investments/BuildPanel';
import FlipPanel from '@/components/investments/FlipPanel';
import HoldPanel, { type HoldContext } from '@/components/investments/HoldPanel';
import RulesPanel from '@/components/investments/RulesPanel';
import { BUTTON, LINK } from '@/components/investments/ui';
import { estimateSuppressed } from '@/lib/idxComps';
import { deleteAnalysis, saveAnalysis, type SavedAnalysis } from '@/lib/investmentStore';
import { formatPrice } from '@/lib/listings';
import type { TownRules } from '@/lib/investmentRules';
import type { SaleRow } from '@/lib/newBuild';
import type { LotContext } from '@/lib/parcels';
import type { CostItem } from '@/lib/rehabCosts';
import { hydrateScenario, type DealTab, type Scenario } from '@/lib/scenario';
import type { Valuation } from '@/lib/valuation';
import { pillTab } from '@/lib/pill';

/**
 * One home's analysis, every strategy over one Scenario.
 *
 * The scenario is seeded once — or reopened from the investor's saved copy,
 * laid over today's seed — and from then on it is theirs: the tabs read and
 * write the same document, and "Save" stores exactly that document.
 */

const TABS: { id: DealTab; label: string; lede: string }[] = [
  {
    id: 'hold',
    label: 'Rent it',
    lede: 'Buy it, rent it out and hold it: what it earns before the mortgage, and what is left after.',
  },
  {
    id: 'flip',
    label: 'Fix and flip',
    lede: 'Buy it, renovate it and sell it: what is left after the purchase, the work, the lender, the months it is held and the cost of selling.',
  },
  {
    id: 'brrrr',
    label: 'BRRRR',
    lede: 'Buy it, renovate it, rent it, then refinance on the new value: how much of your money comes back out, and what it earns after.',
  },
  {
    id: 'build',
    label: 'Tear down and build',
    lede: 'Buy it for the land, take the house down and build new: what is left after the land, the demolition, the new house, the loan, the months and the cost of selling.',
  },
  {
    id: 'adu',
    label: 'ADU and lot',
    lede: 'Add an accessory dwelling unit, allowed by right on a single-family lot, and see how the lot compares with its neighbours.',
  },
];

/** What the build and ADU tabs need beyond the scenario. */
export interface DevelopmentContext {
  canBuild: boolean;
  canAdu: boolean;
  town: string;
  townRules: TownRules | null;
  sales: SaleRow[];
  sizeNote: string;
  mainGrossArea: number;
  gfaNote: string;
  aduRentNote: ReactNode;
  effectiveTaxRate: number | null;
  lotSqft: number | null;
  lotNote: string | null;
  lots: LotContext | null;
}

/** Where the after-repair value's suggestion came from — or why there is none. */
export const ArvNote = ({ v, mls }: { v: Valuation | null | undefined; mls: string }) => {
  if (estimateSuppressed(mls)) return 'Enter your own: the comparable-sales estimate is switched off for this listing.';
  if (!v) return 'Not enough like homes sold nearby to suggest one. Enter what the finished house would sell for.';
  const range = `${formatPrice(Math.round(v.low))}–${formatPrice(Math.round(v.high))}`;
  if (v.withheld === 'larger-than-comps' || v.withheld === 'smaller-than-comps') {
    return `Like homes nearby sold for ${range}, but this one is ${v.withheld === 'larger-than-comps' ? 'larger' : 'smaller'} than all of them, so no figure is suggested. Enter your own.`;
  }
  if (v.withheld === 'lot-beyond-comps') {
    return `Like homes nearby sold for ${range}, but on much smaller lots, so no figure is suggested. Enter your own.`;
  }
  return (
    <>
      Suggested: the top of what like homes nearby sold for ({range}) — a renovated home usually sells near the top, and
      a bathroom added or space finished can take it higher.
      {v.withheld === 'far-from-asking' && ' The asking price is far from these sales: either the house needs more than they did, or something the records cannot see.'}
      {v.withheld === 'dispersion' && ' These sales disagree with each other more than usual; treat it as rough.'}
    </>
  );
};

const DealWorkspace = ({
  ctx,
  seed,
  saved,
  book,
  arv,
  rules,
  dev,
}: {
  ctx: HoldContext;
  seed: Scenario;
  saved: SavedAnalysis | null;
  book: CostItem[];
  arv: ReactNode;
  rules: { propType: string | null; yearBuilt: number | null; septic: boolean; units: number; town: string | null };
  dev: DevelopmentContext;
}) => {
  const units = rules.units;
  const queryClient = useQueryClient();
  const [s, setS] = useState<Scenario>(() => (saved ? hydrateScenario(saved.inputs, seed) : seed));
  const [savedRow, setSavedRow] = useState<SavedAnalysis | null>(saved);
  const [savedJson, setSavedJson] = useState(() => (saved ? JSON.stringify(hydrateScenario(saved.inputs, seed)) : null));
  const [error, setError] = useState<string | null>(null);
  const json = useMemo(() => JSON.stringify(s), [s]);
  const dirty = savedJson !== json;

  const set = (patch: Partial<Scenario> | ((cur: Scenario) => Partial<Scenario>)) =>
    setS((cur) => ({ ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) }));

  const save = useMutation({
    mutationFn: () => saveAnalysis(savedRow?.id ?? null, ctx.listing.mls_number, s),
    onSuccess: (row) => {
      setSavedRow(row);
      setSavedJson(json);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['inv-analyses'] });
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'The analysis could not be saved. Try again.'),
  });
  const remove = useMutation({
    mutationFn: () => deleteAnalysis(savedRow?.id as string),
    onSuccess: () => {
      setSavedRow(null);
      setSavedJson(null);
      void queryClient.invalidateQueries({ queryKey: ['inv-analyses'] });
    },
    onError: () => setError('The saved analysis could not be removed. Try again.'),
  });

  const tabs = TABS.filter((t) => (t.id === 'build' ? dev.canBuild : t.id === 'adu' ? dev.canAdu : true));
  const tab = tabs.find((t) => t.id === s.tab) ?? tabs[0];
  const askingPrice = ctx.listing.list_price ?? 0;

  return (
    <>
    <section aria-labelledby="strategy-heading" className="mt-16 border-t border-gray-200 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="strategy-heading" className="text-xl font-semibold uppercase tracking-wide text-ink">
          Run the numbers
        </h2>
        <div className="inline-flex flex-wrap rounded-full border border-gray-300 p-1" role="tablist" aria-label="Strategy">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab.id === t.id}
              onClick={() => set({ tab: t.id })}
              className={pillTab(tab.id === t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 mb-8 max-w-3xl text-sm text-gray-600">
        {tab.lede} Every figure can be changed, and the tabs share them: a price entered on one is used by all of
        them.
      </p>

      {tab.id === 'hold' && <HoldPanel ctx={ctx} s={s} set={set} />}
      {tab.id === 'flip' && <FlipPanel s={s} set={set} book={book} askingPrice={askingPrice} arvNote={arv} />}
      {tab.id === 'brrrr' && <BrrrrPanel s={s} set={set} book={book} askingPrice={askingPrice} arvNote={arv} units={units} />}
      {tab.id === 'build' && (
        <BuildPanel s={s} set={set} book={book} sales={dev.sales} sizeNote={dev.sizeNote} town={dev.town} rules={dev.townRules} />
      )}
      {tab.id === 'adu' && (
        <AduPanel
          s={s}
          set={set}
          book={book}
          mainGrossArea={dev.mainGrossArea}
          gfaNote={dev.gfaNote}
          rentNote={dev.aduRentNote}
          effectiveTaxRate={dev.effectiveTaxRate}
          lotSqft={dev.lotSqft}
          lotNote={dev.lotNote}
          lots={dev.lots}
          town={dev.town}
        />
      )}

      {/* ---------------- Save ---------------- */}
      <div className="mt-12 rounded-2xl border border-gray-200 bg-bone p-6">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending || (!dirty && Boolean(savedRow))}
            className={`${BUTTON} disabled:cursor-default disabled:bg-gray-300 disabled:text-gray-600`}
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : !dirty && savedRow ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : null}
            {!savedRow ? 'Save this analysis' : dirty ? 'Save changes' : 'Saved'}
          </button>
          {savedRow && (
            <span className="text-sm text-gray-600">
              Last saved {new Date(savedRow.updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              {dirty && ' — you have changes since'}.
            </span>
          )}
          {savedRow && (
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="ml-auto inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove saved analysis
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          Saved analyses are listed at the top of{' '}
          <Link to="/investments" className={LINK}>
            Investments
          </Link>
          . Kevin can see the analyses you save, so he can talk a deal through with you; nobody else can. The{' '}
          <Link to="/privacy-policy" className={LINK}>
            privacy policy
          </Link>{' '}
          has the detail.
        </p>
      </div>
    </section>
    <RulesPanel context={{ strategy: tab.id, ...rules }} />
    </>
  );
};

export default DealWorkspace;
