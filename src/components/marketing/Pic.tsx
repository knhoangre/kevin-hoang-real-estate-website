import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { sourceUrl } from '@/lib/marketingStore';
import {
  SOFT_PPI,
  drawnOffset,
  drawnSize,
  getPhoto,
  panBy,
  printPpi,
  type MarketingDoc,
  type Photo,
} from '@/lib/marketing';

/**
 * A picture frame in a marketing document, and what the designs share to draw
 * one.
 *
 * THE PICTURE IS THE CONTROL. Click a frame to select it, drag to move the
 * photograph inside it, double-click (or click an empty one) to choose another.
 * Zoom is a slider in the editor, since a wheel over a page that also scrolls
 * is a fight. There is no separate crop screen: what is being adjusted is the
 * page that will print.
 *
 * Three things here look like details and are not:
 *
 *   * THE CROP IS A WHOLE PICTURE BEHIND A WINDOW. The <img> is given the size
 *     and position marketing.ts works out (drawnSize, drawnOffset — with the
 *     proof that no value leaves an empty edge) and the frame clips it. Nothing
 *     is drawn to a canvas, because MLS PIN's photos may be shown but not read.
 *
 *     It is deliberately NOT `object-fit: cover`, which looks identical on
 *     screen. Chrome's PDF writer can embed a JPEG as the file it already is
 *     only when the WHOLE picture is drawn; ask it for a part of one, which is
 *     what object-fit does, and it stores that part uncompressed. Measured on
 *     2026-10-09 with one listing's photos: a booklet whose frames matched the
 *     photos' shape saved as 6.6 MB, and two whose frames cropped them saved as
 *     24 and 26 MB — over Gmail's limit for an attachment. `object-fit` is only
 *     the fallback for the moment before a picture's size is known.
 *
 *   * A DRAG USES POINTER CAPTURE, not listeners on `window`. These frames live
 *     in another document (DocFrame's iframe), and the `window` this module
 *     sees is not the one the pointer is moving over.
 *
 *   * "WILL PRINT SOFT" IS MEASURED, from the photograph's real size once it
 *     has loaded against the frame's size on paper. `naturalWidth` is readable
 *     for a cross-origin image even though its pixels are not.
 */

export interface DocContextValue {
  doc: MarketingDoc;
  selected: string | null;
  select: (key: string | null) => void;
  /** Open the picture chooser for a frame. */
  pick: (key: string) => void;
  put: (key: string, photo: Photo | null) => void;
  /** Frame key -> how its picture fits. A frame the design does not list is a photograph. */
  fits: Record<string, 'cover' | 'contain'>;
}

const DocContext = createContext<DocContextValue | null>(null);

export const DocProvider = DocContext.Provider;

export const useDoc = (): DocContextValue => {
  const value = useContext(DocContext);
  if (!value) throw new Error('A marketing design was rendered outside its document.');
  return value;
};

/** How far a pointer travels before a press is a drag rather than a click. */
const DRAG_START_PX = 3;
/** One press of an arrow key, as a share of the room there is to move in. */
const NUDGE = 0.03;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const Pic = ({ slot, className = '' }: { slot: string; className?: string }) => {
  const { doc, selected, select, pick, put, fits } = useDoc();
  const photo = getPhoto(doc, slot);
  const fit = fits[slot] ?? 'cover';
  const url = photo ? sourceUrl(photo.src) : null;

  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [broken, setBroken] = useState(false);

  // Another picture: forget what was known about the last one.
  useEffect(() => {
    setNatural(null);
    setBroken(false);
  }, [url]);

  // The frame's size in the document's own pixels, which are its size on paper.
  // Read after every layout rather than once: switching designs moves frames.
  useLayoutEffect(() => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return;
    setSize((was) =>
      was && Math.abs(was.w - rect.width) < 0.5 && Math.abs(was.h - rect.height) < 0.5
        ? was
        : { w: rect.width, h: rect.height }
    );
  });

  const soft =
    photo && natural && size
      ? printPpi(size.w, size.h, natural.w, natural.h, photo.zoom, fit) < SOFT_PPI
      : false;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    select(slot);
    if (!photo) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !photo || !natural || !size) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_START_PX) return;
    d.moved = true;
    d.x = event.clientX;
    d.y = event.clientY;
    put(slot, panBy(photo, dx, dy, size.w, size.h, natural.w, natural.h, fit));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pick(slot);
      return;
    }
    if (!photo) return;
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    };
    const move = step[event.key];
    if (!move) return;
    event.preventDefault();
    put(slot, { ...photo, x: clamp01(photo.x + move[0]), y: clamp01(photo.y + move[1]) });
  };

  // Where the whole picture sits behind the frame, as shares of the frame so it
  // holds if the frame is resized. Until the picture has loaded its shape is
  // unknown, and the stylesheet's `object-fit` stands in.
  const pct = (part: number, of: number) => `${(part / of) * 100}%`;
  let place: React.CSSProperties | undefined;
  if (photo && natural && size && size.w > 0 && size.h > 0) {
    const drawn = drawnSize(size.w, size.h, natural.w, natural.h, photo.zoom, fit);
    const at = drawnOffset(photo, size.w, size.h, drawn);
    place = {
      inset: 'auto',
      left: pct(at.left, size.w),
      top: pct(at.top, size.h),
      width: pct(drawn.w, size.w),
      height: pct(drawn.h, size.h),
      maxWidth: 'none',
      objectFit: 'fill',
    };
  } else if (photo) {
    place = { objectPosition: `${photo.x * 100}% ${photo.y * 100}%` };
  }

  return (
    <div
      ref={frame}
      className={`pic ${fit} ${photo && !broken ? '' : 'is-empty'} ${
        selected === slot ? 'is-selected' : ''
      } ${className}`}
      data-slot={slot}
      role="button"
      tabIndex={0}
      aria-label={photo ? 'Picture: drag to move, Enter to change' : 'Empty frame: Enter to add a picture'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={() => {
        if (!photo) pick(slot);
      }}
      onDoubleClick={() => pick(slot)}
      onKeyDown={onKeyDown}
    >
      {photo && url && !broken && (
        <img
          src={url}
          alt=""
          draggable={false}
          onLoad={(event) =>
            setNatural({
              w: event.currentTarget.naturalWidth,
              h: event.currentTarget.naturalHeight,
            })
          }
          onError={() => setBroken(true)}
          style={place}
        />
      )}
      {(!photo || broken) && (
        <span className="ui pic-empty">{broken ? 'Picture unavailable' : 'Add a picture'}</span>
      )}
      {soft && (
        <span className="ui pic-flag">
          {size && size.w < 190 ? 'Soft' : 'Small photo — will print soft'}
        </span>
      )}
      <span className="ui pic-ring" />
    </div>
  );
};

export default Pic;
