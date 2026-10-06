import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Which section of a long page the reader is in, for a sticky index.
 *
 * This replaced an IntersectionObserver in RentalApplicationForm, and the
 * observer was wrong in a way that only showed in one direction. Its callback
 * receives the sections whose state JUST CHANGED, not the ones on screen, and
 * it picked the topmost of those — so the answer depended on which way the page
 * was moving:
 *
 *   - Scrolling DOWN, a section became current when its top crossed 45% of the
 *     viewport. On a tall window the NEXT section had crossed too by the time a
 *     short one reached the top, so "The unit you want" was lit while it sat
 *     mid-screen and had already handed over to "Authorization and signature"
 *     by the time anyone was reading it.
 *   - On a CLICK, the jump lands a section at its scroll-margin (112px) while
 *     the previous section's bottom edge sits one 24px gap above it — at 88px,
 *     exactly the observer's top margin. Edge-adjacent counts as intersecting,
 *     the previous section sorts first, and the index lit the wrong line.
 *   - Scrolling UP happened to be right, because there the section entering the
 *     band is the one at the top of the screen.
 *
 * So this asks a question with one answer whichever way the page is moving:
 * which is the last section whose top has reached a line just under the navbar?
 */

/** A little past `scroll-mt-28` (112px), so a jump link lands above the line. */
const LINE = 128;

/**
 * How long after a jump the page's own scroll events are ignored. An anchor
 * jump is instant, but its scroll event arrives a frame later and would
 * recompute over the section that was just chosen.
 */
const JUMP_SETTLE_MS = 200;

export interface SectionTop {
  id: string;
  /** Distance from the top of the viewport, as getBoundingClientRect reports it. */
  top: number;
}

/**
 * The section the reader is in. Pure, so it can be checked without a browser.
 *
 * `tops` is in document order. `atEnd` means the page cannot scroll any further:
 * whatever is still below the line never will reach it, so the last section is
 * the honest answer rather than one that stopped being on screen.
 */
export const pickActive = (tops: SectionTop[], atEnd: boolean, line = LINE): string | null => {
  if (tops.length === 0) return null;
  if (atEnd) return tops[tops.length - 1].id;
  let current = tops[0].id;
  for (const section of tops) {
    if (section.top > line) break;
    current = section.id;
  }
  return current;
};

/**
 * `ids` must be a stable array (module scope, or memoised) in document order.
 * Sections that are not in the DOM — a conditional one, say — are skipped.
 *
 * Returns the current id and `jumpTo`, which an index link calls on click: it
 * lights the clicked section at once and holds it until the reader next scrolls,
 * so a section too near the end of the page to reach the line is still marked
 * when it is the one that was asked for.
 */
export const useActiveSection = (ids: readonly string[]): [string, (id: string) => void] => {
  // Seeded the same on the server and the client; corrected in the effect.
  const [active, setActive] = useState(ids[0] ?? '');
  const ignoreUntil = useRef(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      if (performance.now() < ignoreUntil.current) return;
      const tops = ids
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null)
        .map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }));
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const next = pickActive(tops, atEnd);
      if (next) setActive(next);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ids]);

  const jumpTo = useCallback((id: string) => {
    ignoreUntil.current = performance.now() + JUMP_SETTLE_MS;
    setActive(id);
  }, []);

  return [active, jumpTo];
};
