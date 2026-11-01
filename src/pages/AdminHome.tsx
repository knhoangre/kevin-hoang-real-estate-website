import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminShell, { ADMIN_LINKS, TOOL_GROUPS } from '@/components/AdminShell';
import CountBadge from '@/components/CountBadge';
import { useAdminCounts } from '@/hooks/useAdminCounts';

/**
 * The admin front door.
 *
 * Before this, /admin only redirected into Follow Up and the profile dropdown
 * was the only map of the tools that existed anywhere — so the dropdown had to
 * carry every one of them. The desk tools live here instead; the dropdown keeps
 * only what is genuinely worth a shortcut.
 *
 * The tool cards are built from ADMIN_LINKS, the same array the shell's nav
 * reads, so a new tool cannot appear in one and be forgotten in the other.
 *
 * EVERY GROUP HAS A HEADING. The kiosks had one and the desk tools above them
 * did not, so the page read as a titled section under an untitled pile. The
 * desk tools are now two headed groups (TOOL_GROUPS) and all three share one
 * grid, so a card is the same width wherever it sits.
 */

/**
 * The kiosks are a separate group on purpose. They put a tablet into sign-in
 * mode at a door, which is a different job from the desk tools above, and they
 * are the reason those two keep their dropdown shortcuts.
 */
const KIOSKS: { to: string; label: string; icon: LucideIcon; blurb: string }[] = [
  {
    to: '/open-house',
    label: 'Open House Sign-In',
    icon: ClipboardList,
    blurb: 'Hand the tablet to visitors at the door.',
  },
  {
    to: '/events',
    label: 'Events Sign-In',
    icon: CalendarDays,
    blurb: 'The same sign-in, for an event rather than a listing.',
  },
];

/** One grid for every group: equal cards are most of what makes them one page. */
const GRID = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4';

const ToolCard = ({
  to,
  label,
  blurb,
  icon: Icon,
  badge = 0,
  badgeLabel = '',
}: {
  to: string;
  label: string;
  blurb?: string;
  icon: LucideIcon;
  badge?: number;
  badgeLabel?: string;
}) => (
  <Link
    to={to}
    className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-champagne"
  >
    <div className="flex items-start justify-between gap-3">
      <Icon className="h-6 w-6 text-champagne-ink" aria-hidden />
      <CountBadge count={badge} label={badgeLabel} className="text-xs" />
    </div>
    {/* h3: the group's heading above it is the h2. */}
    <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">{label}</h3>
    {blurb && <p className="mt-2 text-sm leading-relaxed text-gray-600">{blurb}</p>}
  </Link>
);

const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className="mt-14 first:mt-0">
    <div className="mb-6 flex items-center gap-4">
      <span className="h-px w-10 bg-champagne" aria-hidden />
      <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-champagne-ink">
        {label}
      </h2>
    </div>
    <div className={GRID}>{children}</div>
  </section>
);

const AdminHome = () => {
  const { unread, toConfirm } = useAdminCounts();

  /** The two tools with something waiting on Kevin. */
  const badgeFor = (match: string) => {
    if (match === '/admin/follow-up') return { badge: unread, badgeLabel: 'unread' };
    if (match === '/admin/showings') return { badge: toConfirm, badgeLabel: 'clients to confirm today' };
    return {};
  };

  return (
    <AdminShell title="Admin" description="Everything behind the site, in one place.">
      {TOOL_GROUPS.map((group) => (
        <Group key={group.id} label={group.label}>
          {ADMIN_LINKS.filter((link) => link.group === group.id).map((link) => (
            <ToolCard
              key={link.to}
              to={link.to}
              label={link.label}
              blurb={link.blurb}
              icon={link.icon}
              {...badgeFor(link.match)}
            />
          ))}
        </Group>
      ))}

      <Group label="Sign-in kiosks">
        {KIOSKS.map((kiosk) => (
          <ToolCard key={kiosk.to} {...kiosk} />
        ))}
      </Group>
    </AdminShell>
  );
};

export default AdminHome;
