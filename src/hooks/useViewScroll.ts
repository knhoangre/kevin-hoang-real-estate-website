import { useEffect, useRef } from 'react';
import { useNavigationType } from 'react-router-dom';

/**
 * Back to the top when an admin page switches VIEW within its own URL — a list
 * to one application, a property, a tour, a client.
 *
 * Those views are a query string (`?id=`, `?property=`) on one route, and
 * ScrollToTop deliberately ignores a query string change, so that pressing Next
 * on /search does not throw the reader to the top. The cost was here: on a
 * phone, tapping a row near the bottom of a long list opened the next view
 * scrolled to the same depth, past its heading and often past its whole content.
 *
 * `view` is whatever names the view on screen. Back and Forward are left to the
 * browser, for the same reason ScrollToTop leaves them: the position it restores
 * is where the reader was.
 */
export const useViewScroll = (view: string) => {
  const navigationType = useNavigationType();
  const last = useRef(view);

  useEffect(() => {
    if (view === last.current) return;
    last.current = view;
    if (navigationType === 'POP') return;
    window.scrollTo(0, 0);
  }, [view, navigationType]);
};
