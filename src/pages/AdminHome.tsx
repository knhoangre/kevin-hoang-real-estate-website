import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminShell, { ADMIN_LINKS } from '@/components/AdminShell';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';

/**
 * The admin front door.
 *
 * Before this, /admin only redirected into Follow Up and the profile dropdown
 * was the only map of the tools that existed anywhere — so the dropdown had to
 * carry every one of them. The desk tools live here instead; the dropdown keeps
 * only what is genuinely worth a shortcut.
 *
 * The three tool cards are built from ADMIN_LINKS, the same array the shell's
 * nav reads, so a new tool cannot appear in one and be forgotten in the other.
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

const ToolCard = ({
  to,
  label,
  blurb,
  icon: Icon,
  badge,
}: {
  to: string;
  label: string;
  blurb?: string;
  icon: LucideIcon;
  badge?: number;
}) => (
  <Link
    to={to}
    className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-champagne"
  >
    <div className="flex items-start justify-between gap-3">
      <Icon className="h-6 w-6 text-champagne-ink" aria-hidden />
      {badge ? (
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
          {badge}
          <span className="sr-only"> unread</span>
        </span>
      ) : null}
    </div>
    <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">
      {label}
    </h2>
    {blurb && <p className="mt-2 text-sm leading-relaxed text-gray-600">{blurb}</p>}
  </Link>
);

const AdminHome = () => {
  const { unreadCounts } = useUnreadCounts();

  /** Follow Up is the only tool with anything unread to report. */
  const badgeFor = (match: string) =>
    match === '/admin/follow-up' ? unreadCounts.total : undefined;

  return (
    <AdminShell title="Admin" description="Everything behind the site, in one place.">
      <div className="grid gap-6 md:grid-cols-3">
        {ADMIN_LINKS.map((link) => (
          <ToolCard
            key={link.to}
            to={link.to}
            label={link.label}
            blurb={link.blurb}
            icon={link.icon}
            badge={badgeFor(link.match)}
          />
        ))}
      </div>

      <div className="mt-14">
        <div className="mb-6 flex items-center gap-4">
          <span className="h-px w-10 bg-champagne" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-champagne-ink">
            Sign-in kiosks
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {KIOSKS.map((kiosk) => (
            <ToolCard key={kiosk.to} {...kiosk} />
          ))}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminHome;
