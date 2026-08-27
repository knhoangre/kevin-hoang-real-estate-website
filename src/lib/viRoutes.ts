/**
 * The Vietnamese route tree and its pairing with the English pages.
 *
 * Why these exist as real prerendered routes rather than the language toggle:
 * the toggle swaps copy AFTER hydration, so not one word of Vietnamese was in
 * any prerendered document. No crawler and no answer engine had ever seen it.
 * For a genuine differentiator in a market with almost no Vietnamese-language
 * real estate content, that was the largest single gap on the site.
 *
 * ONE SOURCE FOR THE PAIRING. hreflang only works when it is reciprocal —
 * every page in a set must list every member including itself, or the set is
 * discarded. Deriving both sides from this map is what makes that structurally
 * true rather than something to remember.
 *
 * Adding a route here is not enough on its own. It also needs an entry in
 * src/AppRoutes.tsx and in scripts/routes.mjs, or it has no prerendered file
 * and 404s on hard refresh.
 */
export interface ViRoute {
  /** Vietnamese path. */
  vi: string;
  /** The English page this is the Vietnamese counterpart of. */
  en: string;
}

export const VI_ROUTES: ViRoute[] = [
  { vi: '/vi', en: '/' },
  { vi: '/vi/mua-nha', en: '/buyer' },
  { vi: '/vi/ban-nha', en: '/seller' },
  { vi: '/vi/dinh-gia-nha', en: '/home-valuation' },
  { vi: '/vi/cau-hoi-thuong-gap', en: '/faq' },
  { vi: '/vi/khu-vuc', en: '/neighborhoods' },
];

/** `{ en, vi }` for a path on either side of a pair, or undefined if unpaired. */
export const alternatesFor = (path: string): Record<string, string> | undefined => {
  const pair = VI_ROUTES.find((r) => r.vi === path || r.en === path);
  return pair ? { en: pair.en, vi: pair.vi } : undefined;
};
