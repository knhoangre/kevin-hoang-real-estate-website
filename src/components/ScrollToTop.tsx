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
 * results on a page change, and this overrode it. So the last path scrolled
 * for is remembered, and a run where it has not moved does nothing.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const lastPlace = useRef(`${pathname}${hash}`);

  useEffect(() => {
    const place = `${pathname}${hash}`;
    // Same page: only the query string or the navigation type moved.
    if (place === lastPlace.current) return;
    lastPlace.current = place;

    // Back/Forward: the browser restores the saved position itself.
    if (navigationType === 'POP') return;
    // Anchor links own their own scroll target.
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
};

export default ScrollToTop;
