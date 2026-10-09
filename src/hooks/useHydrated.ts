import { useEffect, useState } from 'react';

/**
 * False for the render that hydrates the prerendered document, true from the
 * next one on.
 *
 * FOR ANYTHING THE GENERATOR COULD NOT KNOW. A page is prerendered once, at one
 * URL, with no query string, no viewer and no clock. The browser's first render
 * has to produce that same markup or React cannot hydrate it: it throws #418
 * for each mismatch and #423 for the page, discards the HTML and renders again
 * from nothing — which a visitor sees as the page flashing. So whatever depends
 * on the query string (or the hour, or the window) is read from its default on
 * the first render and from its real value once this turns true.
 *
 * /search is the case it was written for: `?town=Abington` is a link Kevin
 * sends, and the open-house email links to one. The prerendered /search has no
 * filters, so every such link threw fifteen errors and redrew itself, until
 * 2026-10-09.
 *
 * The cost is one extra render, a frame later — over a document that already
 * shows the defaults, so nothing is seen to change that was not going to. One
 * flag, in one place, says which render is the delicate one, rather than "read
 * the URL in an effect" spread through a page.
 */
export const useHydrated = (): boolean => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
};
