import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import { SITE } from '@/lib/siteConfig';
import { EVENTS, track } from '@/lib/analytics';

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

const Analytics = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!GA_ENABLED || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', { page_path: pathname });
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

      if (href.startsWith('tel:')) track(EVENTS.call, { page_path: pathname });
      else if (href.startsWith('sms:')) track(EVENTS.text, { page_path: pathname });
      else if (SITE.appointmentUrl && href.startsWith(SITE.appointmentUrl)) {
        track(EVENTS.appointment, { page_path: pathname });
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
