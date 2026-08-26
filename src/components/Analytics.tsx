import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import { SITE } from '@/lib/siteConfig';

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
