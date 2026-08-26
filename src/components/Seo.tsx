// vite-react-ssg's <Head> is a thin wrapper around react-helmet-async's
// <Helmet>. Importing it from here rather than from react-helmet-async
// directly guarantees we share the single module instance whose HelmetProvider
// vite-react-ssg mounts — on the client and during static generation.
// Importing react-helmet-async ourselves yields a second copy with its own
// React context, and head tags silently fail to register at build time.
import { Head } from 'vite-react-ssg';
import { useLocation } from 'react-router-dom';
import { SITE, absoluteUrl } from '@/lib/siteConfig';

export interface SeoProps {
  /** Page-specific title. The brand suffix is appended unless it already contains a pipe. */
  title: string;
  description: string;
  keywords?: string;
  /** Overrides the route-derived canonical. Rarely needed. */
  canonical?: string;
  /** Site-relative path or absolute URL. Defaults to SITE.defaultOgImage. */
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  /** One JSON-LD object or several. Each is emitted as its own script tag. */
  jsonLd?: object | object[];
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
  };
}

// SITE.name is the Google Business Profile name and already contains a pipe, so
// the shorter titleSuffix is what goes in <title>. og:site_name still uses the
// full profile name below.
const withBrand = (title: string) =>
  title.includes('|') ? title : `${title} | ${SITE.titleSuffix}`;

/**
 * Escapes `<` so a `</script>` sequence inside JSON-LD content cannot break out
 * of the script tag.
 */
const serializeJsonLd = (data: object) =>
  JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * Single source of truth for per-page head tags: title, description, canonical,
 * Open Graph, Twitter, robots, and JSON-LD.
 *
 * Every page uses this rather than reaching for Helmet directly — it is what
 * keeps the OG and Twitter blocks from drifting away from the title and
 * description, and what guarantees a self-referencing canonical on every route.
 */
const Seo = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  jsonLd,
  article,
}: SeoProps) => {
  const { pathname } = useLocation();
  const fullTitle = withBrand(title);
  const canonicalUrl = canonical ? absoluteUrl(canonical) : absoluteUrl(pathname);
  const imageUrl = absoluteUrl(ogImage ?? SITE.defaultOgImage);
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content={SITE.locale} />

      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && <meta property="article:author" content={article.author} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {serializeJsonLd(schema)}
        </script>
      ))}
    </Head>
  );
};

export default Seo;
