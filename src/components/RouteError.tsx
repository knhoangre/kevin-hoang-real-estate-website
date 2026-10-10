import { useEffect, useState } from 'react';
import { useRouteError } from 'react-router-dom';

/**
 * What the router shows when a page cannot be rendered — and, for the one cause
 * that is ours, the thing that fixes it without being seen.
 *
 * THE STALE TAB. Every deploy renames the script files (their names carry a
 * hash of their contents) and removes the old ones. A tab opened before a
 * deploy still holds the old names, so the first time it navigates to a page it
 * has not loaded yet, it asks for a file that no longer exists. Until
 * 2026-10-09 that ended on react-router's developer screen: "Unexpected
 * Application Error! Failed to fetch dynamically imported module", which Kevin
 * met on /admin/applications and /admin/properties after four deploys in two
 * days. The site was fine; the tab was old.
 *
 * By the time this renders, the router has already moved the address bar to the
 * page that failed, so a plain reload fetches that page's CURRENT document and
 * the current files with it. It is done ONCE: a second failure inside
 * RELOAD_WINDOW_MS means reloading is not the cure (offline, or a real fault),
 * and the page says so and stops. Without that guard a missing file is an
 * endless reload.
 *
 * WHAT THIS DOES NOT SEE. If the reloaded document cannot get its own script
 * either, the router never starts and this never renders: the visitor is left
 * on the prerendered page they asked for, unhydrated. That is no worse than
 * before, and it is not a loop. Checked on the built site, 2026-10-09: a file
 * missing once lands on the page after one reload; missing always, one reload
 * and the prerendered page; a second page's file missing a moment after the
 * first, this message.
 *
 * Only navigation is handled here. A dynamic import inside a page (pdf-lib
 * behind "Download PDF") fails the same way in a stale tab and is deliberately
 * left alone: reloading there would throw away whatever was half-typed.
 *
 * It replaces the whole layout — it is the root route's errorElement, so the
 * navbar and the providers are not rendered around it. That is why it carries
 * its own page and why its links are plain <a>s: the router that would handle a
 * <Link> is the thing that just failed.
 *
 * Vercel's own answer to this is Skew Protection, which is a paid-plan feature.
 */

/** The three browsers' wording for a module that would not load, and Vite's for its CSS. */
const STALE_FILE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

const RELOADED_AT = 'route-error-reloaded-at';
const RELOAD_WINDOW_MS = 15_000;

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : typeof error === 'string' ? error : '';

/** True when this failure has not already been answered with a reload a moment ago. */
const mayReload = (): boolean => {
  try {
    const last = Number(window.sessionStorage.getItem(RELOADED_AT) ?? 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOADED_AT, String(Date.now()));
    return true;
  } catch {
    // No sessionStorage (a private window with storage blocked) means no way to
    // remember having tried, and a reload that cannot be counted is a loop.
    return false;
  }
};

const RouteError = () => {
  const error = useRouteError();
  const stale = STALE_FILE.test(messageOf(error));
  // 'reloading' is the first render for a stale file, so the message below is
  // never flashed on the way to a reload that is about to replace the page.
  const [state, setState] = useState<'reloading' | 'shown'>(stale ? 'reloading' : 'shown');

  useEffect(() => {
    if (!stale) {
      console.error(error);
      return;
    }
    if (mayReload()) window.location.reload();
    else setState('shown');
  }, [stale, error]);

  if (state === 'reloading') {
    return (
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
  }

  return (
    <div className="flex min-h-screen items-center bg-ink-deep px-4 py-24">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-5 flex items-center gap-4">
          <span className="h-px w-10 bg-champagne" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-champagne">
            Something went wrong
          </p>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
          This page did not load
        </h1>
        <p className="mt-4 leading-relaxed text-gray-300">
          {stale
            ? 'The site was updated while this tab was open, and the page could not be fetched. Check your connection and reload.'
            : 'Reloading usually clears it. If it keeps happening, the homepage still works.'}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-deep transition-colors hover:bg-champagne"
          >
            Reload the page
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-champagne hover:text-champagne"
          >
            Go to the homepage
          </a>
        </div>
      </div>
    </div>
  );
};

export default RouteError;
