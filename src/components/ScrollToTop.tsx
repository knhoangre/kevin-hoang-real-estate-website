import { useEffect } from 'react';
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
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Back/Forward: the browser restores the saved position itself.
    if (navigationType === 'POP') return;
    // Anchor links own their own scroll target.
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
};

export default ScrollToTop;
