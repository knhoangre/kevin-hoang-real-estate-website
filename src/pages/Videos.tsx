import React, { useState } from 'react';
import { Play, Instagram, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell, { ShellSection } from '@/components/PageShell';
import VideoLightbox from '@/components/VideoLightbox';
import { agentIdentity, person, itemList, videoObject } from '@/lib/schema';
import { SITE, absoluteUrl } from '@/lib/siteConfig';
import { videos, permalink, embedSrc, posterHref, ogHref, type Video } from '@/data/videos';

/** The Instagram profile, read from the one profile list rather than retyped. */
const instagramUrl =
  SITE.profiles.find((p) => p.name === 'Instagram')?.url ?? 'https://www.instagram.com/';

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

/**
 * One card. Prerendered content in full: the poster, the title, the description
 * and the date are all real HTML, and the wrapper is a real <a> to the reel on
 * Instagram. The click handler upgrades that to the in-page player, which is
 * progressive enhancement rather than a <div onClick> — with JavaScript off, or
 * for a crawler, the card is still a working link to the video.
 *
 * Nothing may nest inside the anchor: a second <a> in here auto-closes the
 * outer one during parsing, and the server markup then cannot match the client
 * tree, which fails hydration for the whole page.
 */
const VideoCard = ({
  video,
  index,
  onOpen,
}: {
  video: Video;
  index: number;
  onOpen: (v: Video) => void;
}) => (
  <a
    href={permalink(video)}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => {
      // Leave the modified clicks alone — cmd/ctrl/middle-click should open
      // Instagram in a new tab, which is what the href already does.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      onOpen(video);
    }}
    className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne enter"
    style={{ '--enter-delay': `${Math.min(index, 8) * 0.06}s` } as React.CSSProperties}
  >
    <div className="relative aspect-[9/16] overflow-hidden bg-gray-100">
      <img
        src={posterHref(video)}
        alt={`Still frame from “${video.title}”`}
        width={720}
        height={1280}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink-deep/60 via-transparent to-transparent"
        aria-hidden
      />
      {/*
        Champagne as a non-text MARK, which is the only thing it may be on a
        light surface — at 2.33:1 on white it fails WCAG as text at every size.
      */}
      <span
        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-champagne text-ink-deep shadow-lg transition-transform duration-300 group-hover:scale-110"
        aria-hidden
      >
        <Play className="ml-0.5 h-6 w-6 fill-current" />
      </span>
    </div>

    <div className="p-5">
      <h3 className="font-display text-lg font-semibold leading-snug text-ink">
        {video.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{video.description}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gray-500">
        {video.town ? `${video.town} · ` : ''}
        {formatDate(video.date)}
      </p>
    </div>
  </a>
);

/**
 * /videos — the Instagram reels, watchable without leaving the site.
 *
 * The reels stay on Instagram's infrastructure and this page holds only a
 * committed 720px poster and our own copy per video, so it costs nothing in
 * Supabase egress and loads no third-party code until somebody clicks. See
 * src/data/videos.ts for the reasoning and for how to add one.
 */
const Videos = () => {
  const [active, setActive] = useState<Video | null>(null);

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Videos', path: '/videos' },
  ];

  const jsonLd = [
    agentIdentity(),
    // videoObject().creator points at #kevin, and an @id only resolves against
    // a node declared in the SAME document — so the Person node is emitted
    // here rather than left dangling.
    person(),
    ...(videos.length
      ? [
          itemList(videos.map((v) => ({ name: v.title, url: '/videos' }))),
          ...videos.map((v) =>
            videoObject({
              id: v.id,
              title: v.title,
              description: v.description,
              date: v.date,
              permalink: permalink(v),
              embedUrl: embedSrc(v),
              thumbnail: ogHref(v),
            })
          ),
        ]
      : []),
  ];

  return (
    <PageShell
      path="/videos"
      crumbs={crumbs}
      seo={{
        title: 'Real Estate Videos | Needham & Greater Boston',
        description:
          'Short videos on buying and selling around Needham and Greater Boston — walkthroughs, process explainers and market notes, watchable here without leaving the page.',
        keywords:
          'Needham real estate videos, Boston real estate agent video, home buying videos Massachusetts',
        // The newest reel's own card where there is one, so a share of /videos
        // unfurls with the current video rather than the generic house shot.
        // Already 1200x630 — the poster script crops it to exactly that.
        ogImage: videos.length ? absoluteUrl(ogHref(videos[0])) : undefined,
      }}
      jsonLd={jsonLd}
      eyebrow="Videos"
      h1="Real Estate, in Ninety Seconds"
      lede="Walkthroughs, process explainers and notes from around Needham and Greater Boston. Tap one to watch it here."
      heroSize="standard"
      hero={{
        image:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=65',
        alt: 'A phone recording a video inside a bright, empty living room',
      }}
      width="wide"
      cta={{
        heading: 'Questions the videos did not cover?',
        body:
          'A ninety-second clip has room for one idea. Your situation has more than one — the first conversation is free and commits you to nothing.',
      }}
    >
      <ShellSection width="wide">
        {videos.length === 0 ? (
          /*
            The honest empty state. Deliberately not a grid of placeholders:
            a page of fake cards is the thin templated filler this corpus was
            cleaned of once, and the profile link is genuinely useful.
          */
          <div className="rounded-xl border border-gray-200 bg-bone p-10 text-center">
            <Instagram className="mx-auto h-8 w-8 text-champagne-ink" aria-hidden />
            <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
              The video library is being built
            </h2>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-gray-600">
              New clips go up on Instagram first and land here shortly after.
            </p>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Follow on Instagram
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video, i) => (
                <VideoCard key={video.id} video={video} index={i} onOpen={setActive} />
              ))}
            </div>

            {/*
              The profile link out. Instagram is already in SITE.profiles and so
              already in the schema's sameAs — a visible link on a page about
              that profile's content is what actually corroborates the pairing.
            */}
            <div className="mt-16 border-t border-gray-200 pt-10 text-center">
              <p className="text-gray-600">
                New videos go up on Instagram first.
              </p>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                <Instagram className="h-4 w-4" aria-hidden />
                Follow @{instagramUrl.replace(/\/+$/, '').split('/').pop()}
              </a>
              <p className="mt-6 text-sm text-gray-600">
                Prefer to read?{' '}
                <Link
                  to="/blog"
                  className="font-medium text-champagne-ink underline decoration-champagne decoration-2 underline-offset-4"
                >
                  The blog covers the same ground in more depth
                </Link>
                .
              </p>
            </div>
          </>
        )}
      </ShellSection>

      <VideoLightbox video={active} onClose={() => setActive(null)} />
    </PageShell>
  );
};

export default Videos;
