import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import { SITE } from '@/lib/siteConfig';
import { EVENTS, analyticsPath, isInternalPath, track } from '@/lib/analytics';

/**
 * Google Analytics 4 + Search Console verification.
 *
 * Driven entirely by SITE.ga4Id / SITE.gscVerification so nothing is injected
 * while they are empty — the site is safe to ship un-configured. Emitted
 * through <Head> so the tags are baked into every prerendered page's <head>,
 * not added only after hydration.
 *
 * GA is configured with send_page_view:false and page views fire manually on
 * each route change, because after hydration the app is client-routed and the
 * browser never reloads — a single automatic page_view would miss every in-app
 * navigation.
 */
const GA_ENABLED = /^G-[A-Z0-9]{6,}$/.test(SITE.ga4Id);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * The page_location to report: our origin, plus the redacted path.
 *
 * Never window.location.href. That carries the query string, which holds the
 * PKCE `code` on /auth/callback, and the raw pathname, which holds a rental
 * invite token on /apply/<token>. See analyticsPath().
 */
const pageLocation = (pathname: string) =>
  `${window.location.origin}${analyticsPath(pathname)}`;

const Analytics = () => {
  const { pathname } = useLocation();

  /*
    The page_view, deferred by one frame.

    <Seo> sets the title through <Head>, which commits it in an effect of its
    own. This component is mounted ABOVE <Outlet/> in App.tsx, so without the
    deferral its effect flushes first and GA4 — which reads document.title at
    send time — records every client-side navigation under the PREVIOUS page's
    title. rAF rather than moving the component down the tree: the ordering
    would silently rebreak the next time App.tsx is rearranged.
  */
  useEffect(() => {
    if (!GA_ENABLED || typeof window.gtag !== 'function') return;
    if (isInternalPath(pathname)) return;

    const frame = requestAnimationFrame(() => {
      window.gtag?.('event', 'page_view', {
        page_location: pageLocation(pathname),
        page_title: document.title,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  /*
    Contact-intent tracking, by delegation from the document.

    Every tel:, sms: and scheduling link on the site is caught here, rather than
    by adding an onClick to each of the ~25 anchors that carry one. Three
    reasons: those anchors live in 12 files and no two share a className, so
    wrapping them in a component risks a styling regression on each; a link
    added later is covered automatically instead of being silently untracked;
    and the tracking stays in the file that owns analytics rather than leaking a
    concern into the footer, the navbar and the hero.

    Delegation is safe for these specifically because none of them are
    JS-navigated — they are real hrefs the browser handles, so a listener that
    throws or a blocked gtag cannot prevent the call from being placed.
  */
  useEffect(() => {
    if (!GA_ENABLED) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href') ?? '';

      /*
        page_location, not page_path. `page_path` is a Universal Analytics
        parameter — GA4 has no such built-in, so it landed as an unregistered
        custom parameter and was dropped from every report, exactly like
        traffic_source is until registered. The effect was that "which page
        produced this phone call" could not be answered at all.
      */
      const where = { page_location: pageLocation(pathname) };

      if (href.startsWith('tel:')) track(EVENTS.call, where);
      else if (href.startsWith('sms:')) track(EVENTS.text, where);
      else if (SITE.appointmentUrl && href.startsWith(SITE.appointmentUrl)) {
        track(EVENTS.appointment, where);
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pathname]);

  return (
    <Head>
      {SITE.gscVerification ? (
        <meta name="google-site-verification" content={SITE.gscVerification} />
      ) : null}
      {GA_ENABLED ? (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${SITE.ga4Id}`} />
      ) : null}
      {GA_ENABLED ? (
        <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${SITE.ga4Id}',{send_page_view:false});`}</script>
      ) : null}
    </Head>
  );
};

export default Analytics;
