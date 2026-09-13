import { ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { embedSrc, permalink, type Video } from '@/data/videos';

/**
 * The quick view: Instagram's player, in a modal, loaded ON CLICK.
 *
 * The site is otherwise entirely first-party — SearchListing links out to
 * Google Maps rather than embedding it, for exactly this reason. This is the
 * one deliberate exception, and it is made affordable by never loading until
 * asked: Radix unmounts closed dialog content, which is a problem for FAQ
 * answers and precisely the behaviour wanted here. Until somebody clicks a
 * card, /videos has made no request to instagram.com at all, so the page's
 * Core Web Vitals are those of a page of local WebP images. That is the whole
 * design; if this ever renders eagerly, the trade is lost.
 *
 * Nothing here is prerendered content. `active` is null on the server and on
 * first paint, so the dialog contributes no markup to the built HTML and
 * cannot cause a hydration mismatch. The indexable text lives on the cards.
 */
const VideoLightbox = ({
  video,
  onClose,
}: {
  video: Video | null;
  onClose: () => void;
}) => (
  <Dialog open={video !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      // The close button DialogContent renders is an unbacked white X, which
      // over a bright video frame is invisible. Give it a dark chip.
      className="max-w-[min(100vw-2rem,420px)] gap-0 border-none bg-ink-deep p-0 text-white sm:rounded-xl [&>button]:rounded-full [&>button]:bg-ink-deep/70 [&>button]:p-2 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-sm [&>button:hover]:bg-ink-deep"
      // The embed owns its own controls and the poster was already on screen;
      // pulling focus into the iframe on open would trap a keyboard user in a
      // cross-origin document they cannot tab out of.
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      {video && (
        <>
          {/*
            Radix requires both for the dialog to be announced. They are
            visually hidden because the embed repeats the caption immediately
            below, and showing the title twice reads as a bug.
          */}
          <DialogTitle className="sr-only">{video.title}</DialogTitle>
          <DialogDescription className="sr-only">{video.description}</DialogDescription>

          {/*
            9:16, capped so a portrait reel fits a laptop viewport without
            scrolling the page behind it. The embed adds its own caption strip
            below the video, which is why the frame is taller than 16/9 of the
            width alone.
          */}
          <div className="h-[min(78vh,680px)] w-full overflow-hidden sm:rounded-t-xl">
            <iframe
              // Keyed on the id so reopening a different video swaps the
              // document rather than reusing the previous one's frame.
              key={video.id}
              src={embedSrc(video)}
              title={video.title}
              loading="lazy"
              scrolling="no"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full border-0 bg-ink-deep"
            />
          </div>

          {/*
            Not decoration. Instagram refuses to render some posts in the embed
            — age-gated ones, and some with licensed music — and when it does
            the iframe is simply blank. This link is the fallback for that, so
            it is always visible rather than tucked behind a hover.
          */}
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <p className="min-w-0 truncate text-sm text-gray-300">{video.title}</p>
            <a
              href={permalink(video)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-champagne transition-colors hover:text-white"
            >
              View on Instagram
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
);

export default VideoLightbox;
