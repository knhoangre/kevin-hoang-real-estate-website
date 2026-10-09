/**
 * A listing's photographs: a carousel on the page, and a full-screen view of
 * every photo to scroll through.
 *
 * One component for both listing pages — /search/<mls> and /properties/<slug>
 * each carried their own copy of the same shadcn carousel, with the same two
 * 32px arrow buttons as the only way to move by mouse.
 *
 * THE PICTURE IS THE CONTROL. The arrows were small targets over a large image,
 * and the image itself did nothing. Now the photo is three zones:
 *
 *   left edge     previous photo
 *   right edge    next photo
 *   the middle    opens every photo, full screen
 *
 * The arrows are still drawn — bigger, and now a picture of what the edge does
 * rather than the thing you have to hit.
 *
 * THE ZONES ARE INSIDE THE CAROUSEL'S VIEWPORT, and that is load-bearing. Embla
 * listens for drags on its viewport element and treats that element's FIRST
 * child as the sliding track, ignoring the rest. Buttons laid over the carousel
 * from outside (which is where shadcn's arrows sit) would swallow every touch
 * that started on them, so a phone could only be swiped from the middle 56% of
 * the photo. As later children of the viewport they stay put while the track
 * moves, and a touch that starts on one still bubbles to Embla. It also means
 * Embla's own click suppression covers them: it cancels the click that ends a
 * drag in the capture phase, on the viewport, so finishing a swipe with a
 * finger over the right edge does not also skip a photo.
 *
 * FULL SCREEN IS A COLUMN, NOT A SECOND CAROUSEL. Somebody deciding about a
 * house wants to go through all of it, and scrolling is the gesture for that on
 * every device — one flick moves three rooms, where a carousel is forty taps.
 * It opens at the photo that was showing.
 *
 * Each photo sits in a fixed 4:3 frame, `object-contain`. The frame is what
 * lets the view open AT a photo: with lazy images and no reserved height, the
 * column is a few hundred pixels tall at the moment it has to scroll to photo
 * thirty. `contain` rather than `cover` because this is the view for looking
 * properly, and a cropped kitchen is not the kitchen.
 */
import { useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, Images, X } from 'lucide-react';

interface ListingGalleryProps {
  photos: string[];
  /**
   * The street address. It is the alt text's subject ("<address> — photo 3 of
   * 42") and the full-screen view's title. Positional alt text is deliberate:
   * nobody recorded what each room is, and describing photographs nobody looked
   * at is the fabrication the copy rules forbid.
   */
  address: string;
  className?: string;
  /**
   * A quiet line at the foot of the full-screen view. On an IDX listing this is
   * the listing office: that view covers the page, attribution included, and
   * photos from the feed are an IDX display wherever they are shown.
   */
  credit?: React.ReactNode;
}

/** Shared by the two edge zones. `group/zone` lets the arrow react to the whole edge. */
const EDGE =
  'group/zone absolute inset-y-0 z-10 flex w-[22%] min-w-16 items-center focus-visible:outline-none';

/**
 * How far below the top of the full-screen view a photo is placed when the view
 * opens on it: the 64px bar, and a little air. Done with arithmetic rather than
 * `scroll-margin-top`, because the frames are `overflow-hidden` and Chromium 131
 * ignores scroll-margin on such an element — measured: the view opened with the
 * photo's top edge, and its "5 / 39", underneath the bar.
 */
const BAR_CLEARANCE = 72;

const ARROW =
  'relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-md ring-1 ring-black/5 transition duration-200 group-hover/zone:scale-110 group-hover/zone:bg-white group-focus-visible/zone:ring-2 group-focus-visible/zone:ring-champagne sm:h-12 sm:w-12';

