import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Home, KeyRound, LayoutDashboard, Users, Briefcase } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * The one chrome for the admin tools (/admin/*).
 *
 * These pages had each hand-rolled `container mx-auto px-4 pt-24` with a bare
 * `text-3xl font-bold` heading on white — the older, uncapped treatment the
 * public site was moved off of. This joins them to the same system PageShell
 * owns for the public routes: the ink-deep band, the champagne eyebrow, the
 * font-display h1, and one column width.
 *
 * It is deliberately NOT PageShell. That component emits <Seo>, a
 * BreadcrumbList and a CTA band, none of which belongs on a noindex tool page
 * — the head tags for these routes come from PrivatePage on the route shell.
 *
 * The admin gate lives here too, so each page stops repeating the same
 * loading spinner and `isAdmin` redirect three different ways.
 */

export interface ToolLink {
  to: string;
  label: string;
  /** Path prefix that marks this link current — `to` may be a deeper default. */
  match: string;
  /**
   * Match `match` exactly instead of as a prefix. The CRM dashboard needs this:
   * /crm is a prefix of /crm/contacts, so as a prefix it stayed lit on every
   * CRM page.
   */
  exact?: boolean;
  icon: LucideIcon;
  /** One line of purpose. Shown on the hub cards, not in the nav. */
  blurb?: string;
}

/**
 * The desk tools. One array, read by both this nav and the /admin hub, so a new
 * tool appears in both at once.
 *
 * CRM is deliberately absent. It is a destination with its own three-page
 * structure rather than something browsed alongside these, so it keeps its own
 * entry in the profile dropdown and renders this shell with CRM_LINKS instead.
 */
export const ADMIN_LINKS: ToolLink[] = [
  {
    to: '/admin/follow-up/open-house',
    label: 'Follow Up',
    match: '/admin/follow-up',
    icon: ClipboardList,
    blurb: 'Open house and event sign-ins, and messages sent through the site.',
  },
  {
    to: '/admin/properties',
    label: 'Properties',
    match: '/admin/properties',
    icon: Home,
    blurb: 'The sold-listings table behind /properties.',
  },
  {
    to: '/admin/lockboxes',
    label: 'Lockboxes',
    match: '/admin/lockboxes',
    icon: KeyRound,
    blurb: 'Every lockbox in the field, where it is, and the code on it.',
  },
];

/** The CRM's own nav. Same shell, different link set — see the `links` prop. */
export const CRM_LINKS: ToolLink[] = [
  { to: '/crm', label: 'Dashboard', match: '/crm', icon: LayoutDashboard, exact: true },
  { to: '/crm/contacts', label: 'Contacts', match: '/crm/contacts', icon: Users },
  { to: '/crm/deals', label: 'Deals', match: '/crm/deals', icon: Briefcase },
];

/**
 * Header-band buttons. They sit on ink-deep, where the shadcn Button variants
 * (all built for light surfaces) read wrong — hence plain <button>s and one
 * shared class builder rather than a class string copied per page.
 */
const ACTION_BASE =
  'inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50';

const ACTION_TONES = {
  primary: 'bg-white text-ink-deep hover:bg-champagne',
  ghost: 'border border-white/25 text-white hover:border-champagne hover:text-champagne',
  danger: 'border border-red-400/50 text-red-300 hover:bg-red-500 hover:text-white',
} as const;

export const adminActionClass = (tone: keyof typeof ACTION_TONES = 'ghost') =>
  `${ACTION_BASE} ${ACTION_TONES[tone]}`;

/**
 * Sized through Unsplash's params — a bare photo URL serves the multi-megabyte
 * original. Reused from the public heroes rather than introducing another
 * image, so it is already in cache for anyone who arrived through the site.
 */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=70';

/**
 * Dark, not bone: /admin and /crm are in DARK_HERO_PREFIX, so the navbar starts
 * transparent with white hamburger bars over them. On a light loading screen
 * those bars would be invisible, and there is nothing to scroll to correct it.
 */
export const AdminLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-ink-deep">
    <div className="text-center">
      <div
        className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-champagne border-t-transparent"
        aria-hidden
      />
      <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Loading</p>
    </div>
  </div>
);

const AdminShell = ({
  title,
  description,
  actions,
  eyebrow = 'Admin',
  links = ADMIN_LINKS,
  children,
}: {
  title: string;
  description?: string;
  /** Buttons for the header band — rendered on the dark surface. */
  actions?: React.ReactNode;
  /** Small label above the h1. CRM passes its own. */
  eyebrow?: string;
  /** Which nav to render. Defaults to the desk tools; CRM passes CRM_LINKS. */
  links?: ToolLink[];
  children: React.ReactNode;
}) => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  // useLocation, never window.location: this renders during static generation.
  const { pathname } = useLocation();

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [isAdmin, loading, navigate]);

  if (loading) return <AdminLoading />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-bone">
      {/*
        The same photographic dark hero the public pages use, rather than a flat
        panel. `pt-32` clears the fixed h-20 navbar, which runs OVER this band
        transparently and turns white on scroll — /admin and /crm are registered
        in DARK_HERO_PREFIX for exactly that.

        A real <img> rather than a CSS background, matching PageShell: a
        background-image is not discoverable by the preload scanner.
      */}
      <header className="relative isolate overflow-hidden bg-ink-deep pb-8 pt-32">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
          decoding="async"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-deep via-ink-deep/90 to-ink-deep/60"
          aria-hidden
        />
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-center gap-4">
              <span className="h-px w-10 bg-champagne" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-champagne">
                {eyebrow}
              </p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {title}
                </h1>
                {description && (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>

            <nav
              aria-label={`${eyebrow} tools`}
              className="mt-8 flex flex-wrap gap-x-7 gap-y-2 border-t border-white/10 pt-5"
            >
              {links.map((link) => {
                // NavLink's own isActive is deliberately ignored: several links
                // point at a deeper default than the section they represent
                // (Follow Up -> /admin/follow-up/open-house).
                const current = link.exact
                  ? pathname === link.match
                  : pathname === link.match || pathname.startsWith(`${link.match}/`);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`text-sm font-medium tracking-wide transition-colors ${
                      current ? 'text-champagne' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
};

/** A white card on the bone surface — the wrapper for tables and panels. */
export const AdminCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
  >
    {children}
  </div>
);

export default AdminShell;
