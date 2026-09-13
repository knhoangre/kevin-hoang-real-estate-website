/**
 * The Instagram video gallery behind /videos.
 *
 * Hand-maintained, like blogData.ts and unlike soldListings.ts. There is no
 * sync script and deliberately no Supabase table: the reels themselves stay
 * hosted on Instagram (their bandwidth, not ours), and the only thing this site
 * holds is a small committed poster frame plus the text below. Video is orders
 * of magnitude heavier than photographs, and serving it out of Supabase Storage
 * would repeat — at much greater cost — the egress mistake that /properties
 * made with 339 full-resolution PNGs.
 *
 * ADDING A REEL
 *   1. Open the reel on instagram.com and copy the shortcode out of the URL:
 *      https://www.instagram.com/reel/DAbc123xyz/  ->  id: 'DAbc123xyz'
 *   2. Screenshot a good frame and save it to
 *      public/videos/_src/<id>.(png|jpg|jpeg|webp)
 *   3. Add an entry below, NEWEST FIRST.
 *   4. Run `node scripts/generate-video-posters.mjs` and commit what it writes.
 *
 * WRITING THE COPY. `title` and `description` are ours, not Instagram's. A
 * pasted caption is emoji and hashtags, which is not indexable text and reads
 * badly on a light page; this is the only prose on the page, so it is what the
 * page is actually worth. The site's content rules apply in full — describe
 * what is genuinely in the video and invent no statistic, sale count or claim
 * to pad it out. Under the topical-distinctness rule no `title` may repeat an
 * <h1> or <h2> used elsewhere on the site.
 */

export type Video = {
  /**
   * Instagram shortcode from the permalink. Also the poster filename, which is
   * why it is not a free-text slug — the two must not be able to drift.
   */
  id: string;
  /** Decides the /reel/ vs /p/ path. Reels are the common case. */
  kind: 'reel' | 'post';
  /** Our own one-line title. Becomes the card's <h3> and VideoObject.name. */
  title: string;
  /** One or two sentences: what a viewer actually gets out of watching it. */
  description: string;
  /** ISO date the reel was posted (YYYY-MM-DD). Drives VideoObject.uploadDate. */
  date: string;
  /** Optional town, for a future filter. Omitted where the video is general. */
  town?: string;
};

/**
 * Newest first. `videos.ts` is the whole registry — the poster script prunes
 * any file under public/videos/ that no entry here references, so removing an
 * entry is how a reel is taken down.
 */
export const videos: Video[] = [
  // Template — copy, fill in, delete this comment block.
  //
  // {
  //   id: 'DAbc123xyz',
  //   kind: 'reel',
  //   title: 'Walking through a Needham colonial before it hits the market',
  //   description:
  //     'A walkthrough of what to look at first in an older Needham colonial: '
  //     + 'the basement, the roofline and the windows, in that order.',
  //   date: '2026-08-14',
  //   town: 'Needham',
  // },
];

/** The public Instagram URL for a video. The one place this string is built. */
export const permalink = (v: Video): string =>
  `https://www.instagram.com/${v.kind === 'reel' ? 'reel' : 'p'}/${v.id}/`;

/**
 * Instagram's embeddable player. Loaded into an iframe ONLY after a click —
 * see VideoLightbox. `captioned` gives the embed its own caption and controls.
 */
export const embedSrc = (v: Video): string => `${permalink(v)}embed/captioned/`;

/** Card poster, written by scripts/generate-video-posters.mjs. */
export const posterHref = (v: Video): string => `/videos/${v.id}.webp`;

/**
 * Social card, 1200x630, also written by that script. <Seo> declares those
 * dimensions and CLAUDE.md is emphatic that whatever is passed must actually be
 * that size — the 720px portrait poster would unfurl as a thumbnail or not at
 * all.
 */
export const ogHref = (v: Video): string => `/videos/${v.id}-og.jpg`;
