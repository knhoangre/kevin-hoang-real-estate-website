import type { LucideIcon } from 'lucide-react';
import { AdminCard } from '@/components/AdminShell';

/** The same quiet pill the row actions use, for these one-off retry buttons. */
const PILL =
  'mt-6 rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-champagne hover:bg-champagne hover:text-ink-deep';

/**
 * The loading / error / empty states for the Follow Up lists.
 *
 * OpenHousesList, EventsList and MessagesList each hand-rolled these three,
 * differing only in the noun and the icon, on `border-b-2 border-gray-900`
 * spinners and default-blue cards that matched nothing else on the site.
 */

export const ListLoading = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center py-16">
    <div className="text-center">
      <div
        className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-champagne border-t-transparent"
        aria-hidden
      />
      <p className="text-sm uppercase tracking-[0.2em] text-gray-500">{label}</p>
    </div>
  </div>
);

export const ListError = ({
  message,
  onRetry,
  children,
}: {
  message: string;
  onRetry: () => void;
  /** Optional troubleshooting detail. */
  children?: React.ReactNode;
}) => (
  <AdminCard className="p-8">
    <div className="text-center">
      <p className="font-display text-xl font-semibold tracking-tight text-ink">
        Could not load this list
      </p>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      {children && (
        <div className="mx-auto mt-6 max-w-sm rounded-lg bg-bone p-4 text-left text-xs text-gray-600">
          {children}
        </div>
      )}
      <button type="button" onClick={onRetry} className={PILL}>
        Try again
      </button>
    </div>
  </AdminCard>
);

export const ListEmpty = ({
  icon: Icon,
  heading,
  onRefresh,
}: {
  icon: LucideIcon;
  heading: string;
  onRefresh: () => void;
}) => (
  <AdminCard className="p-12">
    <div className="text-center">
      <Icon className="mx-auto mb-5 h-10 w-10 text-gray-300" aria-hidden />
      <p className="font-display text-xl font-semibold tracking-tight text-ink">{heading}</p>
      <button type="button" onClick={onRefresh} className={PILL}>
        Refresh
      </button>
    </div>
  </AdminCard>
);

/**
 * The unread summary strip. The count keeps the red `destructive` treatment —
 * that is a status signal, and recolouring it to the brand accent would delete
 * the signal. The champagne is the rule beside it, not the alert.
 */
export const UnreadBanner = ({ count, noun }: { count: number; noun: string }) => {
  if (count <= 0) return null;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 border-l-4 border-l-champagne bg-white px-5 py-4">
      <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
        {count}
      </span>
      <span className="text-sm font-medium text-ink">
        unread {count === 1 ? noun : `${noun}s`}
      </span>
    </div>
  );
};
