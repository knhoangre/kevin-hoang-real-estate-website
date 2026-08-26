import Seo from '@/components/Seo';

/**
 * Wrapper for gated / utility routes.
 *
 * These routes ARE prerendered, deliberately. Excluding them instead makes the
 * host's SPA fallback serve some other page's markup at their URLs, which then
 * hydrates against the wrong tree. They are kept out of search by this
 * `noindex` plus the matching Disallow rules in public/robots.txt, and they are
 * excluded from the sitemap by isPrivate() in scripts/routes.mjs.
 *
 * The noindex lives out here on the route shell rather than inside the page,
 * because at build time there is no session — the gated content never renders
 * into the static HTML, so its own <Seo> would never be emitted.
 */
const PrivatePage = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <>
    <Seo title={title} description="Private page." noindex />
    {children}
  </>
);

export default PrivatePage;