const ListingGallery = ({ photos, address, className = '', credit }: ListingGalleryProps) => {
  const total = photos.length;
  const [viewport, api] = useEmblaCarousel({ loop: total > 1 });
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  /** The photo the full-screen view opens on. A ref: it is read once, as it opens. */
  const startAt = useRef(0);
  const figures = useRef<(HTMLElement | null)[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  /** The photo that was selected when the pointer went down — see `clickedOn`. */
  const pressed = useRef(0);

  useEffect(() => {
    if (!api) return undefined;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect).on('reInit', onSelect);
    return () => {
      api.off('select', onSelect).off('reInit', onSelect);
    };
  }, [api]);

  if (total === 0) return null;

  const alt = (i: number) => `${address} — photo ${i + 1} of ${total}`;

  const openAt = (i: number) => {
    startAt.current = i;
    setOpen(true);
  };

  /*
   * WHICH PHOTO A CLICK STARTED ON — and why the edges do not simply call
   * api.scrollNext().
   *
   * Because the zones are inside the viewport, Embla sees the press that begins
   * every click. A press while the carousel is still sliding GRABS it: Embla
   * stops the slide where it is and, on release, settles on whichever photo is
   * nearer — usually the one being left. scrollNext() after that goes "next"
   * from the wrong place, so somebody clicking the right edge quickly to skim a
   * house moved one photo for every two clicks. Found by clicking twice.
   *
   * So the photo that was selected when the pointer went down is written here,
   * before Embla's release can change it, and a click steps from THAT. A press
   * that turns into a real swipe never produces a click at all (Embla cancels
   * it), so this is only ever read for a genuine click.
   */
  /** A keyboard "click" has no press behind it (`detail` is 0); ask Embla instead. */
  const clickedOn = (e: React.MouseEvent) =>
    e.detail === 0 ? (api?.selectedScrollSnap() ?? index) : pressed.current;
  const step = (e: React.MouseEvent, by: 1 | -1) =>
    api?.scrollTo((clickedOn(e) + by + total) % total);

  return (
    <div
      className={`relative ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={`Photos of ${address}`}
      onKeyDownCapture={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          api?.scrollPrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          api?.scrollNext();
        }
      }}
    >
      <div
        ref={viewport}
        className="relative overflow-hidden rounded-2xl bg-gray-100"
        onPointerDown={() => {
          if (api) pressed.current = api.selectedScrollSnap();
        }}
      >
        {/* The track. Must stay the viewport's first child — see the note above. */}
        <div className="flex">
          {photos.map((src, i) => (
            <div
              key={src}
              role="group"
              aria-roledescription="slide"
              className="min-w-0 shrink-0 grow-0 basis-full"
            >
              <div className="aspect-[16/10]">
                <img
                  src={src}
                  alt={alt(i)}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? undefined : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : undefined}
                  decoding="async"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>

        {/*
          The middle. Out of the tab order and hidden from assistive tech on
          purpose: it is a mouse-and-touch shortcut for the labelled "View all
          photos" button below, and a second, unlabelled, photo-sized stop
          before it would be noise to anyone arriving by keyboard.
        */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={(e) => openAt(clickedOn(e))}
          className={`absolute inset-y-0 z-10 cursor-zoom-in ${
            total > 1 ? 'left-[22%] right-[22%]' : 'inset-x-0'
          }`}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => step(e, -1)}
              aria-label="Previous photo"
              className={`${EDGE} left-0 justify-start pl-3 sm:pl-4`}
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover/zone:opacity-100 group-focus-visible/zone:opacity-100"
              />
              <span className={ARROW}>
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => step(e, 1)}
              aria-label="Next photo"
              className={`${EDGE} right-0 justify-end pr-3 sm:pr-4`}
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-l from-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover/zone:opacity-100 group-focus-visible/zone:opacity-100"
              />
              <span className={ARROW}>
                <ArrowRight className="h-5 w-5" aria-hidden />
              </span>
            </button>

            <p
              aria-live="polite"
              className="numeral pointer-events-none absolute bottom-3 left-3 z-20 rounded-full bg-ink-deep/75 px-3 py-1.5 text-xs font-medium text-white"
            >
              {index + 1} / {total}
            </p>
          </>
        )}

        {/* Above the right-hand zone it overlaps, so pressing it opens the
            photos rather than moving to the next one. */}
        <button
          type="button"
          onClick={(e) => openAt(clickedOn(e))}
          className="numeral absolute bottom-3 right-3 z-20 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-ink shadow-md transition-colors hover:bg-champagne hover:text-ink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2"
        >
          <Images className="h-4 w-4" aria-hidden />
          {total > 1 ? `View all ${total} photos` : 'View photo'}
        </button>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          {/* z-[60]: the site's navbar is fixed at z-50 and this covers it. */}
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink-deep" />
          <Dialog.Content
            ref={scroller}
            // The title says what this is; there is nothing further to describe.
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              // Radix would focus the first focusable thing and scroll to it.
              // Focus the close button without scrolling, then go to the photo
              // that was showing. This element is `fixed`, so it is the frames'
              // offsetParent and offsetTop is already a scroll position.
              e.preventDefault();
              closeButton.current?.focus({ preventScroll: true });
              const figure = figures.current[startAt.current];
              if (figure && scroller.current) {
                scroller.current.scrollTop = Math.max(0, figure.offsetTop - BAR_CLEARANCE);
              }
            }}
            className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-ink-deep text-white focus:outline-none"
          >
            <div className="sticky top-0 z-10 border-b border-white/10 bg-ink-deep/95 backdrop-blur">
              <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="numeral truncate text-sm font-semibold text-white">
                    {address}
                  </Dialog.Title>
                  <p className="numeral text-xs text-gray-400">
                    {total} {total === 1 ? 'photo' : 'photos'}
                  </p>
                </div>
                <Dialog.Close
                  ref={closeButton}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/25 px-4 text-sm font-semibold text-white transition-colors hover:border-champagne hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                >
                  <X className="h-4 w-4" aria-hidden />
                  Close
                </Dialog.Close>
              </div>
            </div>

            <div className="mx-auto max-w-5xl space-y-2 py-2 sm:space-y-4 sm:px-4 sm:py-6">
              {photos.map((src, i) => (
                <figure
                  key={src}
                  ref={(el) => {
                    figures.current[i] = el;
                  }}
                  className="relative aspect-[4/3] overflow-hidden bg-black sm:rounded-lg"
                >
                  <img
                    src={src}
                    alt={alt(i)}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  {total > 1 && (
                    <figcaption className="numeral absolute left-3 top-3 rounded-full bg-ink-deep/70 px-2.5 py-1 text-[11px] font-medium text-white">
                      {i + 1} / {total}
                    </figcaption>
                  )}
                </figure>
              ))}

              <div className="space-y-5 px-4 pb-8 pt-4 text-center">
                {credit && <p className="text-xs text-gray-400">{credit}</p>}
                <Dialog.Close className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-deep transition-colors hover:bg-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back to the listing
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default ListingGallery;
