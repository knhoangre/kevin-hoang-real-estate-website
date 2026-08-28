import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** prefix, the number itself, then whatever trails it ("4.9 ★" -> "", "4.9", " ★"). */
const NUMERIC = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/;

const DURATION_MS = 1100;

/**
 * A stat that rolls up to its value the first time it is scrolled into view.
 *
 * The number is rendered in full on the server and on the first client render,
 * so the prerendered HTML carries the real figure and hydration matches. The
 * animation is started from an effect afterwards, which is also why a crawler
 * or a JS-less reader sees the final value rather than a zero.
 *
 * During the animation the text is written straight to the DOM node rather than
 * through state — sixty setState calls a second per tile would re-render the
 * whole row for no benefit. React's copy is reconciled at the end.
 *
 * A non-numeric value ("Broker") renders untouched.
 */
const CountUp = ({ value, className }: { value: string; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [text] = useState(value);

  useEffect(() => {
    const node = ref.current;
    const match = value.match(NUMERIC);
    if (!node || !match || prefersReducedMotion()) return;

    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replace(/,/g, ''));
    if (!Number.isFinite(target)) return;

    const decimals = (digits.split('.')[1] ?? '').length;

    // A year counted up from zero reads as a tally rather than a date, so it
    // rolls through the preceding couple of decades instead.
    const isYear = decimals === 0 && target >= 1900 && target <= 2100;
    const from = isYear ? target - 20 : 0;

    const paint = (n: number) => {
      node.textContent = `${prefix}${n.toFixed(decimals)}${suffix}`;
    };

    let frame = 0;
    let settle = 0;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((e) => e.isIntersecting)) return;
        started = true;
        observer.disconnect();

        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / DURATION_MS);
          const eased = 1 - (1 - p) ** 3; // easeOutCubic
          if (p < 1) {
            paint(from + (target - from) * eased);
            frame = requestAnimationFrame(step);
          } else {
            // Land on the source string so any formatting we did not parse
            // (a thousands separator, the star) is exactly as authored.
            node.textContent = value;
          }
        };
        paint(from);
        frame = requestAnimationFrame(step);

        // Backstop. requestAnimationFrame is throttled or suspended in a
        // background tab, and a reader who switches away mid-roll and comes
        // back should not find a half-counted figure sitting there. Whatever
        // happens to the frame loop, the real number is on screen after this.
        settle = window.setTimeout(() => {
          node.textContent = value;
        }, DURATION_MS * 3);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, [value]);

  return (
    <div ref={ref} className={className}>
      {text}
    </div>
  );
};

export default CountUp;
