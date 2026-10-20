/**
 * /admin/costs — Kevin's own prices for the renovation and building cost book.
 *
 * Every investment analysis on /investments starts its renovation and build
 * figures from the cost book (src/lib/rehabCosts.ts): researched Greater Boston
 * ranges, each with its source and date. Published prices for this market
 * disagree by two or three times, so a local contractor's figure is better
 * than any of them — and this page is where Kevin enters one. His figure
 * replaces the book's line for every investor, labelled as his, until he puts
 * the researched range back.
 *
 * One row per line, grouped like the book. Built for a phone: each line stacks,
 * and the three figures sit side by side even at 390px.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import AdminShell, { ADMIN_BUTTON, AdminCard } from '@/components/AdminShell';
import { LINK } from '@/components/investments/ui';
import { costOverrides, deleteCostOverride, saveCostOverride } from '@/lib/investmentStore';
import { formatPrice } from '@/lib/listings';
import { COST_BOOK, type CostItem, type CostOverride } from '@/lib/rehabCosts';

const UNIT: Record<CostItem['unit'], string> = {
  job: 'per job',
  each: 'each',
  sqft: 'per sq ft',
  unit: 'per dwelling unit',
  pct: '% of the work',
};

const show = (item: CostItem, n: number) => (item.unit === 'pct' ? `${n}%` : formatPrice(n));

const Figure = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="block min-w-0">
    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</span>
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
      className="numeral mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink focus:border-champagne-ink focus:outline-none"
    />
  </label>
);

const CostRow = ({ item, override }: { item: CostItem; override: CostOverride | undefined }) => {
  const queryClient = useQueryClient();
  const start = override ?? item;
  const [low, setLow] = useState(String(start.low));
  const [mid, setMid] = useState(String(start.mid));
  const [high, setHigh] = useState(String(start.high));
  const [note, setNote] = useState(override?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const nums = [Number(low), Number(mid), Number(high)];
  const valid = nums.every((n) => Number.isFinite(n) && n >= 0) && nums[0] <= nums[1] && nums[1] <= nums[2] && low !== '' && mid !== '' && high !== '';
  const changed = String(start.low) !== low || String(start.mid) !== mid || String(start.high) !== high || (override?.note ?? '') !== note;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['inv-costs'] });
  const save = useMutation({
    mutationFn: () => saveCostOverride({ key: item.key, low: nums[0], mid: nums[1], high: nums[2], note: note || null }),
    onSuccess: () => {
      setError(null);
      void refresh();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Could not save.'),
  });
  const reset = useMutation({
    mutationFn: () => deleteCostOverride(item.key),
    onSuccess: () => {
      setLow(String(item.low));
      setMid(String(item.mid));
      setHigh(String(item.high));
      setNote('');
      setError(null);
      void refresh();
    },
    onError: () => setError('Could not put the researched range back.'),
  });

  return (
    <li className="p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-medium text-ink">{item.label}</p>
        <p className="text-xs text-gray-500">{UNIT[item.unit]}</p>
      </div>
      <p className="numeral mt-1 text-xs leading-relaxed text-gray-500">
        Researched: {show(item, item.low)} – {show(item, item.mid)} – {show(item, item.high)}.{' '}
        {item.source}{' '}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className={LINK}>
            Source
          </a>
        )}
      </p>
      {override && (
        <p className="mt-2 text-xs font-semibold text-champagne-ink">
          Your figure is in use, set {new Date(override.updated_at).toLocaleDateString()}.
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-md">
        <Figure label="Low" value={low} onChange={setLow} />
        <Figure label="Typical" value={mid} onChange={setMid} />
        <Figure label="High" value={high} onChange={setHigh} />
      </div>
      <label className="mt-3 block sm:max-w-md">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Where it comes from</span>
        <input
          type="text"
          value={note}
          maxLength={300}
          placeholder="e.g. Smith Roofing quote, Oct 2026"
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink focus:border-champagne-ink focus:outline-none"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => save.mutate()} disabled={!valid || !changed || save.isPending} className={ADMIN_BUTTON}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : save.isSuccess && !changed ? <Check className="h-4 w-4" aria-hidden /> : null}
          {override ? 'Save' : 'Use my figure'}
        </button>
        {override && (
          <button
            type="button"
            onClick={() => reset.mutate()}
            disabled={reset.isPending}
            className="text-sm font-medium text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-champagne-ink"
          >
            Put the researched range back
          </button>
        )}
        {!valid && <span className="text-xs text-red-700">Low, typical and high must run low to high.</span>}
      </div>
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
    </li>
  );
};

export default function AdminCosts() {
  const overrides = useQuery({ queryKey: ['inv-costs'], queryFn: costOverrides, staleTime: 60_000 });
  const byKey = new Map((overrides.data ?? []).map((o) => [o.key, o]));
  const groups = [...new Set(COST_BOOK.map((c) => c.group))];

  return (
    <AdminShell
      title="Renovation prices"
      description="The ranges every investment analysis starts from. Replace any line with your contractors' figures; investors see it marked as yours."
    >
      {overrides.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">{g}</h2>
              <AdminCard>
                <ul className="divide-y divide-gray-100">
                  {COST_BOOK.filter((c) => c.group === g).map((item) => (
                    <CostRow key={`${item.key}-${byKey.get(item.key)?.updated_at ?? 'book'}`} item={item} override={byKey.get(item.key)} />
                  ))}
                </ul>
              </AdminCard>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
