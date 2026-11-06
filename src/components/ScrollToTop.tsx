import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Global scroll manager. Rendered once, in the root layout.
 *
 * Correct behaviour is NOT "always scroll to top":
 *   - PUSH/REPLACE (clicking a link)  -> jump to the top of the new page
 *   - POP (Back/Forward)              -> restore where the user actually was
 *
 * This used to scroll to top on every pathname change, which fired on POP too
 * and dumped you at the top of the previous page instead of back at the link
 * you clicked. It also used `behavior: 'smooth'`, which animates the scroll
 * after the new page has already painted — so a back-navigation visibly slid
 * away from the position the browser had just restored.
 *
 * Effect-only rather than react-router's <ScrollRestoration/>: that component
 * injects an inline script that runs before hydration, and this site is fully
 * prerendered. Letting the browser's native history.scrollRestoration ('auto')
 * handle POP keeps the hydration surface at zero.
 *
 * Do not reintroduce per-page `useEffect(() => window.scrollTo(0, 0))`. Those
 * fire on POP as well and defeat this.
 *
 * ONLY WHEN THE PAGE ACTUALLY CHANGED. The navigation type is in the effect's
 * dependencies, because the effect reads it — and it changes on its own. Every
 * visit starts as POP; the first thing done on the page that only alters the
 * query string (pressing Next on /search, applying a filter) turns it into
 * PUSH. The effect re-ran for that, saw "not POP", and sent the reader to the
 * top of the document — once per visit, on the first press only, which is why
 * it looked like nothing in particular. /search scrolls to the top of its own
 * results on a page change, and this overrode it. So the last place is
 * remembered, and a navigation that moved only the query string does nothing.
 *
 * Keyed on the navigation (location.key), not on the address alone, since
 * 2026-11-06: a <Link> to the hash already in the address bar is a navigation
 * that changes nothing else, and the form it points at has to be scrolled to.
 */
const ScrollToTop = () => {
  const { pathname, search, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const last = useRef({ pathname, search, hash, key });

  useEffect(() => {
    const prev = last.current;
    last.current = { pathname, search, hash, key };
    // Nothing navigated: the first render, or only the navigation type moved.
    if (key === prev.key) return;
    // Back/Forward: the browser restores the saved position itself.
    if (navigationType === 'POP') return;

    const pathMoved = pathname !== prev.pathname;
    const onlyQuery = !pathMoved && hash === prev.hash && search !== prev.search;

    if (hash) {
      if (onlyQuery) return;
      // A plain <a href="#x"> is scrolled by the browser and arrives here as
      // POP. A <Link> to a hash is a PUSH that nothing scrolls — the homepage's
      // "Selling a home" goes to /home-valuation#request, and the band at the
      // foot of that page links up to the same form — so the target is found
      // here, once the page has rendered, which it has by the time this runs.
      // By the navigation's key, not the address: pressing the band's link
      // when the address already ends in #request changes nothing else.
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) target.scrollIntoView();
      else if (pathMoved) window.scrollTo(0, 0);
      return;
    }
    // Same page: only the query string moved (Next on /search, a filter).
    if (!pathMoved && hash === prev.hash) return;
    window.scrollTo(0, 0);
  }, [pathname, search, hash, key, navigationType]);

  return null;
};

export default ScrollToTop;
