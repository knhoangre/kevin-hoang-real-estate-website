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
  { to: '/testimonials', labelKey: 'nav.testimonials' },
  { to: '/neighborhoods', labelKey: 'nav.neighborhoods' },
  { to: '/blog', labelKey: 'nav.blog' },
  { to: '/calculator', labelKey: 'nav.calculator' },
  // Last on purpose. It is the service page ABOUT Vietnamese-language help,
  // written in English — distinct from the /vi tree below it in the panel,
  // which is the same site written IN Vietnamese.
  { to: '/vietnamese-speaking-real-estate-agent', labelKey: 'nav.vietnamese' },
];

/**
 * Routes whose hero is `ink-deep`, so the bar must start transparent over them
 * and turn white on scroll.
 *
 * Exact matches, not prefixes: `/blog` has a dark hero but `/blog/a-post` does
 * not, and the same goes for `/neighborhoods` and its town guides. Those detail
 * pages still use the older light chrome.
 */
const DARK_HERO_EXACT = new Set([
  '/',
  '/about',
  '/needham-real-estate-agent',
  '/home-valuation',
  '/vietnamese-speaking-real-estate-agent',
  '/relocation',
  '/faq',
  '/properties',
  '/buyer',
  '/seller',
  '/blog',
  '/neighborhoods',
  '/testimonials',
  '/contact',
  '/calculator',
  '/first-time-buyers',
]);

/**
 * `/vi` and every page under it is a ViPage, and they all have dark heroes.
 * `/admin` and `/crm` render AdminShell, whose header band is the same dark
 * photographic treatment, so the bar starts transparent over those too.
 */
const DARK_HERO_PREFIX = ['/vi', '/admin', '/crm'];

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

export const hasDarkHero = (pathname: string) => {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  return (
    DARK_HERO_EXACT.has(path) ||
    DARK_HERO_PREFIX.some((p) => path === p || path.startsWith(`${p}/`))
  );
};
