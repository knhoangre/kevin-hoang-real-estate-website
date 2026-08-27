import { Link } from 'react-router-dom';
import { isActivePath, type NavItem } from '@/lib/navItems';

export type NavTone = 'light' | 'dark';

/**
 * One navigation item.
 *
 * A real <Link>, not a <button onClick={navigate}>. The three top-level items
 * ARE in the prerendered HTML, and as buttons they emitted no href at all — so
 * /properties, /faq and /contact had zero inbound nav links in the static link
 * graph, and none of them could be middle-clicked or opened in a new tab.
 *
 * Active state is colour plus a persistent full-width underline, never a weight
 * change: bolding the current item reflows the whole nav row between pages.
 * Champagne is 8.3:1 on ink-deep but only 2.3:1 on white, so the light chrome
 * uses champagne-ink — same hue, 4.9:1. See the token table in tailwind.config.
 */
const NavLink = ({
  item,
  pathname,
  tone,
  label,
  className = '',
  onClick,
}: {
  item: NavItem;
  pathname: string;
  tone: NavTone;
  label: string;
  className?: string;
  onClick?: () => void;
}) => {
  const active = isActivePath(pathname, item.to);
  const dark = tone === 'dark';

  const text = active
    ? dark
      ? 'text-champagne'
      : 'text-champagne-ink'
    : dark
      ? 'text-white hover:text-champagne'
      : 'text-ink hover:text-champagne-ink';

  const rule = dark ? 'bg-champagne' : 'bg-champagne-ink';

  return (
    <Link
      to={item.to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative text-sm uppercase tracking-wider transition-colors ${text} ${className}`}
    >
      {label}
      {/* `w-0` and `w-full` used to be emitted in the same class list, and it
          only worked because `.w-full` happens to sort later in the generated
          stylesheet. They are mutually exclusive now. */}
      <span
        className={`absolute bottom-[-4px] left-1/2 h-0.5 -translate-x-1/2 transition-all duration-300 ${rule} ${
          active ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
      />
    </Link>
  );
};

export default NavLink;
