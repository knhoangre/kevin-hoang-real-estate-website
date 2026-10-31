import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { KIND_LABEL, type Sourced } from '@/lib/investmentAssumptions';
import { pill } from '@/lib/pill';

/** Small pieces shared by the screener and the deal view. */

export const Spinner = ({ label }: { label?: string }) => (
  <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3" role="status">
    <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
    {label && <p className="text-sm text-gray-500">{label}</p>}
  </div>
);

export const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-gray-200 bg-bone p-6 text-sm leading-relaxed text-gray-700 sm:p-8 ${className}`}>
    {children}
  </div>
);

export const LINK =
  'font-medium text-champagne-ink underline decoration-champagne underline-offset-4 hover:decoration-2';

/** The dark button, with the champagne hover every dark button on a light surface has. */
export const BUTTON = pill('ink');

/**
 * Where an assumed number came from, under its input: "Assumption · …" or
 * "Published · …", with the source linked. Every default on these pages gets
 * one, so no planning figure is ever shown as if it were a fact.
 */
export const SourceHint = ({ a, children }: { a: Sourced<unknown>; children?: ReactNode }) => (
  <>
    {children && <>{children} </>}
    <span className="font-semibold uppercase tracking-wide text-gray-500">{KIND_LABEL[a.kind]}</span>
    {' · '}
    {a.source}
    {a.url && (
      <>
        {' '}
        <a href={a.url} target="_blank" rel="noopener noreferrer" className={LINK}>
          Source
        </a>
      </>
    )}
  </>
);

/** One figure in a results card. */
export const Stat = ({
  label,
  value,
  note,
  tone = 'ink',
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: 'ink' | 'bad';
}) => (
  <div className="rounded-xl border border-gray-200 p-4">
    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</dt>
    <dd className={`numeral mt-1 text-2xl font-semibold ${tone === 'bad' ? 'text-red-700' : 'text-ink'}`}>{value}</dd>
    {note && <p className="mt-1 text-xs leading-relaxed text-gray-500">{note}</p>}
  </div>
);

/** A small rounded label: a flag on a card, a kind of evidence. */
export const Chip = ({ children, title }: { children: ReactNode; title?: string }) => (
  <span
    title={title}
    className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700"
  >
    {children}
  </span>
);
