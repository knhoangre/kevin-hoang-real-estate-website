import { ChevronDown, ChevronRight, Calendar, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { AdminCard } from '@/components/AdminShell';

/**
 * The expandable sign-in list shared by Open Houses and Events.
 *
 * The two components rendered ~200 identical lines each, differing only in the
 * group's title, the noun, and the realtor line that only open houses carry.
 * That is now the `extraDetail` prop.
 *
 * Contact details stay real `mailto:` / `tel:` / `sms:` anchors so the
 * delegated click tracking in Analytics.tsx keeps counting them.
 */

export interface SignInRecord {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SignInGroup<T extends SignInRecord> {
  /** The address or the event name. */
  title: string;
  signIns: T[];
  count: number;
  unreadCount: number;
}

/**
 * `champagne-ink` rather than `champagne`: these links sit on white, where
 * #c5a572 measures 2.33:1 and fails WCAG at every size.
 */
export const LINK =
  'text-champagne-ink underline decoration-champagne underline-offset-4 hover:decoration-2';

const digits = (phone: string) => phone.replace(/\D/g, '');

/** The newest sign-in in a group, as a timestamp. */
const latest = (group: SignInGroup<SignInRecord>) =>
  group.signIns.reduce(
    (max, s) => Math.max(max, new Date(s.created_at).getTime()),
    0
  );

/**
 * Anything with unread sign-ins floats to the top, newest activity first — a
 * list ordered purely by address meant today's open house could be buried
 * halfway down. Everything already dealt with sinks below it in alphabetical
 * order, which is the order you use when you are looking for a specific one.
 */
export const orderGroups = <T extends SignInRecord>(groups: SignInGroup<T>[]) =>
  [...groups].sort((a, b) => {
    const aNew = a.unreadCount > 0;
    const bNew = b.unreadCount > 0;
    if (aNew !== bNew) return aNew ? -1 : 1;
    if (aNew) return latest(b) - latest(a);
    return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
  });

/** Within a group, unread first; each half stays newest-first. */
const orderSignIns = <T extends SignInRecord>(signIns: T[]) =>
  [...signIns].sort((a, b) => {
    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

const DetailLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-gray-500">
    {children}
  </span>
);

/**
 * The per-row controls, shared with MessagesList.
 *
 * The shadcn `outline` + `destructive` pair read as generic admin furniture and
 * put a saturated red block on every row — loud for the routine action, and the
 * one thing on the page competing with the unread signal. These are quiet pills
 * that commit to their colour only on hover.
 */
export const RowActions = ({
  isRead,
  onToggleRead,
  onDelete,
  label,
}: {
  isRead: boolean;
  onToggleRead: () => void;
  onDelete: () => void;
  /** Whose row this is — for the screen-reader-only part of each label. */
  label: string;
}) => (
  <div className="flex shrink-0 items-center gap-2">
    <button
      type="button"
      onClick={onToggleRead}
      className="rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-champagne hover:bg-champagne hover:text-ink-deep"
    >
      {isRead ? 'Mark unread' : 'Mark read'}
      <span className="sr-only"> — {label}</span>
    </button>
    <button
      type="button"
      onClick={onDelete}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      Delete
      <span className="sr-only"> — {label}</span>
    </button>
  </div>
);

const SignInGroups = <T extends SignInRecord>({
  groups,
  expanded,
  onToggle,
  onToggleRead,
  onDelete,
  extraDetail,
}: {
  groups: SignInGroup<T>[];
  expanded: Set<string>;
  onToggle: (title: string) => void;
  onToggleRead: (id: number, isRead: boolean) => void;
  onDelete: (id: number) => void;
  /** Per-record extra lines — the realtor detail on open houses. */
  extraDetail?: (signIn: T) => React.ReactNode;
}) => (
  <>
    {orderGroups(groups).map((group) => {
      const isExpanded = expanded.has(group.title);
      return (
        <AdminCard
          key={group.title}
          className={group.unreadCount > 0 ? 'border-l-4 border-l-champagne' : ''}
        >
          {/*
            A real <button> rather than a clickable card: this is what makes the
            group reachable by keyboard, and it is why the rows below no longer
            need a stopPropagation on every link.
          */}
          <button
            type="button"
            onClick={() => onToggle(group.title)}
            aria-expanded={isExpanded}
            className="flex w-full items-center gap-3 px-6 py-5 text-left transition-colors hover:bg-bone"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 shrink-0 text-champagne-ink" aria-hidden />
            ) : (
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
            )}
            <span className="min-w-0 flex-1">
              {/*
                Inter, not the Playfair display face. These titles are street
                addresses, so they are half numerals — and Playfair's figures
                sit at a different weight and height from its letters, which
                made "27 Elm Street" read as two mismatched halves. `lining-nums
                tabular-nums` keeps digits on one baseline at one width.
              */}
              <span className="block text-lg font-semibold tracking-tight text-ink lining-nums tabular-nums">
                {group.title}
              </span>
              <span className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden />
                  {group.count} {group.count === 1 ? 'sign-in' : 'sign-ins'}
                </span>
                {group.unreadCount > 0 && (
                  <span className="font-semibold text-red-700">
                    {group.unreadCount} unread
                  </span>
                )}
              </span>
            </span>
          </button>

          {isExpanded && (
            <div className="border-t border-gray-100 px-6 py-5">
              {/*
                `relative` + `hover:z-10` matter: the ring paints on the row's
                own box, and without a stacking bump the NEXT row's separator
                drew over the bottom edge of it — so the gold outline appeared
                open along the bottom.
              */}
              <ul className="divide-y divide-gray-100">
                {orderSignIns(group.signIns).map((signIn) => (
                  <li
                    key={signIn.id}
                    className={`relative rounded-lg border-l-2 py-4 pl-4 pr-3 transition-shadow hover:z-10 hover:ring-1 hover:ring-champagne ${
                      signIn.is_read ? 'border-gray-200' : 'border-champagne'
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-medium text-ink">
                          {signIn.first_name} {signIn.last_name}
                          {!signIn.is_read && (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white">
                              New
                            </span>
                          )}
                        </p>

                        <div className="mt-2 space-y-1.5 text-sm text-gray-700">
                          {signIn.email && (
                            <p className="flex flex-wrap items-center gap-2">
                              <DetailLabel>Email</DetailLabel>
                              <a href={`mailto:${signIn.email}`} className={LINK}>
                                {signIn.email}
                              </a>
                            </p>
                          )}
                          {signIn.phone && (
                            <p className="flex flex-wrap items-center gap-2">
                              <DetailLabel>Phone</DetailLabel>
                              <a href={`tel:${digits(signIn.phone)}`} className={LINK}>
                                {signIn.phone}
                              </a>
                              <span className="text-gray-300" aria-hidden>
                                |
                              </span>
                              <a href={`sms:${digits(signIn.phone)}`} className={LINK}>
                                Text
                              </a>
                            </p>
                          )}
                          {extraDetail?.(signIn)}
                          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-gray-500">
                            <Calendar className="h-3 w-3" aria-hidden />
                            {format(new Date(signIn.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>

                      <RowActions
                        isRead={signIn.is_read}
                        onToggleRead={() => onToggleRead(signIn.id, !signIn.is_read)}
                        onDelete={() => onDelete(signIn.id)}
                        label={`${signIn.first_name ?? ''} ${signIn.last_name ?? ''}`.trim()}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AdminCard>
      );
    })}
  </>
);

export { DetailLabel };
export default SignInGroups;
