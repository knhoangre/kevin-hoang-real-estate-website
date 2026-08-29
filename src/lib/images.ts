/**
 * Image URL helpers.
 *
 * The one job here is keeping the image a page SHOWS separate from the image it
 * DECLARES to social and AI crawlers. Those want different sizes, and conflating
 * them shipped a real defect: <Seo> hardcodes og:image:width/height as 1200x630,
 * while three callers passed something else entirely —
 *
 *   BlogPost.tsx           post.image           800x500   (48 pages)
 *   NeighborhoodDetail.tsx neighborhood.image   500x300   (17 pages)
 *   About.tsx              /kevin_hoang.jpg     750x1125  portrait
 *
 * 500x300 is below Facebook's 600x315 floor and far below what Twitter's
 * summary_large_image needs, so those town guides unfurled as a small thumbnail
 * or not at all — while claiming to be 1200x630.
 *
 * The fix is NOT to raise the sizes in src/data/*.ts: those URLs also feed the
 * on-page <img>, and shipping a 1200px file into a 500px card would trade a
 * social bug for an LCP one. Instead the card size is derived here, at the point
 * of use.
 */

/** Open Graph's expected card size. Matches the constants in Seo.tsx. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const UNSPLASH_HOST = 'images.unsplash.com';

/**
 * Re-parameterizes an Unsplash URL to a given size.
 *
 * Every Unsplash URL on this site already carries `?auto=format&fit=crop&w=…`,
 * because a bare `images.unsplash.com/photo-…` serves the multi-megabyte
 * original — that was once the homepage LCP element. This rewrites the sizing
 * params on an existing URL rather than assembling one, so `auto=format` and any
 * other params survive.
 *
 * Returns non-Unsplash URLs unchanged: there is no generic way to resize an
 * arbitrary host's image, and silently returning a URL that does not resolve is
 * worse than returning the original.
 */
export const unsplashVariant = (
  url: string,
  { w, h, q }: { w: number; h?: number; q?: number }
): string => {
  if (!url || !url.includes(UNSPLASH_HOST)) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('w', String(w));
    if (h != null) parsed.searchParams.set('h', String(h));
    else parsed.searchParams.delete('h');
    if (q != null) parsed.searchParams.set('q', String(q));
    return parsed.toString();
  } catch {
    // A malformed URL is a data problem, not a rendering problem. Returning it
    // untouched keeps the page rendering the same (broken) image it always did
    // rather than throwing during static generation and failing the build.
    return url;
  }
};

/**
 * The 1200x630 Open Graph variant of a content image.
 *
 * Use this at every `<Seo ogImage=…>` call site whose image comes from the
 * content data rather than from a purpose-built card. `q=70` because an OG image
 * is decoration in someone else's feed — it never needs to be visually lossless,
 * and unfurlers commonly re-encode it anyway.
 *
 * A non-Unsplash path (a local file such as /og-image.jpg) passes through, so
 * the caller stays responsible for those being 1200x630 already. That is why
 * /about gets a generated og-about.jpg rather than reusing the portrait photo.
 */
export const ogVariant = (url: string): string =>
  unsplashVariant(url, { w: OG_WIDTH, h: OG_HEIGHT, q: 70 });

/**
 * The homepage hero, at the exact parameters the CSS background requests.
 *
 * Exported so <Hero> and the `<link rel="preload">` on the homepage reference
 * ONE string. A preload whose URL differs from the one the stylesheet asks for
 * by even a query parameter is a second, wasted download rather than a warmed
 * cache entry, and nothing in the build would catch the divergence.
 *
 * This preload belongs to the homepage alone. It previously lived in index.html
 * — the shared shell — so all ~122 prerendered pages fetched this ~150KB file at
 * high priority, and on every page with its own hero it beat that page's real
 * LCP image to the network purely because it was discovered earlier in the head.
 */
export const HOME_HERO_IMAGE =
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1920&q=70';
