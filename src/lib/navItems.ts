/**
 * The site's navigation, in one place.
 *
 * The navbar used to hand-copy the same item markup twenty-three times — twelve
 * desktop, eleven mobile — which is why a fix to any one of them (real anchors,
 * the active state, the accent colour) had to be made twenty-three times or the
 * items diverged.
 */
export interface NavItem {
  to: string;
  /** i18n key, preferred. */
  labelKey?: string;
  /** Literal label, for the one item that has never been translated. */
  label?: string;
}

/**
 * The always-visible bar.
 *
 * /about is here rather than in the hamburger panel, and that is not a taste
 * call: the panel renders inside AnimatePresence and is closed by default, so
 * it does not exist in the prerendered HTML at all. An item there gains no
 * inbound link in the static graph and would still depend entirely on the
 * footer, which is where /about already was. /about also declares the #kevin
 * Person node referenced as `author` on every blog post, so it is the right
 * page to be one click from anywhere.
 */
export const PRIMARY_NAV: NavItem[] = [
  { to: '/properties', label: 'PROPERTIES' },
  { to: '/about', labelKey: 'nav.about' },
  { to: '/faq', labelKey: 'nav.faq' },
  { to: '/contact', labelKey: 'nav.contact' },
];

/** The hamburger panel on desktop; the top of the list on mobile. */
export const SECONDARY_NAV: NavItem[] = [
  { to: '/buyer', labelKey: 'nav.buyer' },
  { to: '/seller', labelKey: 'nav.seller' },
  { to: '/relocation', labelKey: 'nav.relocation' },
  { to: '/vietnamese-speaking-real-estate-agent', labelKey: 'nav.vietnamese' },
  { to: '/testimonials', labelKey: 'nav.testimonials' },
  { to: '/neighborhoods', labelKey: 'nav.neighborhoods' },
  { to: '/blog', labelKey: 'nav.blog' },
  { to: '/calculator', labelKey: 'nav.calculator' },
];

/**
 * Routes whose hero is `ink-deep`, so the bar must start transparent over them.
 *
 * This used to be `pathname === '/'` alone, which meant a solid white 80px bar
 * sat on top of the dark hero on /about, /relocation, the other landing pages
 * and all six /vi routes.
 */
const DARK_HERO_ROUTES = [
  '/',
  '/about',
  '/needham-real-estate-agent',
  '/home-valuation',
  '/vietnamese-speaking-real-estate-agent',
  '/relocation',
  '/vi',
];

/**
 * Prefix-aware, so a detail route lights up its section.
 * `pathname === '/blog'` was false on /blog/some-post, so every post, town
 * guide and Vietnamese page showed no active state anywhere in the nav.
 *
 * A pure function of `location`, therefore identical on the server and the
 * client — no hydration surface.
 */
export const isActivePath = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);

export const hasDarkHero = (pathname: string) =>
  DARK_HERO_ROUTES.some((r) => isActivePath(pathname, r));
